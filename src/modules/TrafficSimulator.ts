import { fromJS, Set } from 'immutable';
import _ from 'lodash';
import { Flight, FlightStatus, FlightType } from './Flight';
import { FlightProcessor, FlightTemplate, SimulationOptions, SimulationProps } from './FlightProcessor';
import { HeadingMapNode, isRunway, MapNode, MapNodeType } from './Map';
import { mapDao } from './MapDao';
import {
    buildClearedToLeaveMessage,
    buildCollisionMessage,
    buildDepartureLeaveMessage,
    buildDepartureToMessage, buildEnterLeaveMessage, buildEnterToMessage, buildFlightNotFoundMessage, buildGoodDayMessage, buildHoldShortCommand, buildLeavingMessage, buildLeavingMissingDepartureMessage, buildOutOfAreaMessage,
    buildReadbackMessage,
    buildRogerMessage, buildRunwayVacated, buildWrongRunwayVacated, CommandMessage,
    Message
} from './Message';
import { Session } from './Session';

const MAX_INITIAL_IDLE_INTERVAL = 20;

export const DefaultSimProps: SimulationOptions = Object.freeze({
    dt: 1,                      // sec
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
    },
    flightVoices: []
});

// Descend speed 1500 feet/min = 25 feet/s
// Descend speed 700 feet/min = 12 feet/s
// Descent speed for landing slope from FL040 at 173 Knots = 173/60/1852*0.3*tan(3DEG) = 932 feet/min = 15 feet/s
// Descent speed for landing slope from FL040 at 102 Knots = 80/60/1852*0.3*tan(3DEG) = 431 feet/min = 7 feet/s

/**
 * 
 * @param tmpl 
 */
function rndFlightId(tmpl: string = 'X99X'): string {
    const id = _.map(tmpl, mode =>
        (mode === 'X')
            ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
            : String.fromCharCode(48 + Math.floor(Math.random() * 10))
    ).join('');
    return id;
}

/**
 * 
 * @param lambda 
 */
function rndPoisson(lambda: number): number {
    var k = -1;
    var p = 1;
    var l = Math.exp(-lambda);
    do {
        ++k;
        p *= Math.random();
    } while (p > l);
    return k;
}

/**
 * 
 * @param alt 
 * @param template 
 */
function flightSpeed(alt: number, template: FlightTemplate): number {
    return Math.round(alt / 36000 * (template.speed360 - template.speed0) + template.speed0);
}

/**
 * 
 * @param items 
 */
export function choose<T>(items: T[]): T {
    return items.length <= 1 ? items[0] : items[rndInt(items.length)];
}

/**
 * 
 * @param prob 
 */
function rndByProb(prob: number): boolean {
    return Math.random() < prob;
}

/**
 * 
 * @param n 
 */
function rndInt(n: number): number {
    return Math.floor(Math.random() * n);
}

/**
 * 
 * @param session 
 * @param props 
 */
export function buildSimulator(session: Session, props: any): TrafficSimulator {
    return new TrafficSimulator(session, _.assign({}, DefaultSimProps, props) as SimulationProps);
}

/** */
class TrafficSimulator {
    private _props: SimulationProps;
    private _session: Session;
    private _messages: Message[];

    /**
     * 
     * @param session 
     * @param props 
     * @param messages 
     */
    constructor(session: Session, props: SimulationProps, messages: Message[] = []) {
        this._props = props;
        this._session = session;
        this._messages = messages;
        _.bindAll(this);
    }

    get props() { return this._props; }

    /** Returns the session */
    get session() { return this._session; }

    /** Returns the messages */
    get messages() { return this._messages; }

    /** */
    get map() { return this.props.map; }

    /**
     * 
     * @param session 
     */
    withSession(session: Session) {
        return new TrafficSimulator(session, this.props, this.messages);
    }

    /**
     * 
     * @param messages 
     */
    withMessages(messages: Message[]) {
        return new TrafficSimulator(this.session, this.props, messages);
    }

    /**
     * 
     * @param messages 
     */
    addMessages(messages: Message | Message[]) {
        return this.withMessages(_.concat(this.messages, messages));
    }

    /**
     * 
     * @param flight 
     */
    addDepartureToDialog(flight: Flight): TrafficSimulator {
        const holdShort = buildHoldShortCommand(flight.id, this.map.id, flight.from);
        return this.addMessages([
            buildDepartureToMessage(flight, this.map.id),
            holdShort,
            buildReadbackMessage(holdShort)
        ]);
    }

    /**
     * 
     * @param flight 
     */
    addDepartureLeaveDialog(flight: Flight): TrafficSimulator {
        const holdShort = buildHoldShortCommand(flight.id, this.map.id, flight.from);
        return this.addMessages([
            buildDepartureLeaveMessage(flight, this.map.id),
            holdShort,
            buildReadbackMessage(holdShort)
        ]);
    }

    /**
     * 
     * @param flight 
     */
    addEnterToDialog(flight: Flight): TrafficSimulator {
        return this.addMessages([
            buildEnterToMessage(flight, this.map.id),
            buildRogerMessage(this.map.id, flight.id)
        ]);
    }

    /**
     * 
     * @param flight 
     */
    addEnterLeaveDialog(flight: Flight): TrafficSimulator {
        return this.addMessages([
            buildEnterLeaveMessage(flight, this.map.id),
            buildRogerMessage(this.map.id, flight.id)
        ]);
    }

    /**
     * 
     * @param cmd 
     */
    processCommand(cmd: CommandMessage): TrafficSimulator {
        const { to: flightId } = cmd;
        if (!flightId) {
            throw new Error('missing flight id');
        }
        const flight = this.session.flights[flightId];
        if (!flight) {
            return this.addMessages([
                buildFlightNotFoundMessage(this.props.map.id, flightId)
            ]);
        }
        const fp = new FlightProcessor(flight, this.props).processCommand(cmd);
        const newSession = fromJS(this.session).setIn(['flights', flightId], fp.flight).toJS();
        return this.withSession(newSession).addMessages(fp.messages);
    }

    /**
     * 
     */
    transition(): TrafficSimulator {
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
    filterCollision(): TrafficSimulator {
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
                const collided = a.status !== FlightStatus.WaitingForTakeoff
                    && b.status !== FlightStatus.WaitingForTakeoff
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
                .update('noCollision', (n: number) => n + noCollided)
                .toJS();
            // Sending message
            const messages = collided.map(f => buildCollisionMessage(f.id, this.props.map.id));
            return this.withSession(newSession).addMessages(messages);
        }
        return this;
    }

    /**
     * 
     */
    filterForExited(): TrafficSimulator {
        const { exitAlt } = this.props;
        const [exited, notExited] = _.partition(this.session.flights,
            { status: FlightStatus.Exited });
        const noExited = exited.length;
        if (noExited > 0) {
            const [exitedOk, exitedKo] = _.partition(exited, f => {
                return f.alt === exitAlt
                    && f.to === f.exit
            });
            const ok = exitedOk.length;
            const ko = exitedKo.length;
            const notExitedMap = _(notExited)
                .groupBy('id')
                .mapValues(f => f[0])
                .value();
            const newSession = fromJS(this.session)
                .set('flights', notExitedMap)
                .update('noExitOk', (n: number) => n + ok)
                .update('noExitKo', (n: number) => n + ko)
                .toJS();
            // Sending message
            const okMessages = _.flatMap(exitedOk, f => [
                buildLeavingMessage(f, this.props.map.id),
                buildClearedToLeaveMessage(this.props.map.id, f.id, f.exit as string)
            ]);
            const koMessages = _.flatMap(exitedKo, f => [
                buildLeavingMissingDepartureMessage(f, this.props.map.id),
                buildClearedToLeaveMessage(this.props.map.id, f.id, f.exit as string)
            ]);
            return this.withSession(newSession)
                .addMessages(okMessages)
                .addMessages(koMessages);
        }
        return this;
    }

    /**
     * 
     */
    filterForOutOfArea(): TrafficSimulator {
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
            const newSession = fromJS(this.session)
                .set('flights', fromJS(inAreaMap))
                .update('noExitKo', (n: number) => n + exited.length)
                .toJS() as Session;
            const messages = _(exited).flatMap(flight => [
                buildOutOfAreaMessage(flight.id, this.props.map.id),
                buildRogerMessage(this.props.map.id, flight.id)
            ]).value();
            return this.withSession(newSession).addMessages(messages);
        } else {
            return this;
        }
    }

    /** */
    filterForLanded(): TrafficSimulator {
        const [landed, notLanded] = _.partition(this.session.flights,
            { status: FlightStatus.Landed });
        const noLanded = landed.length;
        if (noLanded > 0) {
            const [landedOk, landedKo] = _.partition(landed, f => f.to === f.rwy);
            const ok = landedOk.length;
            const ko = landedKo.length;
            const notLandedMap: Record<string, Flight> = _(notLanded)
                .map(f => [f.id, f])
                .fromPairs()
                .value();
            const newSession = fromJS(this.session)
                .set('flights', notLandedMap)
                .update('noLandedOk', (n: number) => n + ok)
                .update('noLandedKo', (n: number) => n + ko)
                .toJS();
            // Sending message
            const okMessages = _.flatMap(landedOk, f => [
                buildRunwayVacated(f, this.props.map.id),
                buildGoodDayMessage(this.props.map.id, f.id)
            ]);
            const koMessages = _.flatMap(landedKo, f => [
                buildWrongRunwayVacated(f, this.props.map.id),
                buildGoodDayMessage(this.props.map.id, f.id)
            ]);
            return this.withSession(newSession)
                .addMessages(okMessages)
                .addMessages(koMessages);
        } else {
            return this;
        }
    }

    /**
     * 
     */
    addTime(): TrafficSimulator {
        const { dt } = this.props;
        const session = fromJS(this.session)
            .update('t', (t: number) => {
                return t + dt;
            })
            .toJS() as Session;
        return this.withSession(session);
    }

    /**
     * 
     */
    processFlights(): TrafficSimulator {
        const { flights } = this.session;
        if (_.size(flights) > 0) {
            const processed = _(flights)
                .values()
                .map(flight =>
                    new FlightProcessor(flight, this.props).processTime()
                );
            const newFlights = processed.map(fp => [fp.flight.id, fp.flight]).fromPairs().value() as Record<string, Flight>;
            const messages = processed.flatMap('messages').value();
            const newSession = fromJS(this.session).set('flights', newFlights).toJS() as Session;
            return this.withSession(newSession).withMessages(messages);
        } else {
            return this;
        }
    }

    /**
     * 
     * @param {*} sessionMap 
     */
    processForNewFlight(): TrafficSimulator {
        const { dt, level } = this.props;
        const { maxPlane, flightFreq } = level;
        const { flights, t, noFlights } = this.session;
        // Check for new flight eligibility
        const max = maxPlane - _.size(flights);
        const n = Math.max(
            Math.min(rndPoisson(dt * flightFreq / 3600), max),
            (noFlights === 0 && t >= MAX_INITIAL_IDLE_INTERVAL) ? 1 : 0);
        if (n > 0) {
            var tmp: TrafficSimulator = this;
            for (var i = 0; i < n; i++) {
                tmp = tmp.createFlight();
            }
            return tmp;
        } else {
            return this;
        }
    }

    /**
     * 
     */
    createEntryCandidates(): HeadingMapNode[] {
        const { safeEntryDelay } = this.props;
        const { entries, t } = this.session;
        const entryTimeout = t - safeEntryDelay;
        return _(this.props.map.nodes)
            .filter(node =>
                node.type === MapNodeType.Runway
                || (node.type === MapNodeType.Entry
                    && (!entries[node.id]
                        || entries[node.id] < entryTimeout)
                )
            ).value() as HeadingMapNode[];
    }

    /**
     * 
     */
    createExitCandidates(): MapNode[] {
        return _(this.props.map.nodes)
            .filter(node => node.type === MapNodeType.Runway || node.type === MapNodeType.Entry)
            .value();
    }

    /**
     * 
     * @param {*} sessionMap 
     */
    createFlight() {
        const candidates = this.createEntryCandidates();
        if (candidates.length > 0) {
            const { jetProb, entryAlt, flightTempl, flightVoices } = this.props;
            const { noFlights, t, flights } = this.session;
            const entry = choose(candidates);
            const to = choose(this.createExitCandidates());
            const type = rndByProb(jetProb) ? FlightType.Jet : FlightType.Airplane;
            var id = undefined;
            do {
                id = rndFlightId();
            } while (flights[id] !== undefined);
            const fromRwy = isRunway(entry);
            const alt = fromRwy ? 0 : entryAlt;
            const status = fromRwy ? FlightStatus.WaitingForTakeoff : FlightStatus.Flying;
            const speed = fromRwy ? 0 : flightSpeed(alt, flightTempl[type]);
            const voice = flightVoices.length > 0 ? choose(flightVoices) : undefined;
            const flight: Flight = {
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
            const sessionMap1 = fromJS(this.session)
                .set('noFlights', noFlights + 1)
                .setIn(['flights', flight.id], flight);
            const sessionMap = fromRwy
                ? sessionMap1
                : sessionMap1.setIn(['entries', entry.id], t);
            const next = this.withSession(sessionMap.toJS())

            const toRwy = isRunway(to);
            return fromRwy ?
                (toRwy ?
                    next.addDepartureToDialog(flight) :
                    next.addDepartureLeaveDialog(flight)) :
                (toRwy ?
                    next.addEnterToDialog(flight) :
                    next.addEnterLeaveDialog(flight));
        } else {
            return this;
        }
    }
}
