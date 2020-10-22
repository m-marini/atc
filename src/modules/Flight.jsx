import { fromJS, Map } from 'immutable';
import { mapDao } from './MapDao';
import _ from 'lodash';
import { COMMAND_CONDITIONS, COMMAND_TYPES, NODE_TYPES } from './TrafficSimulator';
import { buildEvent, EVENT_TYPES } from './Events';

const SECS_PER_HOUR = 3600;
const MINS_PER_SEC = 1.0 / 60;
// const NMS_PER_DEG = 60;
const FEET_PER_NM = 1852 / 0.3048;
// const NMS_PER_FOOT = 0.3048 / 1852;
const RADS_PER_DEG = Math.PI / 180;

const FLIGHT_TYPES = {
    JET: 'J',
    AIRPLANE: 'A'
};

const FLIGHT_STATES = {
    WAITING_FOR_TAKEOFF: 'waitingForTakeoff',
    FLYING: 'flying',
    FLYING_TO: 'flyingTo',
    TURNING: 'turning',
    APPROACHING: 'approaching',
    LANDING: 'landing',
    HOLDING_FROM_AT: 'holdingFromAt',
    HOLDING_TO_AT: 'holdingToAt',
    HOLDING_FROM: 'holdingFrom',
    HOLDING_TO: 'holdingTo',
    LANDED: 'landed',
    EXITED: 'exited'
};

/**
 * 
 * @param {*} alt 
 * @param {*} template 
 */
function speedByAlt(alt, template) {
    return Math.round(alt / 36000 * (template.speed360 - template.speed0) + template.speed0);
}

/**
 * 
 */
class Flight {

    /**
     * 
     * @param {*} f 
     * @param {*} props 
     */
    constructor(f, props) {
        if (f instanceof Map) {
            this._flight = f;
        } else {
            this._flightJS = f;
        }
        this.props = props;
        _.bindAll(this);
    }

    fireEvent(type, cmd) {
        const { onEvent } = this.props;
        if (!!onEvent) {
            const event = buildEvent(type, this.flightJS, this.props.map, cmd);
            onEvent(event);
        }
        return this;
    }

    /** Returns the JSON flight */
    get flightJS() {
        if (this._flightJS === undefined) {
            this._flightJS = this._flight.toJS();
        }
        return this._flightJS;
    }

    /** Returns the Map flight */
    get flight() {
        if (this._flight === undefined) {
            this._flight = fromJS(this._flightJS);
        }
        return this._flight;
    }

    /**
     * Returns the Flight with a f+-
     * light data
     * @param {*} flight flight data
     */
    with(flight) {
        return new Flight(flight, this.props);
    }
    /**
     * 
     * @param {*} cmd 
     */
    processCommand(cmd) {
        switch (cmd.type) {
            case COMMAND_TYPES.CHANGE_LEVEL:
                return this.changeLevel(cmd);
            case COMMAND_TYPES.TURN_HEADING:
                return this.turnHeading(cmd);
            case COMMAND_TYPES.CLEAR_TO_LAND:
                return this.clearingToLand(cmd);
            case COMMAND_TYPES.HOLD:
                return this.hold(cmd);
            default:
                return this;
        }
    }

    hold(cmd) {
        const { when } = cmd;
        const flight = this.flightJS;
        const { status, hdg, lat, lon } = flight;
        const { map } = this.props;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {

            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_HOLD, cmd);
            }
            const fix = { lat, lon }
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.HOLDING_FROM)
                .set('hdg', mapDao.normHdg(hdg + 180))
                .set('holdHdg', mapDao.normHdg(hdg + 180))
                .set('fix', fix);
            return this.with(newFlight).fireEvent(EVENT_TYPES.HOLD);
        } else {
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.fireEvent(EVENT_TYPES.UNABLE_TO_HOLD_AT, cmd);
                return this;
            }
            const at = map.nodes[when];
            const hdg = mapDao.hdg(at, flight);
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.HOLDING_TO_AT)
                .set('hdg', hdg)
                .set('holdHdg', mapDao.normHdg(hdg + 180))
                .set('at', when);
            return this.with(newFlight).fireEvent(EVENT_TYPES.HOLD_AT, cmd);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    clearingToLand(cmd) {
        const { to } = cmd;
        const flight = this.flightJS;
        if (flight.status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            return this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_GROUND, cmd);
        }

        const { map, clearToLandDistance, om } = this.props;
        const runway = map.nodes[to];

        const outerMarker = mapDao.radial(runway, runway.hdg + 180, om);

        // Check distance
        const rwyDistance = mapDao.distance(flight, runway);
        if (rwyDistance > clearToLandDistance) {
            // Runway to distant
            return this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_DISTANCE, cmd);
        }

        // Check altitude
        const { alt } = flight;
        const apprAlt = this.approachAlt(rwyDistance);
        if (alt > apprAlt) {
            this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE, cmd);
            return this;
        }

        const newFlight = this.flight
            .set('rwy', to)
            .set('status', FLIGHT_STATES.APPROACHING)
            .set('om', outerMarker)
            .delete('turnTo')
            .delete('at');

        return this.with(newFlight).fireEvent(EVENT_TYPES.CLEARED_TO_LAND, cmd);
    }

    /**
     * 
     * @param {*} cmd 
     */
    turnHeading(cmd) {
        const { when, to } = cmd;
        const flight = this.flightJS;
        const { status } = flight;
        const { map } = this.props;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {
            const toNode = map.nodes[to];
            const hdg = mapDao.hdg(toNode, flight);
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_FLY_TO, cmd);
            }
            const newFlight = this.flight
                .set('hdg', hdg)
                .set('at', to)
                .set('status', FLIGHT_STATES.FLYING_TO)
                .delete('rwy')
                .delete('om')
                .delete('turnTo');
            return this.with(newFlight).fireEvent(EVENT_TYPES.FLY_TO, cmd);
        } else {
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.fireEvent(EVENT_TYPES.UNABLE_TO_FLY_TO_VIA, cmd);
                return this;
            }
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.TURNING)
                .set('at', when)
                .delete('rwy')
                .delete('om')
                .set('turnTo', to);
            return this.with(newFlight).fireEvent(EVENT_TYPES.FLY_TO_VIA, cmd);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    changeLevel(cmd) {
        const { flightLevel } = cmd;
        const { flightTempl } = this.props;
        const cmdAlt = parseInt(flightLevel) * 100;
        const alt = this.flight.get('alt');
        const status = this.flight.get('status');
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            const speed = speedByAlt(0, flightTempl[this.flight.get('type')]);
            const newFlight = this.flight
                .set('toAlt', cmdAlt)
                .set('speed', speed)
                .set('status', FLIGHT_STATES.FLYING)
                .delete('rwy');
            return this.with(newFlight).fireEvent(EVENT_TYPES.CLEARED_TO_TAKE_OFF, cmd);
        }
        if (status === FLIGHT_STATES.LANDING || status === FLIGHT_STATES.APPROACHING) {
            const newFlight = this.flight
                .set('toAlt', cmdAlt)
                .set('status', FLIGHT_STATES.FLYING)
                .delete('om')
                .delete('rwy');
            return this.with(newFlight).fireEvent(EVENT_TYPES.ATC_GO_AROUD, cmd);
        }
        const newFlight = this.flight
            .set('toAlt', cmdAlt);
        if (cmdAlt > alt) {
            return this.with(newFlight).fireEvent(EVENT_TYPES.CLIMB_TO, cmd);
        } else if (cmdAlt < alt) {
            return this.with(newFlight).fireEvent(EVENT_TYPES.DESCEND_TO, cmd);
        } else {
            return this.with(newFlight).fireEvent(EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL, cmd);
        }
    }

    /**
     * Returns the flight status after time elapsed
     */
    processTime() {
        return this.processTimePhase1()
            .processExit();
    }

    processTimePhase1() {
        switch (this.flight.get('status')) {
            case FLIGHT_STATES.FLYING_TO:
                return this.flyingTo();
            case FLIGHT_STATES.FLYING:
                return this.flying();
            case FLIGHT_STATES.TURNING:
                return this.turning();
            case FLIGHT_STATES.APPROACHING:
                return this.approaching();
            case FLIGHT_STATES.LANDING:
                return this.landing();
            case FLIGHT_STATES.HOLDING_FROM:
                return this.holdingFrom();
            case FLIGHT_STATES.HOLDING_TO:
                return this.holdingTo();
            case FLIGHT_STATES.HOLDING_FROM_AT:
                return this.holdingFromNode();
            case FLIGHT_STATES.HOLDING_TO_AT:
                return this.holdingToNode();
            default:
                return this;
        }
    }

    holdingFromNode() {
        const { map, holdingDuration, dt } = this.props;
        const flight = this.flightJS;
        const { speed, at, holdHdg } = flight;
        const dl = speed * holdingDuration / SECS_PER_HOUR / 2;
        const node = map.nodes[at];
        const { d, hdg: fixHdg } = mapDao.route(flight, node);
        const ds = speed * dt / SECS_PER_HOUR;
        if (d + ds >= dl) {
            const d1 = 2 * dl - d - ds;
            const { lat, lon } = mapDao.radial(node, fixHdg + 180, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_TO_AT)
                .set('hdg', fixHdg);
            return this.with(newFlight).moveVert();
        } else {
            return this.hdg(holdHdg).moveHoriz().moveVert();
        }
    }

    holdingToNode() {
        const { map, dt } = this.props;
        const flight = this.flightJS;
        const { speed, at, holdHdg } = flight;
        const node = map.nodes[at];
        const { d, hdg: fixHdg } = mapDao.route(flight, node);
        const ds = speed * dt / SECS_PER_HOUR;
        if (ds >= d) {
            const d1 = ds - d;
            const { lat, lon } = mapDao.radial(node, holdHdg, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_FROM_AT)
                .set('hdg', holdHdg);
            return this.with(newFlight).moveVert();
        } else {
            return this.hdg(fixHdg).moveHoriz().moveVert();
        }
    }

    holdingFrom() {
        const { holdingDuration, dt } = this.props;
        const flight = this.flightJS;
        const { speed, fix, holdHdg } = flight;
        const dl = speed * holdingDuration / SECS_PER_HOUR / 2;
        const { d, hdg: fixHdg } = mapDao.route(flight, fix);
        const ds = speed * dt / SECS_PER_HOUR;
        if (d + ds >= dl) {
            const d1 = 2 * dl - d - ds;
            const { lat, lon } = mapDao.radial(fix, fixHdg + 180, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_TO)
                .set('hdg', fixHdg);
            return this.with(newFlight).moveVert();
        } else {
            return this.hdg(holdHdg).moveHoriz().moveVert();
        }
    }

    holdingTo() {
        const { dt } = this.props;
        const flight = this.flightJS;
        const { speed, fix, holdHdg } = flight;
        const { d, hdg: fixHdg } = mapDao.route(flight, fix);
        const ds = speed * dt / SECS_PER_HOUR;
        if (ds > d) {
            const d1 = ds - d;
            const { lat, lon } = mapDao.radial(fix, holdHdg, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_FROM)
                .set('hdg', holdHdg);
            return this.with(newFlight).moveVert();
        } else {
            return this.hdg(fixHdg).moveHoriz().moveVert();
        }
    }

    /**
     * 
     */
    processExit() {
        const { map, dt } = this.props;
        const flight = this.flightJS;
        const ds = flight.speed * dt / SECS_PER_HOUR;
        const exitNode = _(map.nodes).find(node => {
            if (node.type !== NODE_TYPES.ENTRY) {
                return false;
            }
            const diff = mapDao.normAngle(flight.hdg - node.hdg);
            if (Math.abs(diff) <= 90) {
                return false;
            }
            const { from, d } = mapDao.route(flight, node);
            return from && d <= ds && Math.abs(diff);
        });
        if (!!exitNode) {
            const newFlight = this.flight
                .set('exit', exitNode.id)
                .set('status', FLIGHT_STATES.EXITED);
            return this.with(newFlight);
        } else {
            return this;
        }
    }

    /**
     * 
     */
    approaching() {
        const { dt, flightTempl, goAroundAlt, om: omrDist } = this.props;
        const flight = this.flightJS;
        const { speed, type, alt, toAlt, om } = flight;

        const { d: omDist, hdg: omHdg } = mapDao.route(flight, om);

        // compute distance
        const ds = speed * dt / SECS_PER_HOUR;

        // Check for distance
        const { vspeed } = flightTempl[type];
        const minAlt = alt - vspeed * dt * MINS_PER_SEC;
        if (omDist < ds) {
            // passing outer marker
            const rwy = this.props.map.nodes[this.flightJS.rwy];
            const drwy = omrDist + omDist - ds;
            const pos = mapDao.radial(rwy, rwy.hdg + 180, drwy);
            const apprAlt = this.approachAlt(drwy);
            const targetAlt = Math.min(apprAlt, Math.max(minAlt, toAlt));
            const result = this.with(this.flight
                .set('hdg', rwy.hdg)
                .set('status', FLIGHT_STATES.LANDING)
                .set('lat', pos.lat)
                .set('lon', pos.lon)
                .set('alt', targetAlt)
                .set('speed', this.speedByAlt(targetAlt))
                .delete('om'));
            return result;
        }

        // Compute altitude
        const d = this.approachDistance() - ds;
        const apprAlt = this.approachAlt(d);

        // Checking altitude
        if (apprAlt < minAlt) {
            // Go around due to altitude
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.FLYING)
                .set('toAlt', goAroundAlt)
                .delete('om')
                .delete('runway');
            return this.with(newFlight).moveHoriz().moveVert().fireEvent(EVENT_TYPES.GO_AROUD_APPROACH);
        }

        // Approaching
        const targetAlt = Math.min(apprAlt, Math.max(minAlt, toAlt));
        const result = this.with(this.flight
            .set('hdg', omHdg)
            .set('alt', targetAlt)
            .set('speed', this.speedByAlt(targetAlt))).moveHoriz();
        return result;
    }

    /**
     * 
     */
    landing() {
        const { dt, map, landingHdgRange, landingHdgTrim, flightTempl, goAroundAlt, approachHdgRange } = this.props;
        const flight = this.flightJS;
        const { speed, rwy, hdg, type, alt, toAlt } = flight;
        const runwayNode = map.nodes[rwy];

        // Check for missing runway
        const { from, d, angle, hdg: toHdg } = mapDao.route(flight, runwayNode);
        if (from) {
            // Go around due to missing runway
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.FLYING)
                .set('toAlt', goAroundAlt)
                .delete('rwy');
            return this.with(newFlight).moveHoriz().moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
        }

        // Compute altitude
        const ds = speed * dt / SECS_PER_HOUR;
        const apprAlt = this.approachAlt(d - ds);
        const { vspeed } = flightTempl[type];
        const minAlt = alt - vspeed * dt * MINS_PER_SEC;
        if (apprAlt < minAlt) {
            // Go around due to altitude
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.FLYING)
                .set('toAlt', goAroundAlt)
                .delete('rwy');
            return this.with(newFlight).moveHoriz().moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
        }

        // Check for distance
        if (d <= ds) {
            // Check for runway alignment
            if (Math.abs(angle) > landingHdgRange) {
                // Go around due to wrong alignment
                const newFlight = this.flight
                    .set('status', FLIGHT_STATES.FLYING)
                    .set('toAlt', goAroundAlt)
                    .delete('rwy');
                return this.with(newFlight).moveHoriz().moveVert()
                    .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
            }
            // Landed
            const newFlight = this.flight
                .set('lat', runwayNode.lat)
                .set('lon', runwayNode.lon)
                .set('speed', 0)
                .set('alt', 0)
                .set('status', FLIGHT_STATES.LANDED);
            return this.with(newFlight);
        }

        // Check for approach direction
        if (Math.abs(angle) > approachHdgRange) {
            // Go around due to wrong approach
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.FLYING)
                .set('toAlt', goAroundAlt)
                .delete('rwy');
            return this.with(newFlight).moveHoriz().moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
        }

        // Approaching
        // Compute heading for runway alignment
        const rwAlign = mapDao.normAngle(runwayNode.hdg - hdg);
        const targetHdg = rwAlign > 0
            ? toHdg - landingHdgTrim
            : rwAlign < 0
                ? toHdg + landingHdgTrim
                : toHdg;

        const targetAlt = Math.min(apprAlt, Math.max(minAlt, toAlt));
        const result = this.with(this.flight
            .set('hdg', targetHdg)
            .set('alt', targetAlt)
            .set('speed', this.speedByAlt(targetAlt)))
            .moveHoriz();

        return result;
    }

    /**
     * Returns the approach altitude in feet
     * @param {*} d the approaching distance nms
     */
    approachAlt(d) {
        const { landingAngle } = this.props;
        return Math.round(d * Math.tan(landingAngle * RADS_PER_DEG) * FEET_PER_NM);
    }

    /**
     * Returns the direct distance to runway in nms
     * @param {*} pos position or flight position if undefined
     */
    runwayDistance(pos) {
        if (pos === undefined) {
            pos = this.flightJS;
        }
        const rwy = this.props.map.nodes[this.flight.get('rwy')];
        return mapDao.distance(pos, rwy);
    }


    /**
     * Returns the distance to runway via om in nms
     * @param {*} pos position or flight position if undefined
     */
    approachDistance(pos) {
        if (pos === undefined) {
            pos = this.flightJS;
        }
        const om = this.flightJS.om;
        return mapDao.distance(pos, om) + this.props.om;
    }

    /**
     * 
     */
    turning() {
        // Check position
        const { map, dt } = this.props;
        const flight = this.flightJS;
        const { speed, at, hdg } = flight;
        const atNode = map.nodes[at];
        const { d, hdg: hdgTo } = mapDao.route(flight, atNode);
        const ds = speed * dt / SECS_PER_HOUR;
        if (d < ds) {
            // Passing
            return this.turnTo().moveHoriz().moveVert();
        } else if (hdgTo === hdg) {
            return this.moveHoriz().moveVert();
        } else {
            // correct
            return this.hdg(hdgTo)
                .moveHoriz()
                .moveVert();
        }
    }

    /**
     * 
     */
    turnTo() {
        const { map } = this.props;
        const flight = this.flightJS;
        const toNode = map.nodes[flight.turnTo];
        const hdg = mapDao.hdg(toNode, flight);
        const newFlight = this.flight
            .set('hdg', hdg)
            .set('status', FLIGHT_STATES.FLYING_TO)
            .set('at', flight.turnTo)
            .delete('turnTo');

        return this.with(newFlight).fireEvent(EVENT_TYPES.FLYING_TO);
    }

    hdg(hdg) {
        return this.with(this.flight.set('hdg', hdg));
    }

    /**
     * 
     */
    nextPos() {
        const speed = this.flight.get('speed');
        const hdg = this.flight.get('hdg');
        const lat = this.flight.get('lat');
        const lon = this.flight.get('lon');
        const { dt } = this.props;

        // Compute new position
        const ds = dt * speed / SECS_PER_HOUR;
        const newLoc = mapDao.radial({ lat, lon }, hdg, ds);
        return newLoc;
    }

    /**
     * 
     */
    moveHoriz() {
        // Compute new position
        const { lat, lon } = this.nextPos()
        const result = this.with(this.flight
            .set('lat', lat)
            .set('lon', lon));
        return result;
    }

    /**
     * 
     */
    moveVert() {
        const flight = this.flightJS;
        const { alt, toAlt } = flight;
        const { dt } = this.props;

        // Compute new altitude
        const vspeed = this.vspeed;
        const newAlt = alt < toAlt
            ? Math.min(toAlt, Math.round(alt + vspeed * dt * MINS_PER_SEC))
            : alt > toAlt
                ? Math.max(toAlt, Math.round(alt - vspeed * dt * MINS_PER_SEC))
                : alt;
        const newSpeed = this.speedByAlt(newAlt);
        const result = this.with(this.flight
            .set('alt', newAlt)
            .set('speed', newSpeed));
        if (toAlt !== alt && newAlt === toAlt) {
            // flight level reached
            return result.fireEvent(EVENT_TYPES.PASSING);
        }
        return result;
    }

    /**
     * 
     */
    flying() {
        return this.moveHoriz().moveVert();
    }

    /**
     * 
     */
    flyingTo() {
        const { map, dt } = this.props;
        const flight = this.flightJS;
        const { at, speed, hdg } = flight;
        // compute heading
        const atNode = map.nodes[at];
        const { d, hdg: hdgTo } = mapDao.route(flight, atNode);
        const ds = speed * dt / SECS_PER_HOUR;
        if (ds >= d) {
            // Passing
            const flight1 = this.flight
                .delete('at')
                .set('status', FLIGHT_STATES.FLYING);
            // Messages
            return this.with(flight1)
                .moveHoriz()
                .moveVert();
        } else if (hdgTo === hdg) {
            return this.moveHoriz().moveVert();
        } else {
            // correct
            const flight1 = this.flight
                .set('hdg', hdgTo);
            return this.with(flight1)
                .moveHoriz()
                .moveVert();
        }
    }

    speedByAlt(alt) {
        return speedByAlt(alt, this.props.flightTempl[this.flight.get('type')]);
    }

    get vspeed() {
        return this.props.flightTempl[this.flight.get('type')].vspeed;
    }
}

export { Flight, FLIGHT_TYPES, FLIGHT_STATES };
