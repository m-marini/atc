import { fromJS, Map, Set } from 'immutable';
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
    mm: 0.9,                    // nms (5469')
    clearToLandDistance: 30,    // nms
    exitDistance: 2,            // nms
    landingHdgRange: 2,         // DEG
    landingAngle: 3,            // DEG
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

// Descend speed 1500 feet/min = 25 feet/s
// Descend speed 700 feet/min = 12 feet/s
// Descent speed for landing slope from FL040 at 173 Knots = 173/60/1852*0.3*tan(3DEG) = 932 feet/min = 15 feet/s
// Descent speed for landing slope from FL040 at 102 Knots = 80/60/1852*0.3*tan(3DEG) = 431 feet/min = 7 feet/s

const VOICES = ['george', 'john'];

/**
 * 
 * @param {*} len 
 */
function rndFlightId(tmpl = 'X99X') {
    const id = _.map(tmpl, mode =>
        (mode === 'X')
            ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
            : String.fromCharCode(48 + Math.floor(Math.random() * 10))
    ).join('');
    return id;
}

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
    return items.length <= 1 ? items[0] : items[rndInt(items.length)];
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

    constructor(session, props) {
        this.props = _.defaults(props, TRAFFIC_SIM_DEFAULTS);
        this._session = session;
        _.bindAll(this);
    }

    /** Returns the session */
    get session() { return this._session; }

    withSession(session) {
        return new TrafficSimulator(session, this.props);
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
        const flight = this.session.flights[flightId];
        if (!flight) {
            // No flight in the session
            this.fireEvent(EVENT_TYPES.UNKWOWN_FLIGHT, undefined, cmd);
            return this;
        }
        const newFlight = new Flight(flight, this.props).processCommand(cmd).flight;
        const newSession = fromJS(this.session).setIn(['flights', flightId], newFlight).toJS();
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
        const { flights } = this.session;
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
            const newSession = fromJS(this.session)
                .set('flights', notCollidedMap)
                .update('noCollision', n => n + noCollided)
                .toJS();
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
        const [exited, notExited] = _.partition(this.session.flights,
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
            const newSession = fromJS(this.session)
                .set('flights', notExitedMap)
                .update('noExitOk', n => n + ok)
                .update('noExitKo', n => n + ko)
                .toJS();
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
        const flights = this.session.flights;
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
            const newSession = Map(this.session)
                .set('flights', fromJS(inAreaMap))
                .update('noExitKo', n => n + exited.length)
                .toJS();
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
        const [landed, notLanded] = _.partition(this.session.flights,
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
            const newSession = Map(this.session)
                .set('flights', notLandedMap)
                .update('noLandedOk', n => n + ok)
                .update('noLandedKo', n => n + ko)
                .toJS();
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
        return this.withSession(
            fromJS(this.session)
                .updateIn(['t'], t => t + this.props.dt)
                .toJS()
        );
    }

    /**
     * 
     */
    processFlights() {
        const { flights } = this.session;
        if (_.size(flights) > 0) {
            const newFlights = _.mapValues(flights, flight =>
                new Flight(flight, this.props).processTime().flight
            );
            const newSession = Map(this.session).set('flights', newFlights).toJS();
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
        const { dt, level } = this.props;
        const { maxPlane, flightFreq } = level;
        const { flights, t, noFlights } = this.session;
        //Check for new flight eligibility
        if (_.size(flights) < maxPlane && (
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
        const { safeEntryDelay } = this.props;
        const { entries, t } = this.session;
        const entryTimeout = t - safeEntryDelay;
        return _(this.props.map.nodes)
            .filter(node =>
                node.type === NODE_TYPES.RUNWAY
                || (node.type === NODE_TYPES.ENTRY
                    && (!entries[node.id]
                        || entries[node.id] < entryTimeout)
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
        const { jetProb, entryAlt, flightTempl } = this.props;
        const { noFlights, t, flights } = this.session;
        const entry = choose(this.createEntryCandidates());
        const to = choose(this.createExitCandidates());
        const type = rndByProb(jetProb) ? FLIGHT_TYPES.JET : FLIGHT_TYPES.AIRPLANE;
        var id = undefined;
        do {
            id = rndFlightId();
        } while (flights[id] !== undefined);
        //const id = String.fromCharCode(noFlights % 26 + 65) + Math.floor(noFlights / 26 + 1);
        const alt = entry.type === NODE_TYPES.RUNWAY ? 0 : entryAlt;
        const status = entry.type === NODE_TYPES.RUNWAY ? FLIGHT_STATES.WAITING_FOR_TAKEOFF : FLIGHT_STATES.FLYING;
        const speed = entry.type === NODE_TYPES.RUNWAY ? 0 : flightSpeed(alt, flightTempl[type]);
        const atcVoice = this.props.map.voice;
        const voices = VOICES.filter(v => v !== atcVoice);
        const voice = choose(voices);
        const flight = {
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
            status,
            voice
        };

        this.fireEvent(EVENT_TYPES.ENTER, flight);
        const sessionMap = fromJS(this.session)
            .set('noFlights', noFlights + 1)
            .setIn(['flights', flight.id], flight);
        const sessionMap1 = entry.type === NODE_TYPES.RUNWAY
            ? sessionMap
            : sessionMap.setIn(['entries', entry.id], t);
        return this.withSession(sessionMap1.toJS());
    }
}

export { TrafficSimulator, NODE_TYPES, FLIGHT_TYPES, FLIGHT_STATES, COMMAND_TYPES, COMMAND_CONDITIONS, TRAFFIC_SIM_DEFAULTS };
