import { fromJS } from 'immutable';
import { mapDao } from './MapDao';
import _ from 'lodash';
import { COMMAND_CONDITIONS, COMMAND_TYPES, NODE_TYPES } from './TrafficSimulator';
import { buildEvent, EVENT_TYPES } from './Events';

const TURNING_SPEED = 3; // DEG / s
const SECS_PER_HOUR = 3600;
const MINS_PER_SEC = 1.0 / 60;
const FEET_PER_NM = 1852 / 0.3048;
const RADS_PER_DEG = Math.PI / 180;
const RADIUS_PER_KNOTS = 1 / 60 / Math.PI;
const VALIDATION_PROPS = ['hdg', 'speed', 'lat', 'lon', 'alt'];

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
    ALIGNING: 'aligning',
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

const Modifier = {
    set: (key, value) => flight => flight.set(key, value),
    delete: (key) => flight => flight.delete(key),
    update: (key, f) => flight => flight.update(key, f),
    setLocation: (loc) => flight => flight.set('lat', loc.lat).set('lon', loc.lon)
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
        this._flight = f;
        this.props = props;
        _.bindAll(this);
    }

    /** Returns the JSON flight */
    get flight() {
        return this._flight;
    }

    /**
     * 
     */
    vspeed() {
        return this.props.flightTempl[this.flight.type].vspeed;
    }

    /**
     * Returns the landing altitude in feet
     * @param {*} d the distance nms or undefined if from flight location
     */
    landingAlt(d) {
        const { landingAngle, map } = this.props;
        d = d !== undefined ? d : mapDao.distance(map.nodes[this.flight.rwy], this.flight);
        return Math.round(d * Math.tan(landingAngle * RADS_PER_DEG) * FEET_PER_NM);
    }

    /**
     * Returns the autermarker alt
     */
    outerMarkerAlt() {
        return this.landingAlt(this.props.om);
    }

    /**
     * 
     * @param {*} rwyId 
     */
    outerMarker(rwyId) {
        rwyId = rwyId || this.flight.rwy;
        const { om, map } = this.props;
        const rwy = map.nodes[rwyId];
        return mapDao.radial(rwy, rwy.hdg + 180, om);
    }

    /**
     * 
     * @param {*} rwyId 
     */
    midleMarker(rwyId) {
        rwyId = rwyId || this.flight.rwy;
        const { mm, map } = this.props;
        const rwy = map.nodes[rwyId];
        return mapDao.radial(rwy, rwy.hdg + 180, mm);
    }

    /**
     * Returns the distance to runway via om in nms
     * @param {*} rwyId 
     */
    approachDistance(rwyId) {
        rwyId = rwyId || this.flight.rwy;
        return mapDao.distance(this.flight, this.outerMarker(rwyId)) + this.props.om;
    }

    /**
     * Returns the distance to runway via om in nms
     */
    approachAlt(rwyId) {
        rwyId = rwyId || this.flight.rwy;
        return this.landingAlt(this.approachDistance(rwyId));
    }

    /**
     * Returns the maximum approach altitude in feet
     * Computed as the altutude at outermarker plus the altutude of maximum rate od descent
     * from the outermarker and the current position
     */
    maxApproachAlt(rwyId) {
        rwyId = rwyId || this.flight.rwy;
        const d = mapDao.distance(this.outerMarker(rwyId), this.flight);
        const da = this.vspeed() * d * 60 / this.flight.speed;
        return Math.round(da + this.outerMarkerAlt());
    }

    /**
     * 
     * @param {*} type 
     * @param {*} cmd 
     */
    fireEvent(type, cmd) {
        const { onEvent } = this.props;
        if (!!onEvent) {
            const event = buildEvent(type, this.flight, this.props.map, cmd);
            onEvent(event);
        }
        return this;
    }

    /**
     * Returns the Flight with a f+-
     * light data
     * @param {*} flight flight data
     */
    with(flight) {
        const invalid = _(VALIDATION_PROPS).find(key => {
            const value = flight[key];
            return (!value && value !== 0);
        });
        if (!!invalid) {
            console.trace('Flight with', invalid, 'invalid', flight);
        }
        const result = !invalid ? new Flight(flight, this.props) : this;
        return result;
    }

    /**
     * Returns the flight with modifier applied
     */
    apply() {
        const flightMap = fromJS(this.flight);
        const flight1 = _.reduce(arguments, (flight, modifier) => modifier(flight), flightMap).toJS();
        return this.with(flight1);
    }

    /**
     * 
     */
    nextPos() {
        const { speed, hdg } = this.flight;
        const { dt } = this.props;

        // Compute new position
        const ds = dt * speed / SECS_PER_HOUR;
        return mapDao.radial(this.flight, hdg, ds);
    }

    /**
     * 
     * @param {*} to the node
     */
    turnedTo(to) {
        const { dt } = this.props;
        const maxAngle = dt * TURNING_SPEED;
        const { angle } = mapDao.route(this.flight, to);
        const da = Math.abs(angle) <= maxAngle ? angle : Math.sign(angle) * maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(Modifier.set('hdg', newHdg));
    }

    /**
     * Returns the flight moved to checkpoint
     * @param {*} cpt the checkpoint
     * @param {*} onPassing the transformation callback on checkpoint passing
     */
    flyTo(cpt, onPassing) {
        const { dt } = this.props;
        const flight = this.flight;
        const { speed } = flight;
        // compute heading
        const d = mapDao.distance(flight, cpt);
        const ds = speed * dt / SECS_PER_HOUR;
        const newFlight = this
            .turnedTo(cpt)
            .moveHoriz()
            .moveVert();
        return ds >= d ? onPassing(newFlight) : newFlight;
    }

    /**
     * 
     */
    approachJunction() {
        const { speed, rwy } = this.flight;
        const om = this.outerMarker();
        const r = speed * RADIUS_PER_KNOTS;
        const rwyHdg = this.props.map.nodes[rwy].hdg;

        const pLPnt = mapDao.radial(om, rwyHdg - 90, r);
        const pRPnt = mapDao.radial(om, rwyHdg + 90, r);
        const dL = mapDao.distance(pLPnt, this.flight);
        const dR = mapDao.distance(pRPnt, this.flight);

        if (dR <= dL) {
            // right approach
            const sigma1 = mapDao.hdg(pRPnt, this.flight);
            const sigma = mapDao.normHdg(Math.round(sigma1 - Math.asin(r / dR) / RADS_PER_DEG));
            const c = mapDao.radial(pRPnt, sigma - 90, r);
            return { c, sigma, p: pRPnt, right: true };
        } else {
            // left approach
            const sigma1 = mapDao.hdg(pLPnt, this.flight);
            const sigma = mapDao.normHdg(Math.round(sigma1 + Math.asin(r / dL) / RADS_PER_DEG));
            const c = mapDao.radial(pLPnt, sigma + 90, r);
            return { c, sigma, p: pLPnt, right: false };
        }
    }

    /**
     * 
     * @param {*} alt 
     */
    speedByAlt(alt) {
        return speedByAlt(alt, this.props.flightTempl[this.flight.type]);
    }

    /**
     * Returns the flight with hdg turn right to hdg
     * @param {*} toHdg the target heading
     */
    turnedRight(toHdg) {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const angle = (toHdg >= hdg) ? toHdg - hdg : 360 + toHdg - hdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(Modifier.set('hdg', newHdg));
    }

    /**
     * Returns the flight with hdg turn left to checkpoint
     * @param {*} pivot the checkpoint
     */
    turnedRightTo(pivot) {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const toHdg = mapDao.hdg(pivot, this.flight);
        const angle = (toHdg >= hdg) ? toHdg - hdg : 360 + toHdg - hdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(Modifier.set('hdg', newHdg));
    }

    /**
     * Returns the flight with hdg turn left to checkpoint
     * @param {*} pivot the checkpoint
     */
    turnedLeftTo(pivot) {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const toHdg = mapDao.hdg(pivot, this.flight);
        const angle = (hdg >= toHdg) ? hdg - toHdg : 360 + hdg - toHdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg - da);
        return this.apply(Modifier.set('hdg', newHdg));
    }

    /**
     * Returns the flight in the outbound track
     * @param {*} onPassing the transformaton on passing the outbound end
     */
    outboundTrack(onPassing) {
        const { dt } = this.props;
        const flight = this.flight;
        const { holdHdg, loopTimer } = flight;
        const newFlight = this.apply(
            Modifier.update('loopTimer', lp => lp - dt)
        )
            .turnedRight(holdHdg)
            .moveHoriz()
            .moveVert();
        return loopTimer <= 0 ? onPassing(newFlight) : newFlight;
    }

    /**
     * 
     */
    moveHoriz() {
        // Compute new position
        return this.apply(Modifier.setLocation(this.nextPos()));
    }

    /**
     * 
     */
    moveVert() {
        const flight = this.flight;
        const { alt, toAlt } = flight;
        const { dt } = this.props;

        // Compute new altitude
        const vspeed = this.vspeed();
        const newAlt = alt < toAlt
            ? Math.min(toAlt, Math.round(alt + vspeed * dt * MINS_PER_SEC))
            : alt > toAlt
                ? Math.max(toAlt, Math.round(alt - vspeed * dt * MINS_PER_SEC))
                : alt;
        const newSpeed = this.speedByAlt(newAlt);
        const result = this.apply(
            Modifier.set('alt', newAlt),
            Modifier.set('speed', newSpeed));
        if (toAlt !== alt && newAlt === toAlt) {
            // flight level reached
            return result.fireEvent(EVENT_TYPES.PASSING);
        }
        return result;
    }

    /**
     * 
     */
    approachVert() {
        // Compute new altitude
        const { alt } = this.flight;
        const minAlt = Math.round(alt - this.vspeed() * this.props.dt * MINS_PER_SEC);
        const newAlt = Math.min(alt, Math.max(minAlt, this.approachAlt()));
        const newSpeed = this.speedByAlt(newAlt);
        return this.apply(
            Modifier.set('alt', newAlt),
            Modifier.set('speed', newSpeed));
    }

    /**
     * 
     */
    landVert() {
        // Compute new altitude
        const { alt } = this.flight;
        const minAlt = Math.round(alt - this.vspeed() * this.props.dt * MINS_PER_SEC);
        const newAlt = Math.min(alt, Math.max(minAlt, this.landingAlt()));
        const newSpeed = this.speedByAlt(newAlt);
        return this.apply(
            Modifier.set('alt', newAlt),
            Modifier.set('speed', newSpeed));
    }

    /**
     * 
     * @param {*} cmd 
     */
    processCommand(cmd) {
        switch (cmd.type) {
            case COMMAND_TYPES.CHANGE_LEVEL:
                return this.processChangeLevelCommand(cmd);
            case COMMAND_TYPES.TURN_HEADING:
                return this.processTurnHeadingCommand(cmd);
            case COMMAND_TYPES.CLEAR_TO_LAND:
                return this.processClearedToLandCommand(cmd);
            case COMMAND_TYPES.HOLD:
                return this.processHoldCommand(cmd);
            default:
                return this;
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processHoldCommand(cmd) {
        const { when } = cmd;
        const flight = this.flight;
        const { status, hdg, lat, lon } = flight;
        const { map, holdingDuration } = this.props;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {

            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_HOLD, cmd);
            }
            const fix = { lat, lon }
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_FROM),
                Modifier.set('loopTimer', holdingDuration / 2),
                Modifier.set('holdHdg', mapDao.normHdg(hdg + 180)),
                Modifier.set('fix', fix))
                .fireEvent(EVENT_TYPES.HOLD, cmd);
        } else {
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_HOLD_AT, cmd);
            }
            const at = map.nodes[when];
            const hdg = mapDao.hdg(at, flight);
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_TO_AT),
                Modifier.set('holdHdg', mapDao.normHdg(hdg + 180)),
                Modifier.set('at', when)
            ).fireEvent(EVENT_TYPES.HOLD_AT, cmd);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processClearedToLandCommand(cmd) {
        const { to } = cmd;
        const { alt, status } = this.flight;
        const { clearToLandDistance } = this.props;
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            // Flight at ground
            return this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_GROUND, cmd);
        } else if (this.approachDistance(to) > clearToLandDistance) {
            // Runway to distant
            return this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_DISTANCE, cmd);
        } else if (alt > this.maxApproachAlt(to)) {
            // Flight to high
            return this.fireEvent(EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE, cmd);
        } else {
            // Cleared to land
            return this.apply(
                Modifier.set('rwy', to),
                Modifier.set('status', FLIGHT_STATES.APPROACHING),
                Modifier.delete('turnTo'),
                Modifier.delete('at')
            ).fireEvent(EVENT_TYPES.CLEARED_TO_LAND, cmd);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processTurnHeadingCommand(cmd) {
        const { when, to } = cmd;
        const flight = this.flight;
        const { status } = flight;
        if (when === COMMAND_CONDITIONS.IMMEDIATE) {
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_FLY_TO, cmd);
            }
            return this.apply(
                Modifier.set('at', to),
                Modifier.set('status', FLIGHT_STATES.FLYING_TO),
                Modifier.delete('rwy'),
                Modifier.delete('om'),
                Modifier.delete('turnTo')
            ).fireEvent(EVENT_TYPES.FLY_TO, cmd);
        } else {
            if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
                return this.fireEvent(EVENT_TYPES.UNABLE_TO_FLY_TO_VIA, cmd);
            }
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.TURNING),
                Modifier.set('at', when),
                Modifier.delete('rwy'),
                Modifier.delete('om'),
                Modifier.set('turnTo', to)
            ).fireEvent(EVENT_TYPES.FLY_TO_VIA, cmd);
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processChangeLevelCommand(cmd) {
        const { flightLevel } = cmd;
        const { flightTempl } = this.props;
        const cmdAlt = parseInt(flightLevel) * 100;
        const { alt, status, type } = this.flight;
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            const speed = speedByAlt(0, flightTempl[type]);
            return this.apply(
                Modifier.set('toAlt', cmdAlt),
                Modifier.set('speed', speed),
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.delete('rwy')
            ).fireEvent(EVENT_TYPES.CLEARED_TO_TAKE_OFF, cmd);
        }
        if (status === FLIGHT_STATES.LANDING || status === FLIGHT_STATES.APPROACHING) {
            return this.apply(
                Modifier.set('toAlt', cmdAlt),
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.delete('om'),
                Modifier.delete('rwy')
            ).fireEvent(EVENT_TYPES.ATC_GO_AROUND, cmd);
        }
        const newFlight = this.apply(Modifier.set('toAlt', cmdAlt));
        if (cmdAlt > alt) {
            return newFlight.fireEvent(EVENT_TYPES.CLIMB_TO, cmd);
        } else if (cmdAlt < alt) {
            return newFlight.fireEvent(EVENT_TYPES.DESCEND_TO, cmd);
        } else {
            return newFlight.fireEvent(EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL, cmd);
        }
    }

    /**
     * Returns the flight status after time elapsed
     */
    processTime() {
        return this.processTimePhase1().processExit();
    }

    /**
     * 
     */
    processTimePhase1() {
        switch (this.flight.status) {
            case FLIGHT_STATES.FLYING_TO:
                return this.processTimeFlyingTo();
            case FLIGHT_STATES.FLYING:
                return this.processTimeFlying();
            case FLIGHT_STATES.TURNING:
                return this.processTimeTurning();
            case FLIGHT_STATES.APPROACHING:
                return this.processTimeApproaching();
            case FLIGHT_STATES.ALIGNING:
                return this.processTimeAligning();
            case FLIGHT_STATES.LANDING:
                return this.processTimeLanding();
            case FLIGHT_STATES.HOLDING_FROM:
                return this.processTimeHoldingFrom();
            case FLIGHT_STATES.HOLDING_TO:
                return this.processTimeHoldingTo();
            case FLIGHT_STATES.HOLDING_FROM_AT:
                return this.processTimeHoldingFromNode();
            case FLIGHT_STATES.HOLDING_TO_AT:
                return this.processTimeHoldingToNode();
            default:
                return this;
        }
    }

    /**
     * 
     */
    processTimeHoldingFromNode() {
        const flight = this.flight;
        return this.outboundTrack(fl => {
            const hdg1 = mapDao.normHdg(flight.hdg + fl.props.dt * TURNING_SPEED);
            return fl.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_TO_AT),
                Modifier.set('hdg', hdg1))
                .moveHoriz()
                .moveVert();
        });
    }

    /**
     * 
     */
    processTimeHoldingToNode() {
        return this.flyTo(this.props.map.nodes[this.flight.at], fl =>
            fl.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_FROM_AT),
                Modifier.set('loopTimer', fl.props.holdingDuration / 2)
            )
        );
    }

    /**
     * 
     */
    processTimeHoldingFrom() {
        const flight = this.flight;
        return this.outboundTrack(fl => {
            const hdg1 = mapDao.normHdg(flight.hdg + fl.props.dt * TURNING_SPEED);
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_TO),
                Modifier.set('hdg', hdg1)
            )
                .moveHoriz()
                .moveVert();
        });
    }

    /**
     * 
     */
    processTimeHoldingTo() {
        return this.flyTo(this.flight.fix, fl => {
            return fl.apply(
                Modifier.set('status', FLIGHT_STATES.HOLDING_FROM),
                Modifier.set('loopTimer', fl.props.holdingDuration / 2)
            );
        });
    }

    /**
     * 
     */
    processExit() {
        const { map, dt } = this.props;
        const flight = this.flight;
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
            return this.apply(
                Modifier.set('exit', exitNode.id),
                Modifier.set('status', FLIGHT_STATES.EXITED)
            );
        } else {
            return this;
        }
    }

    /**
     * 
     */
    processTimeApproaching() {
        const { dt, map } = this.props;
        const { hdg, speed, rwy } = this.flight;
        const { c, p, right } = this.approachJunction();

        const r = speed * RADIUS_PER_KNOTS;
        const maxTurn = dt * TURNING_SPEED;
        const d = mapDao.distance(this.flight, p);
        const { angle, d: dc } = mapDao.route(this.flight, c);
        const rwyHdg = map.nodes[rwy].hdg;
        const angle1 = mapDao.normAngle(hdg - rwyHdg);
        if (d <= r - 0.1) {
            // Missing approach cause distance from pivot turn
            console.error('Missing approach cause distance from pivot turn', this.flight);
            console.error('d', d, 'r', r);
            return this.apply(
                Modifier.set('toAlt', 4000),
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.delete('rwy'))
                .moveHoriz()
                .moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_APPROACH);
        }
        if (Math.abs(angle) > maxTurn && d <= 2 * r) {
            // Missing approach cause turn angle and pivot distance
            console.error('Missing approach turn angle and pivot distance', this.flight);
            console.error('d', d,
                'r', r,
                'angle', angle,
                'maxTurn', maxTurn,
                'r', r);
            return this.apply(
                Modifier.set('toAlt', 4000),
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.delete('rwy'))
                .moveHoriz()
                .moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_APPROACH);
        }
        const dd = speed * dt / SECS_PER_HOUR;
        if (dd < dc) {
            // flew length < junction checkpoint distance (not reached)
            // Turn to C 
            return this.turnedTo(c).moveHoriz().approachVert();
        } else if (Math.abs(angle1) > maxTurn) {
            // Start turn to om
            if (right) {
                return this.apply(
                    Modifier.set('status', FLIGHT_STATES.ALIGNING),
                    Modifier.set('right', right))
                    .turnedRightTo(this.outerMarker())
                    .moveHoriz()
                    .approachVert();
            } else {
                return this.apply(
                    Modifier.set('status', FLIGHT_STATES.ALIGNING),
                    Modifier.set('right', right))
                    .turnedLeftTo(this.outerMarker())
                    .moveHoriz()
                    .approachVert();
            }
        } else {
            // Turn to runway and land
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.LANDING))
                .turnedTo(c)
                .moveHoriz()
                .approachVert();
        }
    }
    /**
     * 
     */
    processTimeAligning() {
        const { right, rwy, hdg } = this.flight;
        const { map, dt } = this.props;
        const rwyHdg = map.nodes[rwy].hdg;
        const da = mapDao.normAngle(rwyHdg - hdg);
        const maxAngle = dt * TURNING_SPEED;
        if (Math.abs(da) <= maxAngle) {
            // turn completed
            return this.apply(
                Modifier.delete('right'),
                Modifier.set('status', FLIGHT_STATES.LANDING),
                Modifier.set('hdg', rwyHdg))
                .moveHoriz()
                .landVert();
        } else if (right) {
            return this.turnedRightTo(this.outerMarker())
                .moveHoriz()
                .landVert();
        } else {
            return this.turnedLeftTo(this.outerMarker())
                .moveHoriz()
                .landVert();
        }
    }

    /**
     * 
     */
    processTimeLanding() {
        const { dt, map, landingHdgRange, flightTempl, goAroundAlt, mm } = this.props;
        const flight = this.flight;
        const { speed, rwy, type, alt } = flight;
        const runwayNode = map.nodes[rwy];
        const { from, d, angle } = mapDao.route(flight, runwayNode);
        const ds = speed * dt / SECS_PER_HOUR;
        if (from) {
            // Go around due to missing runway cause flying away
            console.error('Missing runway direction from', this.flight);
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.set('toAlt', goAroundAlt),
                Modifier.delete('rwy'))
                .moveHoriz()
                .moveVert()
                .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
        }
        if (ds > d) {
            // touching
            if (Math.abs(angle) > landingHdgRange) {
                // Go around due to missing runway cause land alignment
                console.error('Missing runway land alignment', this.flight);
                return this.apply(
                    Modifier.set('status', FLIGHT_STATES.FLYING),
                    Modifier.set('toAlt', goAroundAlt),
                    Modifier.delete('rwy'))
                    .moveHoriz()
                    .moveVert()
                    .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
            }
            // Landed
            return this.apply(
                Modifier.set('lat', runwayNode.lat),
                Modifier.set('lon', runwayNode.lon),
                Modifier.set('speed', 0),
                Modifier.set('alt', 0),
                Modifier.set('status', FLIGHT_STATES.LANDED))
        }

        // Compute shifting
        const shifting = d * Math.sin(angle * RADS_PER_DEG);

        if (Math.abs(shifting) >= ds) {
            if (d < mm) {
                // Missing runway too shifted
                console.error('Missing runway too shifted', this.flight);
                return this.apply(
                    Modifier.set('status', FLIGHT_STATES.FLYING),
                    Modifier.set('toAlt', goAroundAlt),
                    Modifier.delete('rwy'))
                    .moveHoriz()
                    .moveVert()
                    .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY);
            }
            // fly to midle marker
            return this.turnedTo(this.midleMarker())
                .moveHoriz()
                .landVert();
        }

        // Compute forward point
        const df = Math.sqrt(ds * ds - shifting * shifting);
        const fPts = mapDao.radial(runwayNode, runwayNode.hdg + 180, d - df);

        // Compute altitude
        const apprAlt = this.landingAlt(d - ds);
        const { vspeed } = flightTempl[type];
        const minAlt = Math.round(alt - vspeed * dt * MINS_PER_SEC);
        if (apprAlt < minAlt) {
            // Go around cause altitude
            console.error('Missing runway alitude', this.flight);
            return this.apply(
                Modifier.set('status', FLIGHT_STATES.FLYING),
                Modifier.set('toAlt', goAroundAlt),
                Modifier.delete('rwy'))
                .fireEvent(EVENT_TYPES.GO_AROUND_RUNWAY)
                .moveHoriz()
                .moveVert();
        }

        return this.turnedTo(fPts).moveHoriz()
            .landVert();
    }

    /**
     * 
     */
    processTimeTurning() {
        const { map } = this.props;
        const { turnTo, at } = this.flight;
        return this.flyTo(map.nodes[at], fl =>
            fl.apply(
                Modifier.set('status', FLIGHT_STATES.FLYING_TO),
                Modifier.set('at', turnTo),
                Modifier.delete('turnTo'))
                .fireEvent(EVENT_TYPES.FLYING_TO)
        );
    }

    /**
     * 
     */
    processTimeFlying() {
        return this.moveHoriz().moveVert();
    }

    /**
     * 
     */
    processTimeFlyingTo() {
        const atNode = this.props.map.nodes[this.flight.at];
        return this.flyTo(atNode, fl =>
            fl.apply(
                Modifier.delete('at'),
                Modifier.set('status', FLIGHT_STATES.FLYING)
            )
        );
    }
}

export { Flight, FLIGHT_TYPES, FLIGHT_STATES, Modifier };
