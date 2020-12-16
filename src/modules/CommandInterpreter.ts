import { buildClimbCommand, buildDescendCommand, buildFlyToCommand, buildHoldCommand, buildLandCommand, buildMaintainCommand, buildTakeoffCommand, buildUnitellegibleMessage, CommandMessage, MessageTag } from './Message';
import _ from 'lodash';

const Similitudes: Record<string, string[]> = {
    at: ['it'],
    cleared: ['clear', 'player', 'order'],
    climb: ['time'],
    descend: ['descent'],
    fly: ['flight', 'play'],
    flight: ['fly', 'play'],
    maintain: ['19'],
    runway: ['railway', 'runways', 'roundway'],
    to: ['two', '2'],
    via: ['fire', 'by']
}

/**
 * 
 */
type ContextProps = Readonly<{
    tokens: string[];
    cursor: number;
    stack: any[];
}>

const NumberDict: Record<string, string> = {
    zero: '0',
    one: '1',
    wine: '1',
    two: '2',
    to: '2',
    three: '3',
    four: '4',
    for: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    niner: '9',
    naina: '9'
};

const AlphaDict: Record<string, string> = {
    alpha: 'a',
    bravo: 'b',
    charlie: 'c',
    delta: 'd',
    echo: 'e',
    foxtrot: 'f',
    'fox-trot': 'f',
    'fox-tots': 'f',
    golf: 'g',
    hotel: 'h',
    india: 'i',
    indian: 'i',
    juliet: 'j',
    kilo: 'k',
    lima: 'l',
    mike: 'm',
    november: 'n',
    oscar: 'o',
    papa: 'p',
    quebec: 'q',
    rebec: 'q',
    prebec: 'q',
    romeo: 'r',
    sierra: 's',
    tango: 't',
    uniform: 'u',
    uniforms: 'u',
    uniformed: 'u',
    victor: 'v',
    viktor: 'v',
    picture: 'v',
    whiskey: 'w',
    whisky: 'w',
    'x-ray': 'x',
    'x-rayed': 'x',
    yankee: 'y',
    zulu: 'z'
};

const RunwaySuffixDict: Record<string, string> = {
    right: 'r',
    center: 'c',
    left: 'l'
};

type StackElement = string | CommandMessage | undefined;

/**
 * 
 * @param el 
 */
function isString(el: StackElement): el is string {
    return typeof el === 'string';
}

function isMessage(el: StackElement): el is CommandMessage {
    return el !== undefined && !isString(el);
}

/**
 * 
 */
class Context implements Context {
    private _props: ContextProps;

    /**
     * 
     * @param props 
     */
    constructor(props: ContextProps) {
        this._props = props;
    }

    /**
     * 
     */
    get props(): ContextProps { return this._props; }

    /**
     * 
     */
    token(): string | undefined {
        const { cursor, tokens } = this.props;
        return cursor < tokens.length ? tokens[cursor] : undefined;
    }

    /**
     * 
     */
    next(): Context {
        const { cursor, tokens } = this.props;
        if (cursor >= tokens.length) {
            return this;
        } else {
            return new Context(_.assign({}, this.props, { cursor: cursor + 1 }))
        }
    }

    /**
     * 
     * @param data 
     */
    push(data: StackElement): Context {
        const { stack } = this.props;
        return new Context(_.assign({}, this.props, { stack: _.concat(stack, data) }));
    }

    /**
     * 
     */
    peek(): StackElement {
        const { stack } = this.props;
        return stack[stack.length - 1];
    }

    /**
     * 
     * @param n 
     */
    peekn(n: number): StackElement[] {
        const { stack } = this.props;
        return _.takeRight(stack, n);
    }

    /**
     * 
     */
    drop(n: number = 1): Context {
        const { stack } = this.props;
        return new Context(_.assign({}, this.props, { stack: _.dropRight(stack, n) }));
    }
}

/**
 * 
 * @param tokens 
 */
export function buildParserContext(text: string): Context {
    return new Context({
        tokens: _.filter(text.toLowerCase().split(/[^-\w]+/), t => t.length > 0),
        cursor: 0,
        stack: []
    });
}

export function speechToMessage(speech: string) {
    const ctx = buildParserContext(speech);
    try {
        const cmd = command(ctx).peek();
        if (isMessage(cmd)) {
            return cmd;
        } else {
            return buildUnitellegibleMessage(speech, 'message-expected');
        }
    } catch (err: any) {
        const error = err.message;
        if (typeof error === 'string') {
            const pe = error === 'word-expected' ? `${err.props.word}-exepected` : error;
            return buildUnitellegibleMessage(speech, pe);
        } else {
            console.trace(err);
            return buildUnitellegibleMessage(speech, 'unknown-error');
        }
    }
}

/**
 * 
 */
type ErrorProps = {
    word: string
}

/**
 * 
 */
class ParserError extends Error {
    private _ctx: Context;
    private _props: ErrorProps | undefined;

    /**
     * 
     * @param msg 
     * @param ctx 
     * @param expr 
     */
    constructor(msg: string, ctx: Context, props?: ErrorProps) {
        super(msg);
        this._ctx = ctx;
        this._props = props;
    }

    /**
     * 
     */
    get context() { return this._ctx; }

    /**
     * 
     */
    get props() { return this._props; }
}

/**
 * An experession returns the context after appliy a syntatic rules.
 * The effect of syntatic role is applyed to the cursor position and to the stack.
 * Types of Expression:
 * optional expression results the last element equal to undefined if not match otherwise a defined element poping eventualy elements
 * mandatory expression pushes elements on the stack poping eventualy elements
 */
type Expression = (ctx: Context) => Context;

/**********************************/
/* terminal syntactic expressions */
/**********************************/

/**
 * Mandatory expression to match end context.
 * result no changed
 * @param ctx 
 */
export function errorIfNotEnd(ctx: Context): Context {
    if (ctx.token()) {
        throw new ParserError('end-expected', ctx);
    }
    return ctx;
};

/**
 * Mandatory expression to match end context.
 * result no changed
 * @param ctx 
 */
function errorIfEnd(ctx: Context): Context {
    if (!ctx.token()) {
        throw new ParserError('partial-command', ctx);
    }
    return ctx;
};

/******************+*************/
/* terminal context expressions */
/********************************/

/**
 *  Concatenate last 2 results if any
 * @param ctx
 */
export function concat(ctx: Context): Context {
    const [a, b] = ctx.peekn(2);
    if (!isString(a)) {
        return ctx.drop(2).push(b);
    }
    if (!isString(b)) {
        return ctx.drop(2).push(a);
    }
    return ctx.drop(2).push(a + b);
}

/**
 *  Concatenate last 2 results if any
 * @param ctx
 */
function log(ctx: Context): Context {
    console.log(ctx);
    return ctx;
}

/**
 * 
 * @param ctx 
 */
function pushClimb(ctx: Context): Context {
    const [flightId, atc, flightLevel] = ctx.peekn(3);
    if (isString(flightId) && isString(atc) && isString(flightLevel)) {
        const cmd = buildClimbCommand(flightId.toUpperCase(), atc.toUpperCase(), flightLevel, [MessageTag.VoiceMessage]);
        return ctx.drop(3).push(cmd);
    } else {
        return ctx.drop(3).push(undefined);
    }
}

/**
 * 
 * @param ctx 
 */
function pushDescend(ctx: Context): Context {
    const [flightId, atc, flightLevel] = ctx.peekn(3);
    if (isString(flightId) && isString(atc) && isString(flightLevel)) {
        const cmd = buildDescendCommand(flightId.toUpperCase(), atc.toUpperCase(), flightLevel, [MessageTag.VoiceMessage]);
        return ctx.drop(3).push(cmd);
    } else {
        return ctx.drop(3).push(undefined);
    }
}

/**
 * 
 * @param ctx 
 */
function pushMaintain(ctx: Context): Context {
    const [flightId, atc, flightLevel] = ctx.peekn(3);
    if (isString(flightId) && isString(atc) && isString(flightLevel)) {
        const cmd = buildMaintainCommand(flightId.toUpperCase(), atc.toUpperCase(), flightLevel, [MessageTag.VoiceMessage]);
        return ctx.drop(3).push(cmd);
    } else {
        return ctx.drop(3).push(undefined);
    }
}

/**
 * 
 * @param ctx 
 */
function pushFlyTo(ctx: Context): Context {
    const [flightId, atc, to, via] = ctx.peekn(4);
    if (isString(flightId) && isString(atc) && isString(to)
        && (via === undefined || isString(via))) {
        const cmd = buildFlyToCommand(flightId.toUpperCase(), atc.toUpperCase(),
            to.toUpperCase(), via?.toUpperCase(), [MessageTag.VoiceMessage]);
        return ctx.drop(4).push(cmd);
    } else {
        return ctx.drop(4).push(undefined);
    }
}

/**
 * 
 * @param ctx 
 */
function pushHold(ctx: Context): Context {
    const [flightId, atc, at] = ctx.peekn(3);
    if (isString(flightId) && isString(atc) && (at === undefined || isString(at))) {
        const cmd = buildHoldCommand(flightId.toUpperCase(), atc.toUpperCase(),
            at ? at.toUpperCase() : at, [MessageTag.VoiceMessage]);
        return ctx.drop(3).push(cmd);
    } else {
        return ctx.drop(3).push(undefined);
    }
}

/**
 * 
 * @param ctx 
 */
function pushLand(ctx: Context): Context {
    const [flightId, atc, rwy] = ctx.peekn(3);
    if (isString(flightId) && isString(atc) && isString(rwy)) {
        const cmd = buildLandCommand(flightId.toUpperCase(), atc.toUpperCase(), rwy.toUpperCase(), [MessageTag.VoiceMessage]);
        return ctx.drop(3).push(cmd);
    } else {
        return ctx.drop(3).push(undefined);
    }
}

/**
 * @param ctx 
 */
function pushTakeoff(ctx: Context): Context {
    const [flightId, atc, rwy, fl] = ctx.peekn(4);
    if (isString(flightId) && isString(atc) && isString(rwy) && isString(fl)) {
        const cmd = buildTakeoffCommand(flightId.toUpperCase(), atc.toUpperCase(),
            rwy.toUpperCase(), fl, [MessageTag.VoiceMessage]);
        return ctx.drop(4).push(cmd);
    } else {
        return ctx.drop(4).push(undefined);
    }
}

/**
 * @param ctx 
 */
export function nop(ctx: Context): Context {
    return ctx;
}

/***********************************/
/* Syntactical expression creation */
/***********************************/

/**
 * Returns the parser with word element meting regex or undefined if not match
 * Optional expression
 * @param word
 */
export function optRegex(regex: RegExp) {
    return (ctx: Context) => {
        const tok = ctx.token();
        return tok && regex.test(tok) ?
            ctx.next().push(tok) :
            ctx.push(undefined);
    }
}

/**
 * 
 * @param word 
 * @param expected 
 */
function isSimilar(word: string | undefined, expected: string) {
    if (word) {
        const sims = _.concat([expected], Similitudes[expected] || []);
        return sims.indexOf(word) >= 0;
    } else {
        return false;
    }
}

/**
 * Returns the parse with word in the stack and skiped if matches
 * or undefined in the stack
 * @param word 
 */
export function optWord(word: string) {
    return (ctx: Context) => {
        const tok = ctx.token();
        return isSimilar(tok, word) ?
            ctx.next().push(word) :
            ctx.push(undefined);
    }
}

/**
 * Returns the parse with word in the stack and skiped if matches
 * or throws an error
 * @param word 
 */
export function word(word: string): Expression {
    return (ctx) => {
        const ctx1 = errorIfEnd(ctx);
        if (!isSimilar(ctx1.token(), word)) {
            throw new ParserError('word-expected', ctx1, { word });
        }
        return ctx1.next();
    }
}

/**
 * Skip a word 
 * @param word 
 */
export function skipWord(word: string) {
    return (ctx: Context) => {
        const tok = ctx.token();
        return isSimilar(tok, word) ? ctx.next() : ctx;
    }
}
/**
 * Returns the parse with mapped word in the stack and skiped if matches
 * or undefined
 * @param props 
 */
export function optDict(props: Record<string, StackElement>) {
    return (ctx: Context) => {
        const tok = ctx.token();
        if (tok) {
            const value = props[tok];
            if (value) {
                return ctx.next().push(value)
            }
        }
        return ctx.push(undefined);
    };
}

/*******************************/
/* Context expression creation */
/*******************************/

/**
 * Generate an error
 * @param msg error message
 */
export function error(msg: string): Expression {
    return (ctx: Context): Context => {
        throw new ParserError(msg, ctx);
    }
}

/**
 * Drop elements from stack
 * @param n
 */
export function drop(n: number = 1): Expression {
    return (ctx: Context): Context => ctx.drop(n);
}

/**
 * Drop elements from stack
 * @param n
 */
function push(el: StackElement): Expression {
    return (ctx: Context): Context => ctx.push(el);
}

/************************/
/* Expression operators */
/************************/

/**
 * Applies all the list of expressions
 * Returns an expression the applies the single expressions sequentialy
 * the last expression may reduce all results of the single expressions
 * @param exprs 
 */
export function all(...exprs: Expression[]): Expression {
    return (ctx: Context): Context => _.reduce(exprs, (ctx1, expr) => expr(ctx1), ctx);
}

/**
 * Applies conditioning expressions by conditioning stack element
 * @param whenDef 
 * @param whenUndef 
 */
export function ifThenElse(whenDef?: Expression, whenUndef?: Expression) {
    return (ctx: Context): Context => {
        return ctx.peek() ?
            (whenDef ? whenDef(ctx) : ctx) :
            (whenUndef ? whenUndef(ctx) : ctx);
    };
}

/**
 * Applies conditioning expressions by conditioning and consuming stack element
 * @param whenDef 
 * @param whenUndef 
 */
export function ifDropThenElse(whenDef?: Expression, whenUndef?: Expression) {
    return (ctx: Context): Context => {
        return ctx.peek() ?
            (whenDef ? whenDef(ctx.drop()) : ctx) :
            (whenUndef ? whenUndef(ctx.drop()) : ctx);
    };
}

/**
 * Applies expression consuming until first defined result, return only the last defined result or undefined
 * @param exprs 
 */
export function any(...exprs: Expression[]) {
    return (ctx: Context): Context => _.reduce(exprs, (ctx1, expr) => {
        if (ctx1.peek() !== undefined) {
            return ctx1;
        }
        return expr(ctx1.drop());
    }, ctx.push(undefined));
}

/**
 * Repeat the exp untill it returns undefined reducing the results with reducer expression
 * It processes a sequence of similar tokens accumulating the results
 * @param exp
 * @param reducer
 */
export function repeat(exp: Expression, reducer: Expression) {
    return (ctx: Context): Context => {
        var acc = ctx.push(undefined);
        for (; ;) {
            const ctx2 = exp(acc);
            acc = reducer(ctx2);
            if (ctx2.peek() === undefined) {
                return acc;
            }
        }
    };
}

/**
 * Transforms an optional expression in mandatory expression by generateing an error
 * 
 * @param errorCode 
 * @param expr 
 */
export function must(errorCode: string) {
    return all(
        ifThenElse(
            undefined,
            any(
                errorIfEnd,
                error(errorCode)
            )
        )
    );
}

/*************************************/
/** Composed syntactical expressions */
/*************************************/

/**
 * Returns an optional sequence of numbers
 */
export const optNum =
    repeat(
        any(
            optRegex(/^\d*$/),
            optDict(NumberDict)),
        concat);

/**
 * Returns an optional sequence of alphabet words
 */
export const optAlpha =
    repeat(
        optDict(AlphaDict),
        concat);

/**
 * Returns an optional sequence of alphanumeric words
 */
export const optAlphaNum =
    repeat(
        any(
            optAlpha,
            optNum),
        concat);

/**
 * Returns a mandatory flight id
 */
export const flightId = all(optAlphaNum, must('flight-id-expected'));

const beaconId = all(optAlphaNum, must('beacon-id-expected'));

/**
 * Returns a mandatory atc
 */
export const atc =
    all(
        optDict({
            london: 'lon',
            paris: 'par',
            munich: 'mun',
            milan: 'mil',
            frankfurt: 'ffm'
        }),
        ifThenElse(
            word('atc')
        ),
        must('atc-expected')
    );

export const flightLevel =
    all(
        optWord('flight'),
        ifDropThenElse(
            word('level'),
            nop
        ),
        optNum,
        must('flight-level-expected')
    );

const optRunway =
    all(
        skipWord('runway'),
        optNum,
        ifThenElse(
            all(
                optDict(RunwaySuffixDict),
                concat
            )
        )
    );

export const runway = all(optRunway, must('runway-expected'));

const optClimb =
    all(
        optWord('climb'),
        ifDropThenElse(
            all(
                word('to'),
                flightLevel,
                pushClimb
            )
        )
    );

const optDescend =
    all(
        optWord('descend'),
        ifDropThenElse(
            all(
                word('to'),
                flightLevel,
                pushDescend
            )
        )
    );

const optMaintain =
    all(
        optWord('maintain'),
        ifDropThenElse(
            all(
                flightLevel,
                pushMaintain
            )
        )
    );

const optFlyTo =
    all(
        optWord('fly'),
        ifDropThenElse(
            all(
                word('to'),
                beaconId,
                optWord('via'),
                ifDropThenElse(
                    beaconId,
                    push(undefined)
                ),
                pushFlyTo
            )
        )
    );

const optHold =
    all(
        optWord('hold'),
        ifDropThenElse(
            all(
                word('at'),
                all(
                    optWord('current'),
                    ifDropThenElse(
                        all(
                            word('position'),
                            push(undefined),
                            pushHold
                        ),
                        all(
                            beaconId,
                            pushHold
                        )
                    ),
                )
            )
        )
    );

const optLand =
    all(
        optWord('cleared'),
        ifDropThenElse(
            all(
                word('to'),
                word('land'),
                runway,
                pushLand
            )
        )
    );

const optTakeoff =
    all(
        optRunway,
        ifThenElse(
            all(
                word('cleared'),
                word('to'),
                any(
                    all(
                        optWord('take'),
                        ifThenElse(
                            word('off')
                        )
                    ),
                    all(
                        word('takeoff'),
                        push(undefined)
                    )
                ),
                drop(),
                word('climb'),
                word('to'),
                flightLevel,
                pushTakeoff
            )
        )
    );
/**
 * Returns the command
 */
export const command =
    all(
        flightId,
        atc,
        any(
            optClimb,
            optDescend,
            optMaintain,
            optFlyTo,
            optHold,
            optLand,
            optTakeoff
        ),
        must('command-expected'),
        errorIfNotEnd
    );
