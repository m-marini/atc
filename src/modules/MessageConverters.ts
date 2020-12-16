import _ from 'lodash';
import { AreaMap } from './Map';
import { anyTagMsgOp, Message, MessageTag, notMsgOp } from './Message';
import { Session } from './Session';

export enum Style {
    ATC = 'atc',
    Flight = 'flight',
    Error = 'error'
}

export type MessageText = Readonly<{
    style: Style;
    text: string;
}>;

const isFromFlight = anyTagMsgOp(MessageTag.FlightReport, MessageTag.Negative, MessageTag.Readback);
const isFromAtc = notMsgOp(isFromFlight);

const TextBuilderPattern: Readonly<Record<string, Readonly<{
    style: Style,
    templ: string
}>>> = {
    'flight-report.ready-to-departure-to': {
        style: Style.Flight,
        templ: '$atc, $from, holding short runway $rwy ready for departure to runway $dest'
    },
    'flight-report.ready-to-departure-leave': {
        style: Style.Flight,
        templ: '$atc, $from, holding short runway $rwy ready for departure via $dest'
    },
    'flight-report.enter-to': {
        style: Style.Flight,
        templ: '$atc, $from, enter control zone via $via to runway $dest'
    },
    'flight-report.enter-leave': {
        style: Style.Flight,
        templ: '$atc, $from, enter control zone via $via leave $dest'
    },
    'flight-report.passing-flight-level': {
        style: Style.Flight,
        templ: '$atc, $from, passing FL$flightLevel'
    },
    'flight-report.flying-to': {
        style: Style.Flight,
        templ: '$atc, $from, flying to $dest'
    },
    'flight-report.runway-vacated': {
        style: Style.Flight,
        templ: '$atc, $from, runway $rwy vacated'
    },
    'flight-report.wrong-runway-vacated': {
        style: Style.Flight,
        templ: '$atc, $from, runway $rwy vacated, wrong arrival'
    },
    'flight-report.going-around-missing-approach': {
        style: Style.Flight,
        templ: '$atc, $from, going around missing approach'
    },
    'flight-report.going-around-missing-runway': {
        style: Style.Flight,
        templ: '$atc, $from, going around missing runway'
    },
    'flight-report.leaving': {
        style: Style.Flight,
        templ: '$atc, $from, leaving controlled zone via $dest'
    },
    'flight-report.leaving-missing-departure': {
        style: Style.Flight,
        templ: '$atc, $from, leaving controlled zone via $dest, missing departure'
    },
    'flight-report.leaving-out-of-area': {
        style: Style.Flight,
        templ: '$atc, $from, leaving controlled zone, missing departure'
    },
    'flight-report.collision': {
        style: Style.Flight,
        templ: '$atc, $from, mayday, mayday, mayday, collision'
    },
    'command.climb': {
        style: Style.ATC,
        templ: '$to, $atc, climb to FL$flightLevel'
    },
    'readback.climb': {
        style: Style.Flight,
        templ: 'climbing to FL$flightLevel, $from'
    },
    'command.descend': {
        style: Style.ATC,
        templ: '$to, $atc, descend to FL$flightLevel'
    },
    'readback.descend': {
        style: Style.Flight,
        templ: 'descending to FL$flightLevel, $from'
    },
    'command.maintain': {
        style: Style.ATC,
        templ: '$to, $atc, maintain FL$flightLevel'
    },
    'readback.maintain': {
        style: Style.Flight,
        templ: 'maintaining FL$flightLevel, $from'
    },
    'command.cleared-to-takeoff': {
        style: Style.ATC,
        templ: '$to, $atc, runway $rwy cleared to takeoff, climb to FL$flightLevel'
    },
    'readback.cleared-to-takeoff': {
        style: Style.Flight,
        templ: 'runway $rwy cleared to takeoff, climbing to FL$flightLevel, $from'
    },
    'command.fly-to': {
        style: Style.ATC,
        templ: '$to, $atc, fly to $turnTo'
    },
    'readback.fly-to': {
        style: Style.Flight,
        templ: 'flying to $turnTo, $from'
    },
    'command.fly-to-via': {
        style: Style.ATC,
        templ: '$to, $atc, fly to $turnTo via $via'
    },
    'readback.fly-to-via': {
        style: Style.Flight,
        templ: 'flying to $turnTo via $via, $from'
    },
    'command.cleared-to-land': {
        style: Style.ATC,
        templ: '$to, $atc, cleared to land runway $rwy'
    },
    'readback.cleared-to-land': {
        style: Style.Flight,
        templ: 'cleared to land runway $rwy, $from'
    },
    'command.hold-short': {
        style: Style.ATC,
        templ: '$to, $atc, hold short runway $at'
    },
    'readback.hold-short': {
        style: Style.Flight,
        templ: 'holding short runway $at, $from'
    },
    'command.hold-current-position': {
        style: Style.ATC,
        templ: '$to, $atc, hold at current position'
    },
    'readback.hold-current-position': {
        style: Style.Flight,
        templ: 'holding at current position, $from'
    },
    'command.hold-at': {
        style: Style.ATC,
        templ: '$to, $atc, hold at $at'
    },
    'readback.hold-at': {
        style: Style.Flight,
        templ: 'holding at $at, $from'
    },
    'negative.flight-at-ground': {
        style: Style.Flight,
        templ: '$atc, $from, negative, holding short runway $id'
    },
    'negative.runway-too-distant': {
        style: Style.Flight,
        templ: '$atc, $from, negative, wrong distance'
    },
    'negative.flight-too-high': {
        style: Style.Flight,
        templ: '$atc, $from, negative, wrong flight level'
    },
    'negative.atc-not-found': {
        style: Style.Flight,
        templ: '$atc, $from, negative, ATC not in area'
    },
    'negative.beacon-not-found': {
        style: Style.Flight,
        templ: '$atc, $from, negative, $id not in area'
    },
    'negative.flight-not-at-ground': {
        style: Style.Flight,
        templ: '$atc, $from, negative, not holding short runway $id'
    },
    'negative.invalid-flight-level': {
        style: Style.Flight,
        templ: '$atc, $from, negative, invalid FL$id'
    },
    'negative.invalid-runway': {
        style: Style.Flight,
        templ: '$atc, $from, negative, invalid runway $id'
    },
    'negative.runway-not-found': {
        style: Style.Flight,
        templ: '$atc, $from, negative, runway $id not in area'
    },
    'error.flight-not-found': {
        style: Style.Error,
        templ: 'operator, flight $to not in area'
    },
    'confirmation.cleared-to': {
        style: Style.ATC,
        templ: '$to, $atc, cleared to $dest'
    },
    'confirmation.cleared-to-leave': {
        style: Style.ATC,
        templ: '$to, $atc, cleared to leave via $dest'
    },
    'confirmation.good-day': {
        style: Style.ATC,
        templ: '$to, $atc, good day'
    },
    'confirmation.roger': {
        style: Style.ATC,
        templ: '$to, $atc, roger'
    },
    'error.unintelligible': {
        style: Style.Error,
        templ: 'unintelligeble $speech, $errCode'
    }
};
const AudioBuilderPattern: Record<string, string> = {
    'flight-report.ready-to-departure-to': '$fromVoice $atc $from holding short runway $rwy ready for departure to runway $dest',
    'flight-report.ready-to-departure-leave': '$fromVoice $atc $from holding short runway $rwy ready for departure via $dest',
    'flight-report.enter-to': '$fromVoice $atc $from enter control zone via $via to runway $dest',
    'flight-report.enter-leave': '$fromVoice $atc $from enter control zone via $via leave $dest',
    'flight-report.passing-flight-level': '$fromVoice $atc $from passing flight level $flightLevel',
    'flight-report.flying-to': '$fromVoice $atc $from flying to $dest',
    'flight-report.runway-vacated': '$fromVoice $atc $from runway $rwy vacated',
    'flight-report.wrong-runway-vacated': '$fromVoice $atc $from runway $rwy vacated wrong arrival',
    'flight-report.going-around-missing-approach': '$fromVoice $atc $from going around missing approach',
    'flight-report.going-around-missing-runway': '$fromVoice $atc $from going around missing runway',
    'flight-report.leaving': '$fromVoice $atc $from leaving controlled zone via $dest',
    'flight-report.leaving-missing-departure': '$fromVoice $atc $from leaving controlled zone via $dest missing departure',
    'flight-report.leaving-out-of-area': '$fromVoice $atc $from leaving controlled zone missing departure',
    'flight-report.collision': '$fromVoice $atc $from mayday mayday mayday collision',
    'command.climb': '$fromVoice $to $atc climb to flight level $flightLevel',
    'readback.climb': '$fromVoice climbing to flight level $flightLevel $from',
    'command.descend': '$fromVoice $to $atc descend to flight level $flightLevel',
    'readback.descend': '$fromVoice descending to flight level $flightLevel $from',
    'command.maintain': '$fromVoice $to $atc maintain flight level $flightLevel',
    'readback.maintain': '$fromVoice maintaining flight level $flightLevel $from',
    'command.cleared-to-takeoff': '$fromVoice $to $atc runway $rwy cleared to takeoff climb to flight level $flightLevel',
    'readback.cleared-to-takeoff': '$fromVoice runway $rwy cleared to takeoff climbing to flight level $flightLevel $from',
    'command.fly-to': '$fromVoice $to $atc fly to $turnTo',
    'readback.fly-to': '$fromVoice flying to $turnTo $from',
    'command.fly-to-via': '$fromVoice $to $atc fly to $turnTo via $via',
    'readback.fly-to-via': '$fromVoice flying to $turnTo via $via $from',
    'command.cleared-to-land': '$fromVoice $to $atc cleared to land runway $rwy',
    'readback.cleared-to-land': '$fromVoice cleared to land runway $rwy $from',
    'command.hold-short': '$fromVoice $to $atc hold short runway $at',
    'readback.hold-short': '$fromVoice holding short runway $at $from',
    'command.hold-current-position': '$fromVoice $to $atc hold at current position',
    'readback.hold-current-position': '$fromVoice holding at current position $from',
    'command.hold-at': '$fromVoice $to $atc hold at $at',
    'readback.hold-at': '$fromVoice holding at $at $from',
    'negative.flight-at-ground': '$fromVoice $atc $from negative holding short runway $id',
    'negative.runway-too-distant': '$fromVoice $atc $from negative wrong distance',
    'negative.flight-too-high': '$fromVoice $atc $from negative wrong flight level',
    'negative.atc-not-found': '$fromVoice $to $from negative ATC not in area',
    'negative.beacon-not-found': '$fromVoice $atc $from negative $id not in area',
    'negative.flight-not-at-ground': '$fromVoice $atc $from negative not holding short runway $id',
    'negative.invalid-flight-level': '$fromVoice $atc $from negative invalid flight level $flId',
    'negative.invalid-runway': '$fromVoice $atc $from negative invalid runway $id',
    'negative.runway-not-found': '$fromVoice $atc $from negative runway $id not in area',
    'error.flight-not-found': '$fromVoice operator flight $to not in area',
    'confirmation.cleared-to': '$fromVoice $to $atc cleared to $dest',
    'confirmation.cleared-to-leave': '$fromVoice $to $atc cleared to leave via $dest',
    'confirmation.good-day': '$fromVoice $to $atc good day',
    'confirmation.roger': '$fromVoice $to $atc roger',
    'error.unintelligible': '$atcVoice unintelligeble $speech, $errCode'
};

const TokenRegex = /^(\w+)(.*)/;

abstract class Builder<T> {
    private _message: Message;
    private _map: AreaMap;

    /**
     * 
     * @param message 
     * @param map 
     */
    constructor(message: Message, map: AreaMap) {
        this._message = message;
        this._map = map;
        _.bindAll(this);
    }

    /** */
    get map(): AreaMap { return this._map; }

    /** */
    get message(): Message { return this._message; }

    /** */
    abstract build(): T

    /**
     * 
     * @param templ 
     */
    applyTemplate(templ: string): string {
        const sections = templ.split('$');
        const prefixes = _(sections).drop(1);
        const prefixSplits = prefixes.flatMap(prefix => {
            const m = prefix.match(TokenRegex);
            if (m) {
                return ['$' + m[1], m[2]];
            } else {
                return ['$', prefix];
            }
        }).value();
        const tokens = _.concat(sections[0], prefixSplits);
        const values = _.map(tokens, tok => {
            if (tok === '$' || !tok.startsWith('$')) {
                return tok
            } else {
                const fnId = tok.substring(1);
                const fn = (this as any)[fnId];
                if (!fn) {
                    return tok;
                }
                const value = (fn as () => string).apply(this);
                return value ? value : tok;
            }
        });
        return values.join('');
    }

    key(): string {
        const type = this.message.tags[0];
        const msg = this.message as any;
        const subtype = msg.cmd || msg.report || msg.error || msg.confirmation;
        return [type, subtype].join('.');
    }

    atc(): string {
        const id = isFromAtc(this.message) ? this.message.from : this.message.to
        return !id ? '?' : this.map.id === id ? this.map.name : id;
    }

    /** */
    at(): string {
        const at = (this.message as any).at;
        return !at ? '?' : at;
    }

    /** */
    to(): string {
        const to = this.message.to;
        return !to ? '?' : to;
    }

    /** */
    from(): string {
        const from = this.message.from;
        return !from ? '?' : from;
    }

    dest(): string {
        const msg = this.message as any;
        return msg.dest !== undefined ? msg.dest : '?';
    }

    via(): string {
        const msg = this.message as any;
        return msg.via !== undefined ? msg.via : '?';
    }

    rwy(): string {
        const msg = this.message as any;
        return msg.rwy !== undefined ? msg.rwy : '?';
    }

    flightLevel(): string {
        const msg = this.message as any;
        return msg.flightLevel !== undefined ? msg.flightLevel : '?';
    }

    turnTo(): string {
        const msg = this.message as any;
        return msg.turnTo !== undefined ? msg.turnTo : '?';
    }

    id(): string {
        const id = (this.message as any).id;
        return id !== undefined ? id : '?';
    }

    speech() {
        const speech = (this.message as any).speech;
        return speech !== undefined ? speech : '?';
    }

    errCode() {
        const errCode = (this.message as any).parserError;
        return errCode !== undefined ? errCode : '?';
    }
}

const SpellingWords: Record<string, string> = Object.freeze({
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
});

const RunwaySuffix: Record<string, string> = Object.freeze({
    r: 'right',
    c: 'center',
    l: 'left'
});

/**
 * 
 * @param word 
 */
function spell(word: string): string {
    const x = word.toLowerCase();
    const z = _(x).map(a => {
        const sp = SpellingWords[a];
        return sp !== undefined ? sp : a;
    }).join(' ');
    return z;
}


/**
 * 
 * @param {id} id 
 */
function spellId(id: string): string {
    const m = /^(\d.)(r|l|c)?/g.exec(id.toLowerCase());
    if (m && m.length === 3) {
        return !!m[2]
            ? `${spell(m[1])} ${RunwaySuffix[m[2]]}`
            : `${spell(m[1])}`

    } else {
        return spell(id);
    }
}


export class TextBuilder extends Builder<MessageText> {
    constructor(message: Message, map: AreaMap) {
        super(message, map);
        _.bindAll(this);
    }

    build(): MessageText {
        const pattern = TextBuilderPattern[this.key()];
        if (pattern) {
            const style = pattern.style;
            const text = this.applyTemplate(pattern.templ);
            return { style, text };
        } else {
            return { style: Style.Error, text: this.key() };
        }
    }
}

/** */
export class AudioBuilder extends Builder<string> {
    private _session: Session;

    constructor(message: Message, map: AreaMap, session: Session) {
        super(message, map);
        this._session = session;
        _.bindAll(this);
    }

    get session() { return this._session; }


    build(): string {
        const pattern = AudioBuilderPattern[this.key()];
        return pattern
            ? this.applyTemplate(pattern)
            : this.key();
    }

    atcVoice() {
        return this.session.atcVoice;
    }

    fromVoice(): string {
        const from = super.from();
        if (this.map.id === from) {
            return this.session.atcVoice || '?';
        }
        const flight = this.session.flights[from];
        return (flight ? (flight.voice || this.session.atcVoice)
            : this.session.atcVoice) || '?';
    }

    from(): string { return spellId(super.from()); }

    to(): string { return spellId(super.to()); }

    dest(): string { return spellId(super.dest()); }

    rwy(): string { return spellId(super.rwy()); }

    via(): string { return spellId(super.via()); }

    turnTo(): string { return spellId(super.turnTo()); }

    flightLevel(): string { return spell(super.flightLevel()); }

    id(): string { return spellId(super.id()); }

    at(): string { return spellId(super.at()); }

    flId(): string { return spell(super.id()); }
}
