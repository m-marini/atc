import { fromJS, Set } from 'immutable';
import _ from 'lodash';
import { buildEvent, EVENT_TYPES } from './Events';
import { Flight, FLIGHT_STATES, FLIGHT_TYPES } from './Flight';
import { mapDao } from './MapDao';

const MAX_INITIAL_IDLE_INTERVAL = 20;

const COMMAND_TYPES = {
    CHANGE_LEVEL: 'changeLevel',
    TURN_HEADING: 'turnHeading',
    HOLD: 'hold',
    CLEAR_TO_LAND: 'clearToLand',
};

const COMMAND_CONDITIONS = {
    IMMEDIATE: 'immediate'
};

const NODE_TYPES = {
    RUNWAY: 'runway',
    BEACON: 'beacon',
    ENTRY: 'entry'
};

const TRAFFIC_SIM_DEFAULTS = {
    dt: 10,                     // sec
    jetProb: 0.5,
    safeEntryDelay: 120,        // sec
    entryAlt: 28000,            // feet
    exitAlt: 36000,             // feet
    collisionDistance: 4,       // nms
    collisionAlt: 1000,         // feet
    om: 7,                      // nms
    clearToLandDistance: 25,    // nms
    exitDistance: 2,            // nms
    landingHdgRange: 1,         // DEG
    approachHdgRange: 15,       // DEG
    landingAngle: 3,            // DEG
    landingHdgTrim: 1,          // DEG
    touchdownRange: 500,        // feet
    conditionDistance: 400 / 3600 * 10 * 1.5, // nms
    holdingDuration: 240,       // sec
    goAroundAlt: 4000,          // feet
    flightTempl: {
        J: {
            speed0: 140,        // nmh
            speed360: 440,      // nmh
            vspeed: 1500        // fpm
        },
        A: {
            speed0: 80,         // nmh
            speed360: 280,      // nmh
            vspeed: 700         // fpm
        }
    }
};

/**
 * 
 * @param {*} alt 
 * @param {*} template 
 */
function flightSpeed(alt, template) {
    return Math.round(alt / 36000 * (template.speed360 - template.speed0) + template.speed0);
}

/**
 * 
 * @param {*} items 
 */
function choose(items) {
    return items[rndInt(items.length)];
}

/**
 * 
 * @param {*} prob 
 */
function rndByProb(prob) {
    return Math.random() < prob;
}

/**
 * 
 * @param {*} prob 
 */
function rndByFreq(t, f) {
    const prob = -Math.expm1(-t * f);
    const result = rndByProb(prob);
    return result;
}

/**
 * 
 * @param {*} n 
 */
function rndInt(n) {
    return Math.floor(Math.random() * n);
}

/**
 * 
 */
class TrafficSimulator {

    constructor(props) {
        const session = props.session instanceof Map ? props.session : fromJS(props.session);
        this.props = _.defaults({ session }, props, TRAFFIC_SIM_DEFAULTS);
        _.bindAll(this);
    }

    /** Returns the session */
    get sessionJS() { return this.props.session.toJS(); }

    withSession(session) {
        return new TrafficSimulator(_.defaults({ session }, this.props));
    }

    fireEvent(type, flight, cmd) {
        const { onEvent } = this.props;
        if (!!onEvent) {
            const event = buildEvent(type, flight, this.props.map, cmd);
            onEvent(event);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processCommand(cmd) {
        const { flight: flightId } = cmd;
        const { session } = this.props;
        const flight = session.getIn(['flights', flightId]);
        if (!flight) {
            // No flight in the session
            this.fireEvent(EVENT_TYPES.UNKWOWN_FLIGHT, undefined, cmd);
            return this;
        }
        const newFlight = new Flight(flight, this.props).processCommand(cmd).flight;
        const newSession = session.setIn(['flights', flightId], newFlight);
        return this.withSession(newSession);
    }

    /**
     * 
     */
    transition() {
        return this.processFlights()
            .filterForLanded()
            .filterForOutOfArea()
            .filterForExited()
            .filterCollision()
            .processForNewFlight()
            .addTime();
    }

    /**
     * 
     */
    filterCollision() {
        const { collisionAlt, collisionDistance } = this.props;
        const { flights } = this.sessionJS;
        const flightsAry = _.values(flights);
        var collision = Set.of();
        for (var i = 0; i < flightsAry.length; i++) {
            for (var j = i + 1; j < flightsAry.length; j++) {
                const a = flightsAry[i];
                const b = flightsAry[j];
                const ds = mapDao.distance(a, b);
                const da = Math.abs(a.alt - b.alt)
                const collided = a.status !== FLIGHT_STATES.WAITING_FOR_TAKEOFF
                    && b.status !== FLIGHT_STATES.WAITING_FOR_TAKEOFF
                    && da <= collisionAlt
                    && ds <= collisionDistance;
                if (collided) {
                    collision = collision.add(a.id).add(b.id)
                }
            }
        }

        const [collided, notCollided] = _.partition(flights, f => collision.has(f.id));
        const noCollided = collided.length;
        if (noCollided > 0) {
            const notCollidedMap = _(notCollided)
                .groupBy('id')
                .mapValues(f => f[0])
                .value();
            const newSession = this.props.session
                .set('flights', fromJS(notCollidedMap))
                .update('noCollision', n => n + noCollided)
            // Sending message
            collided.forEach(flight => {
                this.fireEvent(EVENT_TYPES.COLLISION, flight);
            });
            return this.withSession(newSession);
        }
        return this;
    }

    /**
     * 
     */
    filterForExited() {
        const { exitAlt } = this.props;
        const [exited, notExited] = _.partition(this.sessionJS.flights,
            { status: FLIGHT_STATES.EXITED });
        const noExited = exited.length;
        if (noExited > 0) {
            const exitedOk = _.filter(exited, f => {
                return f.alt === exitAlt
                    && f.to === f.exit
            });
            const ok = exitedOk.length;
            const ko = noExited - ok;
            const notExitedMap = _(notExited)
                .groupBy('id')
                .mapValues(f => f[0])
                .value();
            const newSession = this.props.session
                .set('flights', fromJS(notExitedMap))
                .update('noExitOk', n => n + ok)
                .update('noExitKo', n => n + ko);
            // Sending message
            exited.forEach(flight => {
                const ok = _.find(exitedOk, { id: flight.id }) !== undefined;
                if (ok) {
                    this.fireEvent(EVENT_TYPES.RIGHT_LEAVE, flight);
                } else {
                    this.fireEvent(EVENT_TYPES.WRONG_LEAVE, flight)
                }
            });
            return this.withSession(newSession);
        }
        return this;
    }

    /**
     * 
     */
    filterForOutOfArea() {
        const { map, exitDistance } = this.props;
        const { center } = map;
        const coords = mapDao.coords(map.nodes, center);
        const flights = this.sessionJS.flights;
        const [exited, inArea] = _.partition(flights,
            f => {
                const pts = mapDao.xy(f, center);
                return pts[0] < coords.xmin - exitDistance
                    || pts[0] > coords.xmax + exitDistance
                    || pts[1] < coords.ymin - exitDistance
                    || pts[1] > coords.ymax + exitDistance;
            });
        if (exited.length > 0) {
            const inAreaMap = _(inArea)
                .groupBy('id')
                .mapValues(f => f[0])
                .value();
            const newSession = this.props.session
                .set('flights', fromJS(inAreaMap))
                .update('noExitKo', n => n + exited.length)
            exited.forEach(flight => {
                this.fireEvent(EVENT_TYPES.OUT_OF_AREA, flight);
            });
            // Sending message
            return this.withSession(newSession);
        } else {
            return this;
        }
    }

    /**
     * 
     */
    filterForLanded() {
        const [landed, notLanded] = _.partition(this.sessionJS.flights,
            { status: FLIGHT_STATES.LANDED });
        const noLanded = landed.length;
        if (noLanded > 0) {
            const landedOk = _.filter(landed, f => f.to === f.rwy);
            const ok = landedOk.length;
            const ko = noLanded - ok;
            const notLandedMap = _(notLanded)
                .groupBy('id')
                .mapValues(f => f[0])
                .value();
            const newSession = this.props.session
                .set('flights', fromJS(notLandedMap))
                .update('noLandedOk', n => n + ok)
                .update('noLandedKo', n => n + ko);
            // Sending message
            landed.forEach(flight => {
                const ok = _.find(landedOk, { id: flight.id }) !== undefined;
                if (ok) {
                    this.fireEvent(EVENT_TYPES.RIGHT_LAND, flight);
                } else {
                    this.fireEvent(EVENT_TYPES.WRONG_LAND, flight);
                }
            });
            return this.withSession(newSession);
        } else {
            return this;
        }
    }

    /**
     * 
     */
    addTime() {
        return this.withSession(this.props.session.updateIn(['t'],
            t => t + this.props.dt)
        );
    }

    /**
     * 
     */
    processFlights() {
        const { session } = this.props;
        const flights = session.get('flights');
        if (flights.size > 0) {
            const newSession = session.update('flights', flights => {
                return flights.map(flight => {
                    return new Flight(flight, this.props).processTime().flight;
                });
            });
            return this.withSession(newSession);
        } else {
            return this;
        }
    }

    /**
     * 
     * @param {*} sessionMap 
     */
    processForNewFlight() {
        const { dt, level, session } = this.props;
        const { maxPlane, flightFreq } = level;
        const flights = session.get('flights');
        const t = session.get('t');
        const noFlights = session.get('noFlights');
        //Check for new flight eligibility
        if (flights.size < maxPlane && (
            rndByFreq(dt, flightFreq / 3600)
            || (noFlights === 0 && t >= MAX_INITIAL_IDLE_INTERVAL))) {
            return this.createFlight();
        } else {
            return this;
        }
    }

    /**
     * 
     */
    createEntryCandidates() {
        const { safeEntryDelay, session } = this.props;
        const entries = session.get('entries');
        const t = session.get('t');
        const entryTimeout = t - safeEntryDelay;
        return _(this.props.map.nodes)
            .filter(node =>
                node.type === NODE_TYPES.RUNWAY
                || (node.type === NODE_TYPES.ENTRY
                    && (!entries.get(node.id)
                        || entries.get(node.id) < entryTimeout)
                )
            ).value();
    }

    /**
     * 
     */
    createExitCandidates() {
        return _(this.props.map.nodes)
            .filter(node => node.type === NODE_TYPES.RUNWAY || node.type === NODE_TYPES.ENTRY)
            .value();
    }

    /**
     * 
     * @param {*} sessionMap 
     */
    createFlight() {
        const { jetProb, entryAlt, flightTempl, session } = this.props;
        const noFlights = session.get('noFlights');
        const t = session.get('t');
        const entry = choose(this.createEntryCandidates());
        const to = choose(this.createExitCandidates());
        const type = rndByProb(jetProb) ? FLIGHT_TYPES.JET : FLIGHT_TYPES.AIRPLANE;
        const id = String.fromCharCode(noFlights % 26 + 65) + Math.floor(noFlights / 26 + 1);
        const alt = entry.type === NODE_TYPES.RUNWAY ? 0 : entryAlt;
        const status = entry.type === NODE_TYPES.RUNWAY ? FLIGHT_STATES.WAITING_FOR_TAKEOFF : FLIGHT_STATES.FLYING;
        const speed = entry.type === NODE_TYPES.RUNWAY ? 0 : flightSpeed(alt, flightTempl[type]);
        const flight = _.defaults({
            id,
            type,
            alt,
            toAlt: alt,
            hdg: entry.hdg,
            to: to.id,
            lat: entry.lat,
            lon: entry.lon,
            speed,
            from: entry.id,
            status
        })

        this.fireEvent(EVENT_TYPES.ENTER, flight);
        const newSession = entry.type === NODE_TYPES.RUNWAY
            ? session
            : session
                .setIn(['entries', entry.id], t);
        return this.withSession(newSession
            .set('noFlights', noFlights + 1)
            .setIn(['flights', flight.id], flight)
        );
    }
}

export { TrafficSimulator, NODE_TYPES, FLIGHT_TYPES, FLIGHT_STATES, COMMAND_TYPES, COMMAND_CONDITIONS, TRAFFIC_SIM_DEFAULTS };
