import { fromJS, Map } from 'immutable';
import { mapDao } from './MapDao';
import _ from 'lodash';
import {
    Message, Command,
    CommandMessage, FlightLevelCommandMessage, HoldAtCommandMessage, FlyToCommandMessage, TakeoffCommandMessage, LandCommandMessage,
    buildReadbackMessage, buildInvalidFlightLevelMessage, buildBeaconNotFoundMessage,
    buildAtGroundMessage, buildNotAtGroundMessage, buildRunwayNotFoundMessage,
    buildATCNotFoundMessage, buildInvalidRunwayMessage, buildMissingRunwayMessage, buildMissingApproachMessage,
    buildPassingFlightLevelMessage, buildTooDistanthMessage, buildTooHighMessage,
    buildFlyingToMessage,
    buildRogerMessage,
    buildClimbCommand,
    buildClearedToMessage
} from './Message';
import { AreaMap, GeoLocation, isRunway, isEntryNode } from './Map';
import { Flight, FlightStatus, FlightType } from './Flight';
import { Level } from './Level';
import { sprintf } from 'sprintf-js';

const MIN_ALTITUDE = 4000;
const MAX_ALTITUDE = 36000;
const ALTITUDE_SEPARATION = 4000;
const TURNING_SPEED = 3; // DEG / s
const SECS_PER_HOUR = 3600;
const MINS_PER_SEC = 1.0 / 60;
const FEET_PER_NM = 1852 / 0.3048;
const RADS_PER_DEG = Math.PI / 180;
const RADIUS_PER_KNOTS = 1 / 60 / Math.PI;
const VALIDATION_PROPS = ['hdg', 'speed', 'lat', 'lon', 'alt'];

export interface FlightTemplate {
    readonly speed0: number;    // knot
    readonly speed360: number;  // knot
    readonly vspeed: number;    // ftpm
}

export interface SimulationOptions {
    readonly dt: number;                // sec
    readonly jetProb: number;
    readonly safeEntryDelay: number;    // sec
    readonly entryAlt: number;          // feet
    readonly exitAlt: number;           // feet
    readonly collisionDistance: number; // nms
    readonly collisionAlt: number;      // feet
    readonly om: number;                // nms
    readonly mm: number;                // nms (5469')
    readonly clearToLandDistance: number;   // nms
    readonly exitDistance: number;      // nms
    readonly landingHdgRange: number;   // DEG
    readonly landingAngle: number;      // DEG
    readonly conditionDistance: number; // nms
    readonly holdingDuration: number,   // sec
    readonly goAroundAlt: number,       // feet
    readonly flightTempl: Record<FlightType, FlightTemplate>;
    readonly flightVoices: string[];
}

export interface SimulationProps extends SimulationOptions {
    readonly map: AreaMap;
    readonly level: Level;
}

/**
 * 
 * @param alt 
 * @param template 
 */
function speedByAlt(alt: number, template: FlightTemplate): number {
    return Math.round(alt / 36000 * (template.speed360 - template.speed0) + template.speed0);
}

export type Modifier = (flight: Map<string, any>) => Map<string, any>;

/**
 * 
 * @param key 
 * @param value 
 */
export const setMod: <T>(key: string, value: T) => Modifier =
    (key, value) => (flight: Map<string, any>) => flight.set(key, value);

/**
 * 
 * @param key 
 */
export const deleteMod: (key: string) => Modifier =
    (key) => (flight: Map<string, any>) => flight.delete(key);

/**
 * 
 * @param key 
 * @param updater 
 */
export const updateMod: <T>(key: string, updater: (value: T) => T) => Modifier =
    (key, updater) => (flight: Map<string, any>) => flight.update(key, updater);

/**
 * 
 * @param loc 
 */
export const setLocationMod: (loc: GeoLocation) => Modifier =
    (loc) => (flight: Map<string, any>) => flight.set('lat', loc.lat).set('lon', loc.lon)

interface Junction {
    /** Entry point */
    readonly entry: GeoLocation;
    /** Pivot */
    readonly pivot: GeoLocation;
    /** sigma */
    readonly sigma: number;
    /** true if right junction */
    readonly right: boolean;
}

/**
 * 
 */
export class FlightProcessor {
    private _flight: Flight;
    private _messages: Message[];
    private _props: SimulationProps;

    /**
     * 
     * @param flight 
     * @param props 
     * @param messages 
     */
    constructor(flight: Flight, props: SimulationProps, messages: Message[] = []) {
        this._flight = flight;
        this._messages = messages;
        this._props = props;
        _.bindAll(this);
    }

    /** */
    get messages() { return this._messages; }

    /** */
    get props() { return this._props; }

    /** Returns the JSON flight */
    get flight() { return this._flight; }

    /** */
    get map() { return this.props.map; }

    /** */
    private addFlyingToDialog(): FlightProcessor {
        const { at } = this.flight;
        if (!at) {
            throw new Error('missing at');
        }
        return this.addMessage([
            buildFlyingToMessage(this.flight, this.map.id),
            buildClearedToMessage(this.map.id, this.flight.id, at)
        ]);
    }

    /** */
    private addMissingApproachDialog(): FlightProcessor {
        const fl = sprintf('%03d', Math.round(this.flight.toAlt / 100));
        const climbMsg = buildClimbCommand(this.flight.id, this.map.id, fl);
        return this.addMessage([
            buildMissingApproachMessage(this.flight.id, this.map.id, fl),
            climbMsg,
            buildReadbackMessage(climbMsg)
        ]);
    }

    /** */
    private addMissingRunwayDialog(): FlightProcessor {
        const fl = sprintf('%03d', Math.round(this.flight.toAlt / 100));
        const climbMsg = buildClimbCommand(this.flight.id, this.map.id, fl);
        return this.addMessage([
            buildMissingRunwayMessage(this.flight.id, this.map.id, fl),
            climbMsg,
            buildReadbackMessage(climbMsg)
        ]);
    }

    /** */
    private addPassingFlightLevelDialog(): FlightProcessor {
        return this.addMessage([
            buildPassingFlightLevelMessage(this.flight.id, this.map.id, this.flight.alt),
            buildRogerMessage(this.map.id, this.flight.id)
        ]);
    }

    /**
     * 
     */
    vspeed(): number {
        return this.props.flightTempl[this.flight.type].vspeed;
    }

    /**
     * Returns the landing altitude in feet
     * @param distance the distance nms or undefined if from flight location
     */
    landingAlt(distance?: number): number {
        const { landingAngle, map } = this.props;
        if (!distance) {
            const { rwy } = this.flight;
            if (!rwy) {
                throw new Error('missing runway');
            }
            const d = mapDao.distance(map.nodes[rwy], this.flight);
            return Math.round(d * Math.tan(landingAngle * RADS_PER_DEG) * FEET_PER_NM);
        } else {
            return Math.round(distance * Math.tan(landingAngle * RADS_PER_DEG) * FEET_PER_NM);
        }
    }

    /**
     * Returns the outermarker alt
     */
    outerMarkerAlt(): number {
        return this.landingAlt(this.props.om);
    }

    /**
     * 
     * @param rwyId 
     */
    outerMarker(rwyId?: string): GeoLocation {
        rwyId = rwyId || this.flight.rwy || '';
        if (!rwyId) {
            throw new Error('missing runway');
        }
        const { om, map } = this.props;
        const rwy = map.nodes[rwyId];
        if (!isRunway(rwy)) {
            throw new Error('not a runway');
        }
        return mapDao.radial(rwy, rwy.hdg + 180, om);
    }

    /**
     * 
     * @param rwyId 
     */
    midleMarker(rwyId?: string): GeoLocation {
        rwyId = rwyId || this.flight.rwy;
        if (!rwyId) {
            throw new Error('missing runway');
        }
        const { mm, map } = this.props;
        const rwy = map.nodes[rwyId];
        if (!isRunway(rwy)) {
            throw new Error('not a runway');
        }
        return mapDao.radial(rwy, rwy.hdg + 180, mm);
    }

    /**
     * Returns the distance to runway via om in nms
     * @param rwyId 
     */
    approachDistance(rwyId?: string) {
        return mapDao.distance(this.flight, this.outerMarker(rwyId)) + this.props.om;
    }

    /**
     * Returns the distance to runway via om in nms
     * @param rwyId 
     */
    approachAlt(rwyId?: string): number {
        return this.landingAlt(this.approachDistance(rwyId));
    }

    /**
     * Returns the maximum approach altitude in feet
     * Computed as the altutude at outermarker plus the altutude of maximum rate od descent
     * from the outermarker and the current position
     */
    maxApproachAlt(rwyId?: string): number {
        const d = mapDao.distance(this.outerMarker(rwyId), this.flight);
        const da = this.vspeed() * d * 60 / this.flight.speed;
        return Math.round(da + this.outerMarkerAlt());
    }

    /**
     * 
     * @param msg 
     */
    addMessage(msg: Message | Message[]): FlightProcessor {
        const messages = _.concat(this.messages, msg);
        return this.withMessages(messages);
    }

    /**
     * Returns the Flight with a flight data
     * @param flight flight data
     */
    withFlight(flight: Flight): FlightProcessor {
        const invalid = _(VALIDATION_PROPS).find(key => {
            const value = (flight as any)[key];
            return (!value && value !== 0);
        });
        if (!!invalid) {
            console.trace('Flight with', invalid, 'invalid', flight);
        }
        const result = !invalid ? new FlightProcessor(flight, this.props, this.messages) : this;
        return result;
    }

    /**
     * 
     * @param messages 
     */
    withMessages(messages: Message[]): FlightProcessor {
        return new FlightProcessor(this.flight, this.props, messages);
    }

    /**
     * Returns the flight with modifier applied
     * @param modifiers 
     */
    apply(...modifiers: Modifier[]): FlightProcessor {
        const flightMap = fromJS(this.flight);
        const flight1 = _.reduce(modifiers, (flight, modifier) => modifier(flight), flightMap).toJS();
        return this.withFlight(flight1);
    }

    /** */
    nextPos(): GeoLocation {
        const { speed, hdg } = this.flight;
        const { dt } = this.props;

        // Compute new position
        const ds = dt * speed / SECS_PER_HOUR;
        return mapDao.radial(this.flight, hdg, ds);
    }

    /**
     * 
     * @param to the node
     */
    turnedTo(to: GeoLocation): FlightProcessor {
        const { dt } = this.props;
        const maxAngle = dt * TURNING_SPEED;
        const { angle } = mapDao.route(this.flight, to);
        const da = Math.abs(angle) <= maxAngle ? angle : Math.sign(angle) * maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(setMod('hdg', newHdg));
    }

    /**
     * Returns the flight moved to checkpoint
     * @param cpt the checkpoint
     * @param onPassing the transformation callback on checkpoint passing
     */
    flyTo(cpt: GeoLocation, onPassing: (arg: FlightProcessor) => FlightProcessor): FlightProcessor {
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

    /** */
    approachJunction(): Junction {
        const { speed, rwy } = this.flight;
        if (!rwy) {
            throw new Error('missing runway');
        }

        const om = this.outerMarker();
        const r = speed * RADIUS_PER_KNOTS;
        const rwyNode = this.props.map.nodes[rwy];
        if (!isRunway(rwyNode)) {
            throw new Error('not a runway');
        }
        const rwyHdg = rwyNode.hdg;
        const pLPnt = mapDao.radial(om, rwyHdg - 90, r);
        const pRPnt = mapDao.radial(om, rwyHdg + 90, r);
        const dL = mapDao.distance(pLPnt, this.flight);
        const dR = mapDao.distance(pRPnt, this.flight);

        if (dR <= dL) {
            // right approach
            const sigma1 = mapDao.hdg(pRPnt, this.flight);
            const sigma = mapDao.normHdg(Math.round(sigma1 - Math.asin(r / dR) / RADS_PER_DEG));
            const entry = mapDao.radial(pRPnt, sigma - 90, r);
            return { entry, sigma, pivot: pRPnt, right: true };
        } else {
            // left approach
            const sigma1 = mapDao.hdg(pLPnt, this.flight);
            const sigma = mapDao.normHdg(Math.round(sigma1 + Math.asin(r / dL) / RADS_PER_DEG));
            const entry = mapDao.radial(pLPnt, sigma + 90, r);
            return { entry, sigma, pivot: pLPnt, right: false };
        }
    }

    /**
     * 
     * @param alt 
     */
    speedByAlt(alt: number): number {
        return speedByAlt(alt, this.props.flightTempl[this.flight.type]);
    }

    /**
     * Returns the flight with hdg turn right to hdg
     * @param toHdg the target heading
     */
    turnedRight(toHdg: number): FlightProcessor {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const angle = (toHdg >= hdg) ? toHdg - hdg : 360 + toHdg - hdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(setMod('hdg', newHdg));
    }

    /**
     * Returns the flight with hdg turn left to checkpoint
     * @param pivot the checkpoint
     */
    turnedRightTo(pivot: GeoLocation): FlightProcessor {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const toHdg = mapDao.hdg(pivot, this.flight);
        const angle = (toHdg >= hdg) ? toHdg - hdg : 360 + toHdg - hdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg + da);
        return this.apply(setMod('hdg', newHdg));
    }

    /**
     * Returns the flight with hdg turn left to checkpoint
     * @param pivot the checkpoint
     */
    turnedLeftTo(pivot: GeoLocation): FlightProcessor {
        const { dt } = this.props;
        const { hdg } = this.flight;
        const toHdg = mapDao.hdg(pivot, this.flight);
        const angle = (hdg >= toHdg) ? hdg - toHdg : 360 + hdg - toHdg;
        const maxAngle = dt * TURNING_SPEED;
        const da = angle <= maxAngle ? angle : maxAngle;
        const newHdg = mapDao.normHdg(this.flight.hdg - da);
        return this.apply(setMod('hdg', newHdg));
    }

    /**
     * Returns the flight in the outbound track
     * @param onPassing the transformaton on passing the outbound end
     */
    outboundTrack(onPassing: (arg: FlightProcessor) => FlightProcessor): FlightProcessor {
        const { dt } = this.props;
        const flight = this.flight;
        const { holdHdg, loopTimer } = flight;
        if (!holdHdg) {
            throw new Error('missing hold heading');
        }
        const newFlight = this.apply(updateMod<number>('loopTimer', lp => lp - dt))
            .turnedRight(holdHdg)
            .moveHoriz()
            .moveVert();
        return (!loopTimer || loopTimer <= 0) ? onPassing(newFlight) : newFlight;
    }

    /** */
    moveHoriz(): FlightProcessor {
        // Compute new position
        return this.apply(setLocationMod(this.nextPos()));
    }

    /** */
    moveVert(): FlightProcessor {
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
            setMod('alt', newAlt),
            setMod('speed', newSpeed));

        return (toAlt !== alt && newAlt === toAlt)
            ? result.addPassingFlightLevelDialog()
            : result;
    }

    /** */
    approachVert(): FlightProcessor {
        // Compute new altitude
        const { alt } = this.flight;
        const minAlt = Math.round(alt - this.vspeed() * this.props.dt * MINS_PER_SEC);
        const newAlt = Math.min(alt, Math.max(minAlt, this.approachAlt()));
        const newSpeed = this.speedByAlt(newAlt);
        return this.apply(
            setMod('alt', newAlt),
            setMod('speed', newSpeed));
    }

    /** */
    landVert(): FlightProcessor {
        // Compute new altitude
        const { alt } = this.flight;
        const minAlt = Math.round(alt - this.vspeed() * this.props.dt * MINS_PER_SEC);
        const newAlt = Math.min(alt, Math.max(minAlt, this.landingAlt()));
        const newSpeed = this.speedByAlt(newAlt);
        return this.apply(
            setMod('alt', newAlt),
            setMod('speed', newSpeed));
    }

    /**
     * 
     * @param cmd 
     */
    processCommand(cmd: CommandMessage): FlightProcessor {
        switch (cmd.cmd) {
            case Command.Climb:
                return this.processClimbCommand(cmd as FlightLevelCommandMessage);
            case Command.Descend:
                return this.processDescendCommand(cmd as FlightLevelCommandMessage);
            case Command.Maintain:
                return this.processMaintainCommand(cmd as FlightLevelCommandMessage);
            case Command.ClearedToTakeoff:
                return this.processTakeoffCommand(cmd as TakeoffCommandMessage);
            case Command.FlyTo:
            case Command.FlyToVia:
                return this.processFlyToCommand(cmd as FlyToCommandMessage);
            case Command.ClearedToLand:
                return this.processClearedToLandCommand(cmd as LandCommandMessage);
            case Command.HoldCurrentPosition:
            case Command.HoldAt:
                return this.processHoldCommand(cmd as HoldAtCommandMessage);
            default:
                return this;
        }
    }

    /**
     * 
     * @param cmd 
     */
    processHoldCommand(cmd: HoldAtCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd);
        if (invalid) {
            return invalid;
        }
        const { at } = cmd;
        if (at && !this.props.map.nodes[at]) {
            return this.addMessage(
                buildBeaconNotFoundMessage(this.flight.id, this.props.map.id, at)
            );
        }
        const { status, hdg, lat, lon } = this.flight;
        const { map, holdingDuration } = this.props;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        if (!at) {
            const fix: GeoLocation = { lat, lon };
            return this.apply(
                setMod('status', FlightStatus.HoldingFrom),
                setMod('loopTimer', holdingDuration / 2),
                setMod('holdHdg', mapDao.normHdg(hdg + 180)),
                setMod('fix', fix))
                .addMessage(buildReadbackMessage(cmd));
        } else {
            const atNode = map.nodes[at];
            const hdg = mapDao.hdg(atNode, this.flight);
            const result = this.apply(
                setMod('status', FlightStatus.HoldingToAt),
                setMod('holdHdg', mapDao.normHdg(hdg + 180)),
                setMod('at', at))
                .addMessage(buildReadbackMessage(cmd));
            return result;
        }
    }

    /**
     * 
     * @param {*} cmd 
     */
    processClearedToLandCommand(cmd: LandCommandMessage) {
        const invalid = this.validateATC(cmd);
        if (invalid) {
            return invalid;
        }
        const { rwy } = cmd;
        if (!this.props.map.nodes[rwy]) {
            return this.addMessage(
                buildRunwayNotFoundMessage(this.flight.id, this.props.map.id, rwy)
            );
        }
        const { alt, status } = this.flight;
        const { clearToLandDistance } = this.props;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        if (this.approachDistance(rwy) > clearToLandDistance) {
            return this.addMessage(
                buildTooDistanthMessage(this.flight.id, this.props.map.id)
            );
        }
        if (alt > this.maxApproachAlt(rwy)) {
            // Flight to high
            return this.addMessage(
                buildTooHighMessage(this.flight.id, this.props.map.id)
            );
        }
        // Cleared to land
        const result = this.apply(
            setMod('rwy', rwy),
            setMod('status', FlightStatus.Approaching),
            deleteMod('turnTo'),
            deleteMod('at'))
            .addMessage(buildReadbackMessage(cmd));
        return result;
    }

    /**
     * 
     * @param cmd 
     */
    processFlyToCommand(cmd: FlyToCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd);
        if (invalid) {
            return invalid;
        }
        const { via, turnTo } = cmd;
        if (!this.props.map.nodes[turnTo]) {
            return this.addMessage(
                buildBeaconNotFoundMessage(this.flight.id, this.props.map.id, turnTo)
            );
        }
        if (via && !this.props.map.nodes[via]) {
            return this.addMessage(
                buildBeaconNotFoundMessage(this.flight.id, this.props.map.id, via)
            );
        }
        const { status } = this.flight;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        const f1 = !via
            ? this.apply(
                setMod('at', turnTo),
                setMod('status', FlightStatus.FlyingTo),
                deleteMod('turnTo'))
            : this.apply(
                setMod('at', via),
                setMod('status', FlightStatus.Turning),
                setMod('turnTo', turnTo));
        const result = f1.apply(deleteMod('rwy'))
            .addMessage(
                buildReadbackMessage(cmd)
            );
        return result;
    }

    /**
     * 
     * @param {*} cmd 
     */
    validateATC(cmd: CommandMessage): FlightProcessor | undefined {
        const { from } = cmd;
        if (!from) {
            throw new Error('missing atc id');
        }
        if (from !== this.props.map.id) {
            // Invalid ATC
            return this.addMessage(
                buildATCNotFoundMessage(this.flight.id, from)
            );
        }
    }

    /**
     * 
     * @param cmd 
     */
    validateFlightLevelCommand(cmd: FlightLevelCommandMessage): FlightProcessor | undefined {
        const { flightLevel } = cmd;
        const toAlt = parseInt(flightLevel) * 100;
        if (toAlt < MIN_ALTITUDE
            || toAlt > MAX_ALTITUDE
            || (toAlt % ALTITUDE_SEPARATION)) {
            // Invalid flight level
            return this.addMessage(
                buildInvalidFlightLevelMessage(this.flight.id, this.props.map.id, flightLevel)
            );
        }
    }

    /**
     * 
     * @param cmd 
     */
    processClimbCommand(cmd: FlightLevelCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd) || this.validateFlightLevelCommand(cmd);
        if (invalid) {
            return invalid;
        }
        const { flightLevel } = cmd;
        const cmdAlt = parseInt(flightLevel) * 100;
        const { alt, status } = this.flight;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        if (alt >= cmdAlt) {
            return this.addMessage(
                buildInvalidFlightLevelMessage(this.flight.id, this.props.map.id, flightLevel)
            );
        }
        const newFLight = (status === FlightStatus.Landing || status === FlightStatus.Approaching || status === FlightStatus.Aligning)
            ? this.apply(
                setMod('toAlt', cmdAlt),
                setMod('status', FlightStatus.Flying),
                deleteMod('rwy')
            )
            : this.apply(setMod('toAlt', cmdAlt));
        return newFLight.addMessage(
            buildReadbackMessage(cmd)
        );
    }

    /**
     * 
     * @param cmd 
     */
    processDescendCommand(cmd: FlightLevelCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd) || this.validateFlightLevelCommand(cmd);
        if (invalid) {
            return invalid;
        }
        const { flightLevel } = cmd;
        const cmdAlt = parseInt(flightLevel) * 100;
        const { alt, status } = this.flight;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        if (alt <= cmdAlt) {
            return this.addMessage(
                buildInvalidFlightLevelMessage(this.flight.id, this.props.map.id,flightLevel)
            );
        }
        const newFLight = (status === FlightStatus.Landing || status === FlightStatus.Approaching || status === FlightStatus.Aligning)
            ? this.apply(
                setMod('toAlt', cmdAlt),
                setMod('status', FlightStatus.Flying),
                deleteMod('rwy')
            )
            : this.apply(setMod('toAlt', cmdAlt));
        return newFLight.addMessage(
            buildReadbackMessage(cmd)
        );
    }

    /**
     * 
     * @param cmd 
     */
    processMaintainCommand(cmd: FlightLevelCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd) || this.validateFlightLevelCommand(cmd);
        if (invalid) {
            return invalid;
        }
        const { flightLevel } = cmd;
        const cmdAlt = parseInt(flightLevel) * 100;
        const { alt, status } = this.flight;
        if (status === FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildAtGroundMessage(this.flight.id, this.props.map.id, this.flight.from)
            );
        }
        if (alt !== cmdAlt) {
            return this.addMessage(
                buildInvalidFlightLevelMessage(this.flight.id, this.props.map.id,flightLevel)
            );
        }
        const newFLight = (status === FlightStatus.Landing || status === FlightStatus.Approaching || status === FlightStatus.Aligning)
            ? this.apply(
                setMod('toAlt', cmdAlt),
                setMod('status', FlightStatus.Flying),
                deleteMod('rwy')
            )
            : this.apply(setMod('toAlt', cmdAlt));
        return newFLight.addMessage(
            buildReadbackMessage(cmd)
        );
    }

    /**
     * 
     * @param {*} cmd 
     */
    processTakeoffCommand(cmd: TakeoffCommandMessage): FlightProcessor {
        const invalid = this.validateATC(cmd) || this.validateFlightLevelCommand(cmd);
        if (invalid) {
            return invalid;
        }
        const { flightLevel, rwy } = cmd;
        const cmdAlt = parseInt(flightLevel) * 100;
        const { status, from: flightRwy } = this.flight;
        if (status !== FlightStatus.WaitingForTakeoff) {
            return this.addMessage(
                buildNotAtGroundMessage(this.flight.id, this.props.map.id, rwy)
            );
        }
        if (rwy !== flightRwy) {
            return this.addMessage(
                buildInvalidRunwayMessage(this.flight.id, this.props.map.id, rwy)
            );
        }
        return this.apply(
            setMod('toAlt', cmdAlt),
            setMod('status', FlightStatus.Flying),
            deleteMod('rwy'))
            .addMessage(
                buildReadbackMessage(cmd)
            );
    }

    /** Returns the flight status after time elapsed */
    processTime(): FlightProcessor {
        return this.processTimePhase1().processExit();
    }

    /** */
    private processTimePhase1(): FlightProcessor {
        switch (this.flight.status) {
            case FlightStatus.FlyingTo:
                return this.processTimeFlyingTo();
            case FlightStatus.Flying:
                return this.processTimeFlying();
            case FlightStatus.Turning:
                return this.processTimeTurning();
            case FlightStatus.Approaching:
                return this.processTimeApproaching();
            case FlightStatus.Aligning:
                return this.processTimeAligning();
            case FlightStatus.Landing:
                return this.processTimeLanding();
            case FlightStatus.HoldingFrom:
                return this.processTimeHoldingFrom();
            case FlightStatus.HoldingTo:
                return this.processTimeHoldingTo();
            case FlightStatus.HoldingFromAt:
                return this.processTimeHoldingFromNode();
            case FlightStatus.HoldingToAt:
                return this.processTimeHoldingToNode();
            default:
                return this;
        }
    }

    /** */
    processTimeHoldingFromNode(): FlightProcessor {
        const flight = this.flight;
        return this.outboundTrack(fl => {
            const hdg1 = mapDao.normHdg(flight.hdg + fl.props.dt * TURNING_SPEED);
            return fl.apply(
                setMod('status', FlightStatus.HoldingToAt),
                setMod('hdg', hdg1))
                .moveHoriz()
                .moveVert();
        });
    }

    /** */
    processTimeHoldingToNode(): FlightProcessor {
        const { at } = this.flight;
        if (!at) {
            throw new Error('missing at');
        }
        return this.flyTo(this.props.map.nodes[at], fl =>
            fl.apply(
                setMod('status', FlightStatus.HoldingFromAt),
                setMod('loopTimer', fl.props.holdingDuration / 2)
            )
        );
    }

    /** */
    processTimeHoldingFrom(): FlightProcessor {
        const flight = this.flight;
        return this.outboundTrack(fl => {
            const hdg1 = mapDao.normHdg(flight.hdg + fl.props.dt * TURNING_SPEED);
            return this.apply(
                setMod('status', FlightStatus.HoldingTo),
                setMod('hdg', hdg1))
                .moveHoriz()
                .moveVert();
        });
    }

    /** */
    processTimeHoldingTo(): FlightProcessor {
        const { fix } = this.flight;
        if (!fix) {
            throw new Error('missing fix');
        }
        return this.flyTo(fix, fl => {
            return fl.apply(
                setMod('status', FlightStatus.HoldingFrom),
                setMod('loopTimer', fl.props.holdingDuration / 2)
            );
        });
    }

    /** */
    processExit(): FlightProcessor {
        const { map, dt } = this.props;
        const flight = this.flight;
        const ds = flight.speed * dt / SECS_PER_HOUR;
        const exitNode = _.findKey(map.nodes, node => {
            if (!isEntryNode(node)) {
                return false;
            }
            const nodeHdg = node.hdg;
            const diff = mapDao.normAngle(flight.hdg - nodeHdg);
            if (Math.abs(diff) <= 90) {
                return false;
            }
            const { from, d } = mapDao.route(flight, node);
            return from && d <= ds && Math.abs(diff);
        });
        if (!!exitNode) {
            return this.apply(
                setMod('exit', exitNode),
                setMod('status', FlightStatus.Exited)
            );
        } else {
            return this;
        }
    }

    /**
     * 
     */
    processTimeApproaching(): FlightProcessor {
        const { dt, map } = this.props;
        const { hdg, speed, rwy } = this.flight;
        if (!rwy) {
            throw new Error('missing runway');
        }
        const rwyNode = map.nodes[rwy];
        if (!isRunway(rwyNode)) {
            throw new Error('not a runway');
        }
        const rwyHdg = rwyNode.hdg;

        const { entry: c, pivot: p, right } = this.approachJunction();
        const r = speed * RADIUS_PER_KNOTS;
        const maxTurn = dt * TURNING_SPEED;
        const d = mapDao.distance(this.flight, p);
        const { angle, d: dc } = mapDao.route(this.flight, c);
        const angle1 = mapDao.normAngle(hdg - rwyHdg);
        if (d <= r - 0.1) {
            // Missing approach cause distance from pivot turn
            console.error('Missing approach cause distance from pivot turn', this.flight);
            console.error('d', d, 'r', r);
            return this.apply(
                setMod('toAlt', this.props.goAroundAlt),
                setMod('status', FlightStatus.Flying),
                deleteMod('rwy'))
                .moveHoriz()
                .moveVert()
                .addMissingApproachDialog();
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
                setMod('toAlt', this.props.goAroundAlt),
                setMod('status', FlightStatus.Flying),
                deleteMod('rwy'))
                .moveHoriz()
                .moveVert()
                .addMissingApproachDialog();
        }
        const dd = speed * dt / SECS_PER_HOUR;
        if (dd < dc) {
            // flew length < junction checkpoint distance (not reached)
            // Turn to C 
            return this.turnedTo(c).moveHoriz().approachVert();
        } else if (Math.abs(angle1) > maxTurn) {
            // Start turn to om
            const f1 = this.apply(
                setMod('status', FlightStatus.Aligning),
                setMod('right', right));
            const f2 = (right) ? f1.turnedRightTo(f1.outerMarker()) : f1.turnedLeftTo(f1.outerMarker());
            return f2.moveHoriz().approachVert();
        } else {
            // Turn to runway and land
            return this.apply(
                setMod('status', FlightStatus.Landing))
                .turnedTo(c)
                .moveHoriz()
                .approachVert();
        }
    }

    /** */
    processTimeAligning(): FlightProcessor {
        const { right, rwy, hdg } = this.flight;
        if (!rwy) {
            throw new Error('missing runway');
        }
        const { map, dt } = this.props;
        const rwyNode = map.nodes[rwy];
        if (!isRunway(rwyNode)) {
            throw new Error('not a runway');
        }
        const rwyHdg = rwyNode.hdg;
        const da = mapDao.normAngle(rwyHdg - hdg);
        const maxAngle = dt * TURNING_SPEED;
        if (Math.abs(da) <= maxAngle) {
            // turn completed
            return this.apply(
                deleteMod('right'),
                setMod('status', FlightStatus.Landing),
                setMod('hdg', rwyHdg))
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

    /** */
    processTimeLanding(): FlightProcessor {
        const flight = this.flight;
        const { speed, rwy, type, alt, hdg } = flight;
        if (!rwy) {
            throw new Error('missing runway');
        }
        const { dt, map, landingHdgRange, flightTempl, goAroundAlt, mm } = this.props;
        const runwayNode = map.nodes[rwy];
        if (!isRunway(runwayNode)) {
            throw new Error('not a runway');
        }
        const rwyHdg = runwayNode.hdg;
        const { from, d, angle } = mapDao.route(flight, runwayNode);
        const ds = speed * dt / SECS_PER_HOUR;
        if (from) {
            // Go around due to missing runway cause flying away
            console.error('Missing runway direction from', this.flight);
            return this.apply(
                setMod('status', FlightStatus.Flying),
                setMod('toAlt', goAroundAlt),
                deleteMod('rwy'))
                .moveHoriz()
                .moveVert()
                .addMissingRunwayDialog();
        }
        if (ds > d) {
            // flying distance > runway distance: touching
            if (Math.abs(mapDao.normAngle(hdg - rwyHdg)) > landingHdgRange) {
                // difference between flight heading and runway heading > landing range
                // Go around due to missing runway cause land alignment
                console.error('Missing runway land alignment', this.flight);
                return this.apply(
                    setMod('status', FlightStatus.Flying),
                    setMod('toAlt', goAroundAlt),
                    deleteMod('rwy'))
                    .moveHoriz()
                    .moveVert()
                    .addMissingRunwayDialog();
            }
            // Landed
            return this.apply(
                setLocationMod(runwayNode),
                setMod('speed', 0),
                setMod('alt', 0),
                setMod('status', FlightStatus.Landed))
        }

        // Compute shifting
        const shifting = d * Math.sin(angle * RADS_PER_DEG);

        if (Math.abs(shifting) >= ds) {
            if (d < mm) {
                // Missing runway too shifted
                console.error('Missing runway too shifted', this.flight);
                return this.apply(
                    setMod('status', FlightStatus.Flying),
                    setMod('toAlt', goAroundAlt),
                    deleteMod('rwy'))
                    .moveHoriz()
                    .moveVert()
                    .addMissingRunwayDialog();
            }
            // fly to midle marker
            return this.turnedTo(this.midleMarker())
                .moveHoriz()
                .landVert();
        }

        // Compute forward point
        const df = Math.sqrt(ds * ds - shifting * shifting);
        const fPts = mapDao.radial(runwayNode, rwyHdg + 180, d - df);

        // Compute altitude
        const apprAlt = this.landingAlt(d - ds);
        const { vspeed } = flightTempl[type];
        const minAlt = Math.round(alt - vspeed * dt * MINS_PER_SEC);
        if (apprAlt < minAlt) {
            // Go around cause altitude
            console.error('Missing runway alitude', this.flight);
            return this.apply(
                setMod('status', FlightStatus.Flying),
                setMod('toAlt', goAroundAlt),
                deleteMod('rwy'))
                .addMissingRunwayDialog()
                .moveHoriz()
                .moveVert();
        }

        return this.turnedTo(fPts).moveHoriz()
            .landVert();
    }

    /**
     * 
     */
    processTimeTurning(): FlightProcessor {
        const { map } = this.props;
        const { turnTo, at } = this.flight;
        if (!at) {
            throw new Error('missing at');
        }
        return this.flyTo(map.nodes[at], fl =>
            fl.apply(
                setMod('status', FlightStatus.FlyingTo),
                setMod('at', turnTo),
                deleteMod('turnTo'))
                .addFlyingToDialog()
        );
    }

    /**
     * 
     */
    processTimeFlying(): FlightProcessor {
        return this.moveHoriz().moveVert();
    }

    /**
     * 
     */
    processTimeFlyingTo(): FlightProcessor {
        const { at } = this.flight;
        if (!at) {
            throw new Error('missing at property');
        }
        const atNode = this.props.map.nodes[at];
        return this.flyTo(atNode, fl =>
            fl.apply(
                deleteMod('at'),
                setMod('status', FlightStatus.Flying)
            )
        );
    }
}
