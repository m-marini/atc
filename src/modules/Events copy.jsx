import { FLIGHT_STATES, NODE_TYPES } from "./TrafficSimulator";
import _ from 'lodash';
import { ATC_VOICE, FLIGHT_VOICE, say, sayAtcSign, sayFlightSign, sayFL, spell } from "./Audio";

const MESSAGE_TYPES = {
    ATC: 'atc',
    FLIGHT: 'flight',
    EMERGENCY: 'emergency',
    READBACK: 'readback'
}

const EVENT_TYPES = {
    ENTER: 'enter',
    RIGHT_LEAVE: 'rightLeave',
    RIGHT_LAND: 'rightLand',

    HOLD: 'hold',
    HOLD_AT: 'holdAt',
    CLEARED_TO_LAND: 'clearedToLand',
    FLY_TO: 'flyTo',
    FLY_TO_VIA: 'flyToVia',
    CLEARED_TO_TAKE_OFF: 'clearedToTakeOff',
    ATC_GO_AROUND: 'atcGoAround',
    CLIMB_TO: 'climbTo',
    DESCEND_TO: 'descendTo',
    MAINTAIN_FLIGHT_LEVEL: 'maintainFLightLavel',

    COLLISION: 'collision',
    GO_AROUND_APPROACH: 'goAroundApproach',
    GO_AROUND_RUNWAY: 'goAroundRunway',
    WRONG_LEAVE: 'wrongLeave',
    WRONG_LAND: 'wrongLand',
    OUT_OF_AREA: 'outOfArea',
    FLYING_TO: 'flyingTo',
    PASSING: 'passing',

    UNABLE_TO_HOLD: 'unableToHold',
    UNABLE_TO_HOLD_AT: 'unableToHoldAt',
    UNABLE_TO_LAND_GROUND: 'unableToLandGround',
    UNABLE_TO_LAND_DISTANCE: 'unableToLandDistance',
    UNABLE_TO_LAND_ALTITUDE: 'unableToLandAltitude',
    UNABLE_TO_FLY_TO: 'unableToFlyTo',
    UNABLE_TO_FLY_TO_VIA: 'unableToFlyToVia',

    UNKWOWN_FLIGHT: 'unknownFlight'
};

const AUDIO_BUILDERS = (() => {
    const builders = {};
    builders[EVENT_TYPES.CLIMB_TO] = event => {
        return _.concat(
            atcAudio(`changeflightlevel ${sayFL(event.flight.toAlt)}`, event),
        );
    };
    builders[EVENT_TYPES.DESCEND_TO] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.PASSING] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.CLEARED_TO_TAKE_OFF] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.ATC_GO_AROUND] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.GO_AROUND_RUNWAY] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.GO_AROUND_APPROACH] = builders[EVENT_TYPES.CLIMB_TO];
    builders[EVENT_TYPES.FLY_TO] = event => {
        return _.concat(
            atcAudio(`turnheadingto ${spell(event.flight.at)}`, event)
        );
    };
    builders[EVENT_TYPES.FLYING_TO] = event => {
        return _.concat(
            readbackAudio(`turnheadingto ${spell(event.flight.at)}`, event)
        );
    };
    builders[EVENT_TYPES.FLY_TO_VIA] = event => {
        return _.concat(
            atcAudio(`turnheadingto ${spell(event.flight.at)} at ${spell(event.flight.at)}`, event)
        );
    };
    builders[EVENT_TYPES.HOLD] = event => {
        return _.concat(
            atcAudio(`holdon`, event)
        );
    };
    builders[EVENT_TYPES.HOLD_AT] = event => {
        return _.concat(
            atcAudio(`holdon at ${spell(event.flight.at)}`, event)
        );
    };
    builders[EVENT_TYPES.COLLISION] = event => {
        return _.concat(
            flightAudio(`collision`, event)
        );
    };
    builders[EVENT_TYPES.CLEARED_TO_LAND] = event => {
        return _.concat(
            atcAudio(`cleartolandrunway ${spell(event.flight.rwy)}`, event)
        );
    };
    builders[EVENT_TYPES.RIGHT_LAND] = event => {
        return _.concat(
            atcAudio(`landed ${spell(event.flight.rwy)}`, event)
        );
    };
    builders[EVENT_TYPES.WRONG_LAND] = event => {
        return _.concat(
            atcAudio(`landedwrongrunway landed ${spell(event.flight.rwy)}`, event)
        );
    };
    builders[EVENT_TYPES.OUT_OF_AREA] = event => {
        return _.concat(
            atcAudio(`exitedwrongway exited ${spell(event.flight.to)}`, event)
        );
    };
    builders[EVENT_TYPES.WRONG_LEAVE] = event => {
        return _.concat(
            atcAudio(`exitedwrongway exited ${spell(event.flight.to)}`, event)
        );
    };
    builders[EVENT_TYPES.ENTER] = event => {
        return _.concat(
            atcAudio(`enteredat ${spell(event.flight.from)}`, event)
        );
    };

    return builders;
})();

const MESSAGES_BUILDERS = (() => {
    const builders = {};
    builders[EVENT_TYPES.ENTER] = event => {
        const { flight, map } = event;
        const { status, to, from, alt, hdg } = flight;
        const toNode = map.nodes[to];
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            return [
                flightMessage(`holding short runway ${from}, ready for departure via ${to}`, event),
                atcMessage(`hold short runway ${from}`, event),
                readbackMessage(`holding short runway ${from}`, event)
            ];
        } else if (toNode.type === NODE_TYPES.RUNWAY) {
            return [
                flightMessage(`enter control zone via ${from} at ${alt}' to runway ${to}`, event),
                atcMessage(`mantain ${alt}, heading ${hdg}`, event),
                readbackMessage(`mantaining ${alt}, heading ${hdg}`, event)
            ];
        } else {
            return [
                flightMessage(`enter control zone at ${alt}' heading ${hdg} leave ${to}`, event),
                atcMessage(`mantain ${alt}', heading ${hdg}`, event),
                readbackMessage(`mantaining ${alt}', heading ${hdg}`, event)
            ];
        }
    };

    builders[EVENT_TYPES.UNKWOWN_FLIGHT] = ({ cmd }) => {
        return [{
            type: MESSAGE_TYPES.ATC,
            msg: `ATC: no flight ${cmd.flight} in area`
        }];
    };

    builders[EVENT_TYPES.COLLISION] = event => {
        return [flightEmergency(`Mayday, mayday, mayday, We are colliding`, event)];
    };

    builders[EVENT_TYPES.RIGHT_LEAVE] = event => {
        const { flight } = event;
        return [
            flightMessage(flight, `Leaving controlled zone via ${flight.exit} at ${flight.alt}'`, event),
            atcMessage(flight, `Cleared to ${flight.to} departure`, event)
        ];
    };

    builders[EVENT_TYPES.RIGHT_LEAVE] = event => {
        const { flight } = event;
        return [
            flightMessage(`Leaving controlled zone via ${flight.exit} at ${flight.alt}'`, event),
            atcEmergency(`Negative`, event)
        ];
    };

    builders[EVENT_TYPES.OUT_OF_AREA] = event => {
        const { flight } = event;
        return [
            flightEmergency(`Leaving controlled zone heading ${flight.hdg} at ${flight.alt}'`, event)
        ];
    };

    builders[EVENT_TYPES.RIGHT_LEAVE] = event => {
        const { flight } = event;
        return [
            atcMessage(`runway ${flight.rwy} vacated`, event),
            flightMessage(`leaving frequency`, event),
            atcMessage(`good day`, event)
        ];
    };

    builders[EVENT_TYPES.WRONG_LAND] = event => {
        const { flight } = event;
        return [
            atcMessage(`runway ${flight.rwy} vacated`, event),
            flightEmergency(`wrong arrival runway, leaving frequency`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_HOLD] = event => {
        return [
            atcMessage(`hold at current position`, event),
            flightEmergency(`negative, unable to hold at current position at ground`, event)
        ];
    };

    builders[EVENT_TYPES.HOLD] = event => {
        return [
            atcMessage(`hold at current position`, event),
            readbackMessage(`holding at current position`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_HOLD_AT] = event => {
        const { cmd } = event;
        return [
            atcMessage(`hold at ${cmd.when}`, event),
            flightEmergency(`negative, unable to hold at ${cmd.when} at ground`, event)
        ];
    };

    builders[EVENT_TYPES.HOLD_AT] = event => {
        const { cmd } = event;
        return [
            atcMessage(`hold at ${cmd.when}`, event),
            readbackMessage(`holding at ${cmd.when}`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_LAND_GROUND] = event => {
        const { cmd } = event;
        return [
            atcMessage(`cleared to land runway ${cmd.to}`, event),
            flightEmergency(`negative, unable to land runway ${cmd.to} at ground`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_LAND_DISTANCE] = event => {
        const { cmd } = event;
        return [
            atcMessage(`cleared to land runway ${cmd.to}`, event),
            flightEmergency(`negative, unable to land runway ${cmd.to} too distant`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE] = event => {
        const { cmd } = event;
        return [
            atcMessage(`cleared to land runway ${cmd.to}`, event),
            flightEmergency(`negative, unable to land runway ${cmd.to} too high`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.CLEARED_TO_LAND] = event => {
        const { cmd } = event;
        return [
            atcMessage(`cleared to land runway ${cmd.to}`, event),
            readbackMessage(`cleared to land runway ${cmd.to}`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_FLY_TO] = event => {
        const { cmd } = event;
        return [
            atcMessage(`fly to ${cmd.to}`, event),
            flightEmergency(`negative, unable to fly to ${cmd.to} at ground`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.UNABLE_TO_FLY_TO_VIA] = event => {
        const { cmd } = event;
        return [
            atcMessage(`fly to ${cmd.to} via ${cmd.when}`, event),
            flightEmergency(`negative, unable to fly to ${cmd.to} via ${cmd.when} at ground`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.FLY_TO] = event => {
        const { cmd } = event;
        return [
            atcMessage(`fly to ${cmd.to} via ${cmd.when}`, event),
            readbackMessage(`flying to ${cmd.to}`, event),
        ];
    };

    builders[EVENT_TYPES.FLY_TO_VIA] = event => {
        const { cmd } = event;
        return [
            atcMessage(`fly to ${cmd.to} via ${cmd.when}`, event),
            readbackMessage(`flying to ${cmd.to} via ${cmd.when}`, event),
        ];
    };

    builders[EVENT_TYPES.CLEARED_TO_TAKE_OFF] = event => {
        const { flight } = event;
        return [
            atcMessage(`runway ${flight.from}, cleared to take-off, climb to ${flight.toAlt}ft`, event),
            readbackMessage(`runway ${flight.from}, cleared to take-off, climbing to ${flight.toAlt}ft`, event)
        ];
    };

    builders[EVENT_TYPES.ATC_GO_AROUND] = event => {
        const { cmd } = event;
        return [
            atcEmergency(`pull up and go around, climb to ${cmd.flightLevel}00ft`, event),
            readbackMessage(`going around, climbing to ${cmd.flightLevel}00ft`, event)
        ];
    };

    builders[EVENT_TYPES.CLIMB_TO] = event => {
        const { flight } = event;
        return [
            atcMessage(`climb to ${flight.toAlt}ft`, event),
            readbackMessage(`climbing to ${flight.toAlt} ft`, event)
        ];
    };

    builders[EVENT_TYPES.DESCEND_TO] = event => {
        const { flight } = event;
        return [
            atcMessage(`descend to ${flight.toAlt}ft`, event),
            readbackMessage(`descending to ${flight.toAlt} ft`, event)
        ];
    };

    builders[EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL] = event => {
        const { flight } = event;
        return [
            atcMessage(`maintain ${flight.toAlt}ft`, event),
            readbackMessage(`maintain ${flight.toAlt} ft`, event)
        ];
    };

    builders[EVENT_TYPES.GO_AROUND_APPROACH] = event => {
        return [
            flightEmergency(`going around, missing approach`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.GO_AROUND_RUNWAY] = event => {
        return [
            flightEmergency(`going around, missing runway`, event),
            atcMessage(`roger`, event)
        ];
    };

    builders[EVENT_TYPES.FLYING_TO] = event => {
        const { flight } = event;
        const { at } = flight;
        return [
            flightMessage(`flying to ${at}`, event),
            atcMessage(`cleared to ${at}`, event)
        ];
    };

    builders[EVENT_TYPES.PASSING] = event => {
        const { flight } = event;
        return [
            flightMessage(`passing ${flight.toAlt}ft`, event),
            atcMessage(`maintain ${flight.toAlt}ft`, event),
            readbackMessage(`mantaining ${flight.toAlt}ft`, event)
        ];
    };

    return builders;
})();

/**
 * 
 * @param {*} msg 
 * @param {*} event 
 */
function atcAudio(msg, event) {
    return say(ATC_VOICE, `${sayAtcSign(event)} ${msg}`);
}

/**
 * 
 * @param {*} msg 
 * @param {*} event 
 */
function flightAudio(msg, event) {
    return say(FLIGHT_VOICE, `${sayFlightSign(event)} ${msg}`);
}

/**
 * 
 * @param {*} msg 
 * @param {*} event 
 */
function readbackAudio(msg, event) {
    return say(FLIGHT_VOICE, `${msg} ${spell(event.flight.id)}`);
}

function buildEvent(type, flight, map, cmd) {
    return { type, flight, map, cmd }
}

function atcMessage(msg, { flight, map }) {
    return {
        type: MESSAGE_TYPES.ATC,
        msg: `${flight.id}, ${map.name} ATC, ${msg}`
    }
}

function flightMessage(msg, { flight, map }) {
    return {
        type: MESSAGE_TYPES.FLIGHT,
        msg: `${map.name} ATC, ${flight.id}, ${msg}`
    };
}

function readbackMessage(msg, { flight, map }) {
    return {
        type: MESSAGE_TYPES.READBACK,
        msg: `${msg}, ${flight.id}`
    };
}

function atcEmergency(msg, { flight, map }) {
    return {
        type: MESSAGE_TYPES.EMERGENCY,
        msg: `${flight.id}, ${map.name} ATC, ${msg}`
    };
}

function flightEmergency(msg, { flight, map }) {
    return {
        type: MESSAGE_TYPES.EMERGENCY,
        msg: `${map.name} ATC, ${flight.id}, ${msg}`
    };
}

function toMessages(event) {
    const builder = MESSAGES_BUILDERS[event.type];
    return !!builder ? builder(event) : [];
}

function toAudios(event) {
    console.trace(event);
    const builder = AUDIO_BUILDERS[event.type];
    return !!builder ? builder(event) : [];
}

export { buildEvent, toMessages, toAudios, EVENT_TYPES, MESSAGE_TYPES };