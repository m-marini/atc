import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { EVENT_TYPES, MESSAGE_TYPES } from './Events';
import { FLIGHT_STATES } from './Flight';
import { NODE_TYPES } from './TrafficSimulator';

const PAUSE = 'pause';

/**
 * 
 * @param {*} alt 
 */
function sayFL(alt) {
    const fl = Math.round(alt / 4000) * 40;
    return sprintf('fl%03d', fl);
}

/**
 * 
 * @param {*} word 
 */
function spell(word) {
    return _(word.toLowerCase()).join(' ' + PAUSE + ' ');
}

function sayHdg(hdg) {
    return `heading ${spell(sprintf('%03d', hdg))}`;
}

/**
 * 
 * @param {*} voice 
 * @param {*} words 
 */
function toMp3(words) {
    const wl = words.replace(/\s+/gi, ' ').toLowerCase().split(' ');
    const voice = wl[0];
    return _(wl)
        .drop(1)
        .reject(tag => tag === '')
        .map(word =>
            `${process.env.REACT_APP_BASENAME}/audio/${voice}/${word}.mp3`
        ).value();
}


class AudioBuilder {
    constructor(event, clips = []) {
        _.bindAll(this);
        this._event = event;
        this._clips = clips;
    }

    /**
     * 
     */
    get event() { return this._event; }

    /**
     * 
     */
    get clips() { return this._clips; }

    /**
     * 
     * @param {*} voice 
     * @param {*} text 
     */
    say(text) {
        const newClip = text.split(' ').map(clip => {
            if (clip.startsWith('$')) {
                const fn = clip.substring(1);
                return this[fn]();
            } else {
                return clip;
            }
        }).join(' ');
        return new AudioBuilder(this.event, _.concat(this.clips, [newClip]));
    }

    to() {
        return this.event.flight.to;
    }

    at() {
        return this.event.flight.at;
    }

    rwy() {
        return this.event.flight.rwy;
    }

    from() {
        return this.event.flight.from;
    }

    turnTo() {
        return this.event.flight.turnTo;
    }

    flightId() {
        return spell(this.event.flight.id);
    }

    atc() {
        return this.event.map.id + 'atc';
    }

    alt() {
        return sayFL(this.event.flight.alt);
    }

    toAlt() {
        return sayFL(this.event.flight.toAlt);
    }

    hdg() {
        return sayHdg(this.event.flight.hdg);
    }

    cmdTo() {
        return this.event.cmd.to;
    }

    when() {
        return this.event.cmd.when;
    }

    cmdRwy() {
        return this.event.cmd.rwy;
    }

    cmdFlight() {
        return spell(this.event.cmd.flight);
    }

    exit() {
        return this.event.flight.exit;
    }

    flightAudio(msg) {
        return this.say(`${this.event.flight.voice} pause $atc $flightId ${msg}`);
    }

    atcAudio(msg) {
        return this.say(`${this.event.map.voice} pause $flightId $atc ${msg}`);
    }

    readbackAudio(msg) {
        return this.say(`${this.event.flight.voice} pause ${msg} pause1 $flightId`);
    }

    toAudio() {
        switch (this.event.type) {
            case EVENT_TYPES.ENTER:
                return this.enter();
            case EVENT_TYPES.CLIMB_TO:
                return this.climb();
            case EVENT_TYPES.DESCEND_TO:
                return this.descend();
            case EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL:
                return this.maintain();
            case EVENT_TYPES.CLEARED_TO_TAKE_OFF:
                return this.clearToTakeoff();
            case EVENT_TYPES.PASSING:
                return this.passing();
            case EVENT_TYPES.FLY_TO:
                return this.flyTo();
            case EVENT_TYPES.FLY_TO_VIA:
                return this.flyToVia();
            case EVENT_TYPES.FLYING_TO:
                return this.flyingTo();
            case EVENT_TYPES.UNABLE_TO_FLY_TO:
                return this.unableFlyTo();
            case EVENT_TYPES.UNABLE_TO_FLY_TO_VIA:
                return this.unableFlyToVia();
            case EVENT_TYPES.CLEARED_TO_LAND:
                return this.clearedToLand();
            case EVENT_TYPES.UNABLE_TO_LAND_GROUND:
                return this.unableToLandGround();
            case EVENT_TYPES.UNABLE_TO_LAND_DISTANCE:
                return this.unableToLandDistance();
            case EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE:
                return this.unableToLandAlt();
            case EVENT_TYPES.ATC_GO_AROUND:
                return this.atcGoAround();
            case EVENT_TYPES.RIGHT_LAND:
                return this.rightLand();
            case EVENT_TYPES.WRONG_LAND:
                return this.wrongLand();
            case EVENT_TYPES.GO_AROUND_APPROACH:
                return this.goingAroundApproach();
            case EVENT_TYPES.GO_AROUND_RUNWAY:
                return this.goingAroundRwy();
            case EVENT_TYPES.HOLD:
                return this.hold();
            case EVENT_TYPES.HOLD_AT:
                return this.holdAt();
            case EVENT_TYPES.UNABLE_TO_HOLD:
                return this.unableToHold();
            case EVENT_TYPES.UNABLE_TO_HOLD_AT:
                return this.unableToHoldAt();
            case EVENT_TYPES.RIGHT_LEAVE:
                return this.rightLeave();
            case EVENT_TYPES.WRONG_LEAVE:
                return this.wrongLeave();
            case EVENT_TYPES.OUT_OF_AREA:
                return this.outOfArea();
            case EVENT_TYPES.COLLISION:
                return this.collision();
            case EVENT_TYPES.UNKWOWN_FLIGHT:
                return this.unknownFlight();
            default:
                return this;
        }
    }

    climb() {
        return this.atcAudio('climbto $toAlt')
            .readbackAudio('climbing $toAlt');
    }

    descend() {
        return this.atcAudio('descendto $toAlt')
            .readbackAudio('descending $toAlt');
    }

    maintain() {
        return this.atcAudio('maintain $toAlt')
            .readbackAudio('maintaining $toAlt');
    }

    clearToTakeoff() {
        return this.atcAudio('$from clearedtotakeoff $toAlt')
            .readbackAudio('$from clearedtotakeoffclimbing $toAlt');
    }

    passing() {
        return this.flightAudio('passing $alt')
            .atcAudio('roger');
    }

    flyTo() {
        return this.atcAudio('flyto $at')
            .readbackAudio('flyingto $at');
    }

    flyToVia() {
        return this.atcAudio('flyto $turnTo via $at')
            .readbackAudio('flyingto $turnTo via $at');
    }

    flyingTo() {
        return this.flightAudio('flyingto $at')
            .atcAudio('clearedto $at');
    }

    unableFlyTo() {
        return this.atcAudio('flyto $cmdTo')
            .flightAudio('negholdingshort $from')
            .atcAudio('roger');
    }

    unableFlyToVia() {
        return this.atcAudio('flyto $cmdTo via $when')
            .flightAudio('negholdingshort $from')
            .atcAudio('roger');
    }

    clearedToLand() {
        return this.atcAudio('clearedtoland $rwy')
            .readbackAudio('clearedtoland $rwy');
    }

    unableToLandGround() {
        return this.atcAudio('clearedtoland $cmdRwy')
            .flightAudio('negholdingshort $from')
            .atcAudio('roger');
    }

    unableToLandDistance() {
        return this.atcAudio('clearedtoland $cmdRwy')
            .flightAudio('negdistance')
            .atcAudio('roger')
    }

    unableToLandAlt() {
        return this.atcAudio('clearedtoland $cmdRwy')
            .flightAudio('negfl')
            .atcAudio('roger')
    }

    atcGoAround() {
        return this.atcAudio('goaround $toAlt')
            .readbackAudio('goingaround $toAlt');
    }

    rightLand() {
        return this.atcAudio('$rwy vacated')
            .flightAudio('leavingfrequency')
            .atcAudio('goodday');

    }

    wrongLand() {
        return this.atcAudio('$rwy vacated')
            .flightAudio('wrongrunway')
            .atcAudio('goodday');

    }

    goingAroundApproach() {
        return this.flightAudio('goingaroundapr')
            .atcAudio('climbto $toAlt')
            .readbackAudio('climbingto $toAlt');
    }

    goingAroundRwy() {
        return this.flightAudio('goingaroundrwy')
            .atcAudio('climbto $toAlt')
            .readbackAudio('climbingto $toAlt');
    }

    hold() {
        return this.atcAudio('holdpos')
            .readbackAudio('holdingpos');
    }

    holdAt() {
        return this.atcAudio('holdat $at')
            .readbackAudio('holdingat $at');
    }

    unableToHold() {
        return this.atcAudio('holdpos')
            .flightAudio('negholdingshort $from')
            .atcAudio('roger');
    }

    unableToHoldAt() {
        return this.atcAudio('holdat $when')
            .flightAudio('negholdingshort $from')
            .atcAudio('roger');
    }

    rightLeave() {
        return this.flightAudio('leavingvia $to at $alt')
            .atcAudio('clearedto $to departure');
    }

    wrongLeave() {
        return this.flightAudio('leavingvia $exit at $alt missingdep')
            .atcAudio('roger');
    }

    outOfArea() {
        return this.flightAudio('leaving $alt $hdg missingdep')
            .atcAudio('roger');
    }

    collision() {
        return this.flightAudio('collision');
    }

    unknownFlight() {
        return this.say(`${this.event.map.voice} pause operator $cmdFlight notinarea`);
    }

    enter() {
        const { flight, map } = this.event;
        const { status, to } = flight;
        const toNode = map.nodes[to];
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            if (toNode.type === NODE_TYPES.RUNWAY) {
                return this.flightAudio('holdingshort $from readyfordepartureto $to')
                    .atcAudio('holdshort $from')
                    .readbackAudio('holdingshort $from');
            } else {
                return this.flightAudio('holdingshort $from readyfordeparturevia $to')
                    .atcAudio('holdshort $from')
                    .readbackAudio('holdingshort $from');
            }
        } else if (toNode.type === NODE_TYPES.RUNWAY) {
            return this.flightAudio('enter $from at $alt $hdg to $to')
                .atcAudio('maintain $alt $hdg')
                .readbackAudio('maintaining $alt $hdg');
        } else {
            return this.flightAudio('enter $from at $alt $hdg leavevia $to')
                .atcAudio('maintain $alt $hdg')
                .readbackAudio('maintaining $alt $hdg');
        }
    }
}

const MESSAGES = {
    LONatc: 'London ATC',
    LINatc: 'Milan ATC',
    FFMatc: 'Frankfurt ATC',
    PARatc: 'Paris ATC',
    heading: 'hdg',
    clearedto: 'cleared to',
    clearedtoland: 'cleared to land',
    via: 'via',
    holdingshort: 'holding short',
    readyfordepartureto: 'ready for departure to',
    readyfordeparturevia: 'ready for departure via',
    enter: 'enter control zone via',
    maintaining: 'maintaining',
    at: 'at',
    to: 'to',
    leavevia: 'leave via',
    climbing: 'climbing to',
    descending: 'descending to',
    clearedtotakeoffclimbing: 'cleared to take off climbing to',
    passing: 'passing',
    flyingto: 'flying to',
    negholdingshort: 'negative holding short',
    negdistance: 'negative wrong distance',
    negfl: 'negative wrong flight level',
    goingaround: 'pulling up and going around climbing to',
    leavingfrequency: 'leaving frequency',
    wrongRunway: 'wrong arrival runway leaving frequency',
    goingaroundapr: 'going around missing approach',
    goingaroundrwy: 'going around missing runway',
    holdingpos: 'holding at current position',
    holdingat: 'holding at',
    leavingvia: 'leaving controlled zone via',
    missingdep: 'missing depature',
    leaving: 'leaving controlled zone',
    collision: 'mayday mayday mayday collision',
    holdshort: 'hold short',
    maintain: 'maintain',
    climbto: 'climb to',
    descendto: 'descend to',
    clearedtotakeoff: 'cleared to take off climb to',
    flyto: 'fly to',
    roger: 'roger',
    goaround: 'pull up and go around climb to',
    vacated: 'vacated',
    goodday: 'goodday',
    holdpos: 'hold at current position',
    holdat: 'hold at',
    departure: 'departure',
    operator: 'operator',
    flight: 'flight',
    notinarea: 'not in area',
    pause1: ' '
};

/**
 * 
 * @param {*} clip 
 * @param {*} atcVoice 
 */
function toMessage(clip, atcVoice) {
    const tags = clip.split(' ');
    const msg = _(tags)
        .drop(1)
        .reject(tag => tag === PAUSE)
        .map(tag => {
            const msg = MESSAGES[tag];
            if (msg !== undefined) {
                return ' ' + msg + ' ';
            }
            if (/^[A-Za-z\d]$/.test(tag)) {
                return tag.toUpperCase();
            }
            if (/^\d{2}[LCR]?$/.test(tag)) {
                return ` runway ${tag} `;
            }
            if (/^fl\d{3}$/.test(tag)) {
                return ` ${tag.toUpperCase()} `;
            }
            return ' ' + tag + ' ';
        })
        .join('').trim().replace(/\s+/gi, ' ');
    return {
        type: tags[0] === atcVoice ? MESSAGE_TYPES.ATC : MESSAGE_TYPES.FLIGHT,
        msg
    }
}

export { MESSAGES, AudioBuilder, toMp3, sayFL, spell, sayHdg, toMessage };