import _ from 'lodash';
import { empty, interval, of } from 'rxjs';
import { filter, first, map, tap } from 'rxjs/operators';
import { sprintf } from 'sprintf-js';
import { EVENT_TYPES, MESSAGE_TYPES } from './Events';
import { FLIGHT_STATES } from './Flight';
import { NODE_TYPES } from './TrafficSimulator';

// prefix atc, flight, readback, op
const MESSAGE_TEMPLATES = {
    'rightLeave': [
        'flight leaving controlled zone via $to',
        'atc cleared to $to departure'
    ],
    'rightLand': [
        'atc $rwy vacated',
        'flight leaving frequency',
        'atc good day'
    ],
    'hold': [
        'atc hold at current position',
        'readback holding at current position'
    ],
    'holdAt': [
        'atc hold at $at',
        'readback holding at $at'
    ],
    'clearedToLand': [
        'atc cleared to land $cmdTo',
        'readback cleared to land $cmdTo'
    ],
    'flyTo': [
        'atc fly to $at',
        'readback flying to $at'
    ],
    'flyToVia': [
        'atc fly to $turnTo via $at',
        'readback flying to $turnTo via $at'
    ],
    'clearedToTakeOff': [
        'atc $from cleared to take off climb to $toAlt',
        'readback $from cleared to take off climbing to $toAlt'
    ],
    'atcGoAround': [
        'atc pull up and go around climb to $toAlt',
        'readback pulling up and going around climbing to $toAlt'
    ],
    'climbTo': [
        'atc climb to $toAlt',
        'readback climbing to $toAlt'
    ],
    'descendTo': [
        'atc descend to $toAlt',
        'readback descending to $toAlt'
    ],
    'maintainFlightLavel': [
        'atc maintain $toAlt',
        'readback maintaining $toAlt'
    ],
    'collision': [
        'flight mayday mayday mayday collision'
    ],
    'goAroundApproach': [
        'flight going around missing approach',
        'atc climb to $toAlt',
        'readback climbing to $toAlt'
    ],
    'goAroundRunway': [
        'flight going around missing runway',
        'atc climb to $toAlt',
        'readback climbing to $toAlt'
    ],
    'wrongLeave': [
        'flight leaving controlled zone via $exit missing departure',
        'atc roger'
    ],
    'wrongLand': [
        'atc $rwy vacated',
        'flight wrong arrival runway leaving frequency',
        'atc good day'
    ],
    'outOfArea': [
        'flight leaving controlled zone missing departure',
        'atc roger'
    ],
    'flyingTo': [
        'flight flying to $at',
        'atc cleared to $at'
    ],
    'passing': [
        'flight passing $alt',
        'atc roger'
    ],
    'unableToHold': [
        'atc hold at current position',
        'flight negative holding short $from',
        'atc roger'
    ],
    'unableToHoldAt': [
        'atc hold at $when',
        'flight negative holding short $from',
        'atc roger'
    ],
    'unableToLandGround': [
        'atc cleared to land $cmdTo',
        'flight negative holding short $from',
        'atc roger'
    ],
    'unableToLandDistance': [
        'atc cleared to land $cmdTo',
        'flight negative wrong distance',
        'atc roger'
    ],
    'unableToLandAltitude': [
        'atc cleared to land $cmdTo',
        'flight negative wrong flight level',
        'atc roger'
    ],
    'unableToFlyTo': [
        'atc fly to $cmdTo',
        'flight negative holding short $from',
        'atc roger'
    ],
    'unableToFlyToVia': [
        'atc fly to $cmdTo via $when',
        'flight negative holding short $from',
        'atc roger'
    ],
    'unknownFlight': [
        'op flight $cmdFlight not in area'
    ],
};

const SPELLING = {
    a: 'alpha',
    b: 'bravo',
    c: 'charlie',
    d: 'delta',
    e: 'echo',
    f: 'fox trot',
    g: 'golf',
    h: 'hotel',
    i: 'india',
    j: 'juliet',
    k: 'kilo',
    l: 'lima',
    m: 'mike',
    n: 'november',
    o: 'oscar',
    p: 'papa',
    q: 'quebeck',
    r: 'romeo',
    s: 'sierra',
    t: 'tango',
    u: 'uniform',
    v: 'victor',
    x: 'x-ray',
    w: 'whiskey',
    y: 'yenkee',
    z: 'zulu',
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'niner'
};

const RWY_SUFFIX = {
    r: 'right',
    c: 'center',
    l: 'left'
};

/**
 * 
 * @param {*} alt 
 */
function sayFL(alt) {
    const fl = Math.round(alt / 100);
    return 'flight level ' + spell(sprintf('%03d', fl));
}

/**
 * 
 * @param {*} alt 
 */
function showFL(alt) {
    const fl = Math.round(alt / 100);
    return sprintf('FL%03d', fl);
}

/**
 * 
 * @param {*} word 
 */
function spell(word) {
    const x = word.toLowerCase();
    const z = _(x).map(a => {
        const sp = SPELLING[a];
        return sp !== undefined ? sp : a;
    }).join(' ');
    return z;
}

/**
 * 
 * @param {id} id 
 */
function sayId(id) {
    const m = /(\d.)(r|l|c)?/g.exec(id.toLowerCase());
    if (m && m.length === 3) {
        return !!m[2]
            ? `runway ${spell(m[1])} ${RWY_SUFFIX[m[2]]}`
            : `runway ${spell(m[1])}`

    } else {
        return spell(id);
    }
}

/**
 * 
 * @param {id} id 
 */
function showId(id) {
    const m = /(\d.)(r|l|c)?/g.exec(id.toLowerCase());
    if (m && m.length === 3) {
        return `runway ${id}`
    } else {
        return id;
    }
}

class AudioBuilder {
    constructor(event, atcVoice) {
        _.bindAll(this);
        this._event = event;
        this._atcVoice = atcVoice;
    }

    /**
     * 
     */
    get event() { return this._event; }

    /**
     * 
     */
    get atcVoice() { return this._atcVoice; }

    /**
     * 
     * @param {*} text 
     */
    say(text) {
        return text.split(' ').map(clip => {
            if (clip.startsWith('$')) {
                const fn = clip.substring(1);
                return this[fn]();
            } else {
                return clip;
            }
        }).join(' ');
    }

    to() {
        return sayId(this.event.flight.to);
    }

    at() {
        return sayId(this.event.flight.at);
    }

    rwy() {
        return sayId(this.event.flight.rwy);
    }

    from() {
        return sayId(this.event.flight.from);
    }

    turnTo() {
        return sayId(this.event.flight.turnTo);
    }

    flightId() {
        return spell(this.event.flight.id);
    }

    atc() {
        return this.event.map.name;
    }

    alt() {
        return sayFL(this.event.flight.alt);
    }

    toAlt() {
        return sayFL(this.event.flight.toAlt);
    }

    cmdTo() {
        return sayId(this.event.cmd.to);
    }

    when() {
        return sayId(this.event.cmd.when);
    }

    cmdRwy() {
        return sayId(this.event.cmd.rwy);
    }

    cmdFlight() {
        return spell(this.event.cmd.flight);
    }

    exit() {
        return sayId(this.event.flight.exit);
    }

    /**
     * 
     * @param {*} msg 
     */
    flightAudio(msg) {
        return this.event.flight.voice + ' ' + this.say(`$atc $flightId ${msg}`);
    }

    /**
     * 
     * @param {*} msg 
     */
    atcAudio(msg) {
        return this.atcVoice + ' ' + this.say(`$flightId $atc ${msg}`)
    }

    /**
     * 
     * @param {*} msg 
     */
    opAudio(msg) {
        return `${this.atcVoice} operator ${this.say(`$atc ${msg}`)}`;
    }

    /**
     * 
     * @param {*} msg 
     */
    readbackAudio(msg) {
        return this.event.flight.voice + ' ' + this.say(`${msg} $flightId`);
    }

    /**
     * 
     * @param {*} messages 
     */
    parse(messages) {
        return messages.map(tmpl => {
            const toks = _(tmpl.split(' '));
            const mode = toks.head();
            const msg = toks.drop(1).join(' ');
            switch (mode) {
                case 'atc':
                    return this.atcAudio(msg);
                case 'flight':
                    return this.flightAudio(msg);
                case 'readback':
                    return this.readbackAudio(msg);
                default:
                    return this.opAudio(msg);
            };
        });
    }

    build() {
        if (this.event.type === EVENT_TYPES.ENTER) {
            return this.enter();
        } else {
            const tmpl = MESSAGE_TEMPLATES[this.event.type];
            return !!tmpl ? this.parse(tmpl) : '';
        }
    }


    enter() {
        const { flight, map } = this.event;
        const { status, to } = flight;
        const toNode = map.nodes[to];
        if (status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
            if (toNode.type === NODE_TYPES.RUNWAY) {
                return this.parse([
                    'flight holding short $from ready for departure to $to',
                    'atc hold short $from',
                    'readback holding short $from'
                ]);
            } else {
                return this.parse([
                    'flight holding short $from ready for departure via $to',
                    'atc hold short $from',
                    'readback holding short $from'
                ]);
            }
        } else if (toNode.type === NODE_TYPES.RUNWAY) {
            return this.parse([
                'flight enter control zone via $from to $to',
                'atc roger'
            ]);
        } else {
            return this.parse([
                'flight enter control zone via $from leave via $to',
                'atc roger'
            ]);
        }
    }
}

class MessageBuilder extends AudioBuilder {
    /**
     * 
     * @param {*} text 
     */
    say(text) {
        return text.split(' ').map(clip => {
            if (clip.startsWith('$')) {
                const fn = clip.substring(1);
                return this[fn]();
            } else {
                return clip;
            }
        }).join(' ');
    }

    to() {
        return showId(this.event.flight.to);
    }

    at() {
        return showId(this.event.flight.at);
    }

    rwy() {
        return showId(this.event.flight.rwy);
    }

    from() {
        return showId(this.event.flight.from);
    }

    turnTo() {
        return showId(this.event.flight.turnTo);
    }

    flightId() {
        return this.event.flight.id;
    }

    atc() {
        return this.event.map.name;
    }

    alt() {
        return showFL(this.event.flight.alt);
    }

    toAlt() {
        return showFL(this.event.flight.toAlt);
    }

    cmdTo() {
        return showId(this.event.cmd.to);
    }

    when() {
        return showId(this.event.cmd.when);
    }

    cmdRwy() {
        return showId(this.event.cmd.rwy);
    }

    cmdFlight() {
        return this.event.cmd.flight;
    }

    exit() {
        return showId(this.event.flight.exit);
    }

    /**
     * 
     * @param {*} msg 
     */
    flightAudio(msg) {
        return {
            type: MESSAGE_TYPES.FLIGHT,
            msg: this.say(`$atc $flightId ${msg}`)
        };
    }

    /**
     * 
     * @param {*} msg 
     */
    atcAudio(msg) {
        return {
            type: MESSAGE_TYPES.ATC,
            msg: this.say(`$flightId $atc ${msg}`)
        };
    }

    /**
     * 
     * @param {*} msg 
     */
    opAudio(msg) {
        return {
            type: MESSAGE_TYPES.ATC,
            msg: this.say(`$atc ${msg} `)
        };
    }

    /**
     * 
     * @param {*} msg 
     */
    readbackAudio(msg) {
        return {
            type: MESSAGE_TYPES.READBACK,
            msg: this.say(`${msg} $flightId`)
        }
    }

}

function filterEng(voices) {
    return voices.filter(voice => voice.lang.toLowerCase().startsWith('en'));
}

/**
 * Returns the single observable with the list of voices
 */
function synthVoices() {
    const synth = window.speechSynthesis;
    if (synth) {
        const voices = filterEng(synth.getVoices());
        return voices.length > 0
            ? of(voices)
            : interval(10).pipe(
                map(() => filterEng(synth.getVoices())),
                filter(v => v.length > 0),
                first()
            );
    } else {
        return of([]);
    }
}

/**
 * Returns the single observable that synthetizes a list of commands or empty observable if cannot synthetize
 * @param {*} cmds the commad list 'voiceIndex text'
 */
function synthSay(cmds) {
    const synth = window.speechSynthesis;
    if (synth) {
        return synthVoices().pipe(
            tap(voices => {
                cmds.forEach(cmd => {
                    const m = /(\w)\b(.*)/.exec(cmd);
                    if (m.length === 3) {
                        const voice = voices[m[1]];
                        const msg = m[2];
                        if (voice) {
                            const utt = new SpeechSynthesisUtterance(msg);
                            utt.voice = voice;
                            // utt.rate = 1.2;
                            synth.speak(utt);
                        }
                    }
                })
            })
        );
    } else {
        return empty();
    }
}

export { AudioBuilder, MessageBuilder, sayFL, spell, sayId, synthVoices, synthSay };