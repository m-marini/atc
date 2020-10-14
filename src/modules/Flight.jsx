import { fromJS, Map } from 'immutable';
import { mapDao } from './MapDao';
import { sprintf } from 'sprintf-js';
import _ from 'lodash';
import { COMMAND_CONDITIONS, COMMAND_TYPES, NODE_TYPES, MESSAGE_TYPES } from './TrafficSimulator';

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
        this.with = this.with.bind(this);
    }

    sendMessage(build) {
        const { sendMessage } = this.props;
        if (!!sendMessage) {
            sendMessage(build());
        }
    }

    atcMessage(msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.ATC,
                msg: `${this.flight.get('id')}, ${this.props.map.name} ATC, ${msg}`
            }
        });
    }

    flightMessage(msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.FLIGHT,
                msg: `${this.props.map.name} ATC, ${this.flight.get('id')}, ${msg}`
            }
        });
    }

    readbackMessage(msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.READBACK,
                msg: `${msg}, ${this.flight.get('id')}`
            }
        });
    }

    atcEmergency(msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.EMERGENCY,
                msg: `${this.flight.get('id')}, ${this.props.map.name} ATC, ${msg}`
            }
        });
    }

    flightEmergency(msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.EMERGENCY,
                msg: `${this.props.map.name} ATC, ${this.flight.get('id')}, ${msg}`
            }
        });
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

    clearanceEntry() {
        const { status, to, from, alt, hdg } = this.flightJS;
        const toNode = this.props.map.nodes[to];

        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            this.flightMessage(`holding short runway ${from}, ready for departure to ${to}`);
            this.atcMessage(`hold short runway ${from}`);
            this.readbackMessage(`holding short runway ${from}`);
        } else if (toNode.type === NODE_TYPES.RUNWAY) {
            this.flightMessage(`inbound from ${from} to land runway ${to}`);
            this.atcMessage(`mantain ${alt}, heading ${hdg}`);
            this.readbackMessage(`mantaining ${alt}, heading ${hdg}`);
        } else {
            this.flightMessage(`inbound from ${from} to leave at ${to}`);
            this.atcMessage(`mantain ${alt}, heading ${hdg}`);
            this.readbackMessage(`mantaining ${alt}, heading ${hdg}`);
        }
        return this;
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

    hold({ when }) {
        const flight = this.flightJS;
        const { status, hdg, lat, lon } = flight;
        const { map } = this.props;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {
            this.atcMessage(`hold at current position`);
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.flightEmergency(`negative, unable to hold at current position at ground`);
                return this;
            }
            const fix = { lat, lon }
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.HOLDING_FROM)
                .set('hdg', mapDao.normHdg(hdg + 180))
                .set('fix', fix);
            this.readbackMessage(`holding at current position`);
            return this.with(newFlight);
        } else {
            this.atcMessage(`hold at ${when}`);
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.flightEmergency(`negative, unable to hold at ${when} at ground`);
                return this;
            }
            const fix = map.nodes[when];
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.HOLDING_TO)
                .set('fix', fix);
            this.readbackMessage(`holding at ${when}`);
            return this.with(newFlight);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    clearingToLand({ to }) {
        // const { to } = cmd;
        const flight = this.flightJS;
        this.atcMessage(`cleared to land runway ${to}`);
        if (flight.status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            this.flightEmergency(`negative, unable to land runway ${to} at ground`);
            this.atcMessage(`roger`);
            return this;
        }

        const { map, clearToLandDistance, om } = this.props;
        const runway = map.nodes[to];

        const outerMarker = mapDao.radial(runway, runway.hdg + 180, om);

        // Check distance
        const rwyDistance = mapDao.distance(flight, runway);
        if (rwyDistance > clearToLandDistance) {
            // Runway to distant
            this.flightEmergency(`negative, unable to land runway ${to} too distant`);
            this.atcMessage(`roger`);
            return this;
        }

        // Check altitude
        const { alt } = flight;
        const apprAlt = this.approachAlt(rwyDistance);
        if (alt > apprAlt) {
            this.flightEmergency(`negative, unable to land runway ${to} too high`);
            this.atcMessage(`roger`);
            return this;
        }

        const newFlight = this.flight
            .set('rwy', to)
            .set('status', FLIGHT_STATES.APPROACHING)
            .set('om', outerMarker)
            .delete('turnTo')
            .delete('at');
        this.readbackMessage(`cleared to land runway ${to}`);

        return this.with(newFlight);
    }

    /**
     * 
     * @param {*} cmd 
     */
    turnHeading({ when, to }) {
        const flight = this.flightJS;
        const { status } = flight;
        const { map } = this.props;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {
            const toNode = map.nodes[to];
            const hdg = mapDao.hdg(toNode, flight);
            this.atcMessage(`fly heading ${sprintf('%03d', hdg)} to ${to}`);
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.flightEmergency(`negative, unable to fly to ${to} at ground`);
                this.atcMessage(`roger`);
                return this;
            }
            const newFlight = this.flight
                .set('hdg', hdg)
                .set('at', to)
                .set('status', FLIGHT_STATES.FLYING_TO)
                .delete('rwy')
                .delete('om')
                .delete('turnTo');
            this.readbackMessage(`flying heading ${sprintf('%03d', hdg)} to ${to}`);
            return this.with(newFlight);
        } else {
            this.atcMessage(`turn to ${to} passing ${when}`);
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                this.flightEmergency(`negative, unable to turn to ${to} passing ${when} at ground`);
                this.atcMessage(`roger`);
                return this;
            }
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.TURNING)
                .set('at', when)
                .delete('rwy')
                .delete('om')
                .set('turnTo', to);
            this.readbackMessage(`turn to ${to} passing ${when}`);
            return this.with(newFlight);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    changeLevel({ flightLevel }) {
        const { flightTempl } = this.props;
        const cmdAlt = parseInt(flightLevel) * 100;
        const alt = this.flight.get('alt');
        const status = this.flight.get('status');
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            const speed = speedByAlt(0, flightTempl[this.flight.get('type')]);
            const runway = this.flight.get('from');
            const newFlight = this.flight
                .set('toAlt', cmdAlt)
                .set('speed', speed)
                .set('status', FLIGHT_STATES.FLYING)
                .delete('rwy');
            this.atcMessage(`runway ${runway}, cleared for take-off, climb to ${cmdAlt}ft`);
            this.readbackMessage(`runway ${runway}, cleared for take-off, climbing to ${cmdAlt}ft`);
            return this.with(newFlight);
        }
        if (status === FLIGHT_STATES.LANDING || status === FLIGHT_STATES.APPROACHING) {
            const newFlight = this.flight
                .set('toAlt', cmdAlt)
                .set('status', FLIGHT_STATES.FLYING)
                .delete('om')
                .delete('rwy');
            this.atcEmergency(`pull up and go around, climb to ${cmdAlt}ft`);
            this.readbackMessage(`Going around, climbing to ${cmdAlt}ft`);
            return this.with(newFlight);
        }
        const newFlight = this.flight
            .set('toAlt', cmdAlt);
        if (cmdAlt > alt) {
            this.atcMessage(`climb to ${cmdAlt}ft`)
            this.readbackMessage(`climbing to ${cmdAlt} ft`);
        } else if (cmdAlt < alt) {
            this.atcMessage(`descend to ${cmdAlt}ft`)
            this.readbackMessage(`descending to ${cmdAlt}ft`);
        } else {
            this.atcMessage(`maintain ${cmdAlt}ft`)
            this.readbackMessage(`maintaining ${cmdAlt}ft`);
        }
        return this.with(newFlight);
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
            default:
                return this;
        }
    }

    holdingFrom() {
        const { holdingDuration, dt } = this.props;
        const flight = this.flightJS;
        const { speed, fix } = flight;
        const dl = speed * holdingDuration / SECS_PER_HOUR / 2;
        const { d, hdg: fixHdg } = mapDao.route(fix, flight);
        const ds = speed * dt / SECS_PER_HOUR;
        if (d + ds > dl) {
            const d1 = 2 * dl - d - ds;
            const { lat, lon } = mapDao.radial(fix, fixHdg, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_TO)
                .set('hdg', mapDao.normHdg(fixHdg + 180));
            return this.with(newFlight).moveVert();
        } else {
            return this.moveHoriz().moveVert();
        }
    }

    holdingTo() {
        const { dt } = this.props;
        const flight = this.flightJS;
        const { speed, fix } = flight;
        const { d, hdg: fixHdg } = mapDao.route(flight, fix);
        const ds = speed * dt / SECS_PER_HOUR;
        if (ds > d) {
            const d1 = ds - d;
            const { lat, lon } = mapDao.radial(fix, fixHdg, d1);
            // Reverse circle
            const newFlight = this.flight
                .set('lat', lat)
                .set('lon', lon)
                .set('status', FLIGHT_STATES.HOLDING_FROM)
                .set('hdg', mapDao.normHdg(fixHdg + 180));
            return this.with(newFlight).moveVert();
        } else {
            return this.moveHoriz().moveVert();
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
            this.flightEmergency(`going around, missing approach`)
            this.atcMessage(`roger`)
            return this.with(newFlight).moveHoriz().moveVert();
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
            this.flightEmergency(`going around, missing runway`)
            this.atcMessage(`roger`)
            return this.with(newFlight).moveHoriz().moveVert();
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
            this.flightEmergency(`going around, missing runway`)
            this.atcMessage(`roger`)
            return this.with(newFlight).moveHoriz().moveVert();
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
                this.flightEmergency(`going around, missing runway`)
                this.atcMessage(`roger`)
                return this.with(newFlight).moveHoriz().moveVert();
            }
            // Landed
            const newFlight = this.flight
                .set('lat', runwayNode.lat)
                .set('lon', runwayNode.lon)
                .set('speed', 0)
                .set('alt', 0)
                .set('status', FLIGHT_STATES.LANDED);
            this.atcMessage(`runway ${runwayNode.id} vacated`);
            this.flightMessage(`leaving frequency`);
            this.atcMessage(`good day`);
            return this.with(newFlight);
        }

        // Check for approach direction
        if (Math.abs(angle) > approachHdgRange) {
            // Go around due to wrong approach
            const newFlight = this.flight
                .set('status', FLIGHT_STATES.FLYING)
                .set('toAlt', goAroundAlt)
                .delete('rwy');
            this.flightEmergency(`going around, missing runway`)
            this.atcMessage(`roger`)
            return this.with(newFlight).moveHoriz().moveVert();
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
        this.flightMessage(`flying heading ${sprintf('%03d', hdg)}, ${flight.id}`);
        this.atcMessage(`maintain heading ${sprintf('%03d', hdg)}`);
        this.readbackMessage(`maintaining heading ${sprintf('%03d', hdg)}`);
        return this.with(newFlight);
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
            this.flightMessage(`passing ${newAlt}ft`);
            this.atcMessage(`maintain ${newAlt}ft`);
            this.readbackMessage(`mantaining ${newAlt}ft`);
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
