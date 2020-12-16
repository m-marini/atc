import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { Flight } from './Flight';

export enum MessageTag {
    Command = 'command',
    Confirmation = 'confirmation',
    Error = 'error',
    FlightReport = 'flight-report',
    Negative = 'negative',
    Readback = 'readback',
    VoiceMessage = 'voice'
}

export enum Command {
    ClearedToLand = 'cleared-to-land',
    ClearedToTakeoff = 'cleared-to-takeoff',
    Climb = 'climb',
    Descend = 'descend',
    FlyTo = 'fly-to',
    FlyToVia = 'fly-to-via',
    Maintain = 'maintain',
    HoldAt = 'hold-at',
    HoldCurrentPosition = 'hold-current-position',
    HoldShort = 'hold-short'
}

export enum Report {
    Collision = 'collision',
    EnterTo = 'enter-to',
    EnterLeave = 'enter-leave',
    FlyingTo = 'flying-to',
    GoingAroundMissingApproach = 'going-around-missing-approach',
    GoingAroundMissingRunway = 'going-around-missing-runway',
    Leaving = 'leaving',
    LeavingMissingDearture = 'leaving-missing-departure',
    LeavingOutOfArea = 'leaving-out-of-area',
    PassingFlightLevel = 'passing-flight-level',
    ReadyToDepartureTo = 'ready-to-departure-to',
    ReadyToDepartureLeave = 'ready-to-departure-leave',
    RunwayVacated = 'runway-vacated',
    WrongRunwayVacated = 'wrong-runway-vacated'
}

export enum Confirmation {
    ClearedTo = 'cleared-to',
    ClearedToLeave = 'cleared-to-leave',
    GoodDay = 'good-day',
    Roger = 'roger'
}

export enum ErrorCode {
    ATCNotFound = 'atc-not-found',
    BeaconNotFound = 'beacon-not-found',
    FlightAtGround = 'flight-at-ground',
    FlightNotAtGround = 'flight-not-at-ground',
    FlightNotFound = 'flight-not-found',
    FlightTooHigh = 'flight-too-high',
    InvalidFlightLevel = 'invalid-flight-level',
    InvalidRunway = 'invalid-runway',
    RunwayNotFound = 'runway-not-found',
    RunwayTooDistant = 'runway-too-distant',
    Unitellegible = 'unintelligible'
};

export interface AbstractMessage {
    readonly from?: string;
    readonly to?: string;
    readonly tags: MessageTag[];
};

export interface AbstractCommandMessage extends AbstractMessage {
    readonly cmd: Command;
}

export interface FlightLevelCommandMessage extends AbstractCommandMessage {
    readonly flightLevel: string;
}

export interface TakeoffCommandMessage extends FlightLevelCommandMessage {
    readonly rwy: string;
}

export interface LandCommandMessage extends AbstractCommandMessage {
    readonly rwy: string;
}

export interface FlyToCommandMessage extends AbstractCommandMessage {
    readonly turnTo: string;
    readonly via?: string;
}

export interface HoldAtCommandMessage extends AbstractCommandMessage {
    readonly at?: string;
}

export type CommandMessage = FlightLevelCommandMessage | TakeoffCommandMessage | LandCommandMessage | FlyToCommandMessage | HoldAtCommandMessage;


export interface BasicReportMessage extends AbstractMessage {
    readonly report: Report;
}

export interface DestinationMessage extends BasicReportMessage {
    readonly dest: string;
}

export interface RunwayMessage extends BasicReportMessage {
    readonly rwy: string;
}

export interface DepartureMessage extends DestinationMessage, RunwayMessage { };

export interface EnterMessage extends DestinationMessage {
    readonly via: string;
}

export interface FlightLevelMessage extends BasicReportMessage {
    readonly flightLevel: string;
}

export type ReportMessage = BasicReportMessage | DestinationMessage | EnterMessage | FlightLevelMessage | RunwayMessage | DepartureMessage;

export interface BasicConfirmationMessage extends AbstractMessage {
    readonly confirmation: Confirmation
}

export interface ClearedToDestinationMessage extends BasicConfirmationMessage {
    readonly dest: string
}

export type ConfirmationMessage = ClearedToDestinationMessage | BasicConfirmationMessage;

export interface BasicNegativeMessage extends AbstractMessage {
    readonly error: ErrorCode
}

export interface IdNegativeMessage extends BasicNegativeMessage {
    readonly id: string;
}

export type NegativeResponse = BasicNegativeMessage | IdNegativeMessage;

export interface AbstractErrorMessage extends AbstractMessage {
    readonly error: ErrorCode
}

export interface ErrorIdNotFoundMessage extends AbstractErrorMessage {
    readonly id: string
}

export interface SpeechErrorMessage extends AbstractErrorMessage {
    readonly speech: string;
    readonly parserError: string;
}

export type Message = CommandMessage | ReportMessage | ConfirmationMessage
    | BasicNegativeMessage | ErrorIdNotFoundMessage;

export type MessagePredicate = (msg: Message) => boolean;

/**
 * 
 * @param msg 
 */
export function anyMsgOp(msg: Message): boolean { return true; }

/**
 * 
 * @param msg 
 */
export function noneMsgOp(msg: Message): boolean { return false; }

/**
 * 
 * @param predicates 
 */
export function andMsgOp(predicates: MessagePredicate[]): MessagePredicate {
    return (msg: Message) => _.findIndex(predicates, (f, i) => !f(msg)) < 0;
}

/**
 * 
 * @param predicates 
 */
export function orMsgOp(...predicates: MessagePredicate[]): MessagePredicate {
    return (msg: Message) => _.findIndex(predicates, f => f(msg)) >= 0;
}

/**
 * 
 * @param predicate 
 */
export function notMsgOp(predicate: MessagePredicate): MessagePredicate { return (msg: Message) => !predicate(msg); }

/**
 * 
 * @param tag 
 */
export function tagMsgOp(tag: MessageTag): MessagePredicate { return (msg: Message) => msg.tags.indexOf(tag) >= 0; }

/**
 * 
 * @param msg 
 */
export function isCommand(msg: Message): msg is CommandMessage {
    return tagMsgOp(MessageTag.Command)(msg);
}

export function isError(msg: Message): msg is AbstractErrorMessage {
    return tagMsgOp(MessageTag.Error)(msg);
}

export function isSpeechError(msg: Message): msg is SpeechErrorMessage {
    return isError(msg) && (msg as SpeechErrorMessage).parserError !== undefined;
}

export const isVoice = tagMsgOp(MessageTag.VoiceMessage);

/**
 * 
 * @param tags 
 */
export function anyTagMsgOp(...tags: MessageTag[]): MessagePredicate {
    const fTags = _.map(tags, t => tagMsgOp(t));
    return orMsgOp.apply(undefined, fTags);
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param flightLevel 
 * @parms tags
 */
export function buildClimbCommand(flightId: string, atcId: string, flightLevel: string, tags?: MessageTag[]): FlightLevelCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: Command.Climb,
        flightLevel
    };
}

/**
 * 
 * @param flightId 
 * @param atcId
 * @param flightLevel 
 * @param tags
 */
export function buildDescendCommand(flightId: string, atcId: string, flightLevel: string, tags?: MessageTag[]): FlightLevelCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: Command.Descend,
        flightLevel
    };
}

/**
 * 
 * @param {*} flightId 
 * @param {*} atcId
 * @param {*} flightLevel 
 */
export function buildMaintainCommand(flightId: string, atcId: string, flightLevel: string, tags?: MessageTag[]): FlightLevelCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: Command.Maintain,
        flightLevel
    };
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param rwy 
 * @param flightLevel 
 */
export function buildTakeoffCommand(flightId: string, atcId: string, rwy: string, flightLevel: string, tags?: MessageTag[]): TakeoffCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: Command.ClearedToTakeoff,
        flightLevel,
        rwy
    };
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param rwy 
 */
export function buildLandCommand(flightId: string, atcId: string, rwy: string, tags?: MessageTag[]): LandCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: Command.ClearedToLand,
        rwy
    };
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param to 
 * @param via 
 */
export function buildFlyToCommand(flightId: string, atcId: string, to: string, via?: string, tags?: MessageTag[]): FlyToCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: via ? Command.FlyToVia : Command.FlyTo,
        turnTo: to,
        via
    };
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param at 
 */
export function buildHoldCommand(flightId: string, atcId: string, at?: string, tags?: MessageTag[]): HoldAtCommandMessage {
    return {
        from: atcId,
        tags: _.concat([MessageTag.Command], tags || []),
        to: flightId,
        cmd: at ? Command.HoldAt : Command.HoldCurrentPosition,
        at
    };
}

/**
 * 
 * @param flightId 
 * @param atcId 
 * @param at 
 */
export function buildHoldShortCommand(flightId: string, atcId: string, at: string, tags?: MessageTag[]): HoldAtCommandMessage {
    return {
        from: atcId,
        tags: [MessageTag.Command],
        to: flightId,
        cmd: Command.HoldShort,
        at
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildATCNotFoundMessage(flight: string, atc: string): BasicNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.ATCNotFound
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param rwy
 */
export function buildAtGroundMessage(flight: string, atc: string, rwy: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.FlightAtGround,
        id: rwy
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param rwy
 */
export function buildNotAtGroundMessage(flight: string, atc: string, rwy: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.FlightNotAtGround,
        id: rwy
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildTooHighMessage(flight: string, atc: string): BasicNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.FlightTooHigh
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildTooDistanthMessage(flight: string, atc: string): BasicNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.RunwayTooDistant
    };
}

export function buildInvalidFlightLevelMessage(flight: string, atc: string, flightLevel: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.InvalidFlightLevel,
        id: flightLevel
    };
}

export function buildRunwayNotFoundMessage(flight: string, atc: string, rwy: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.RunwayNotFound,
        id: rwy
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param id
 */
export function buildBeaconNotFoundMessage(flight: string, atc: string, id: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.BeaconNotFound,
        id
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildInvalidRunwayMessage(flight: string, atc: string, rwy: string): IdNegativeMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.Negative],
        error: ErrorCode.InvalidRunway,
        id: rwy
    };
}

/**
 * 
 * @param command 
 */
export function buildReadbackMessage(command: CommandMessage): CommandMessage {
    return _.assign({}, command, {
        from: command.to,
        to: command.from,
        tags: [MessageTag.Readback]
    });
}

/**
 * 
 * @param flight 
 * @param report 
 */
export function buildCollisionMessage(flight: string, atc: string): BasicReportMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.Collision
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildOutOfAreaMessage(flight: string, atc: string): BasicReportMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.LeavingOutOfArea
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildEnterToMessage(flight: Flight, atc: string): EnterMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.EnterTo,
        dest: flight.to,
        via: flight.from
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildEnterLeaveMessage(flight: Flight, atc: string): EnterMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.EnterLeave,
        dest: flight.to,
        via: flight.from
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildFlyingToMessage(flight: Flight, atc: string): DestinationMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.FlyingTo,
        dest: flight.at as string
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildLeavingMessage(flight: Flight, atc: string): DestinationMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.Leaving,
        dest: flight.exit as string
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildLeavingMissingDepartureMessage(flight: Flight, atc: string): DestinationMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.LeavingMissingDearture,
        dest: flight.exit as string
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param flightLevel 
 */

export function buildPassingFlightLevelMessage(flight: string, atc: string, flightLevel: string | number): FlightLevelMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.PassingFlightLevel,
        flightLevel: typeof flightLevel === 'string' ? flightLevel : sprintf('%03d', Math.round(flightLevel / 100))
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param flightLevel 
 */
export function buildMissingApproachMessage(flight: string, atc: string, flightLevel: string | number): FlightLevelMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.GoingAroundMissingApproach,
        flightLevel: typeof flightLevel === 'string' ? flightLevel : sprintf('%03d', Math.round(flightLevel / 100))
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 * @param flightLevel 
 */
export function buildMissingRunwayMessage(flight: string, atc: string, flightLevel: string | number): FlightLevelMessage {
    return {
        from: flight,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.GoingAroundMissingRunway,
        flightLevel: typeof flightLevel === 'string' ? flightLevel : sprintf('%03d', Math.round(flightLevel / 100))
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildDepartureToMessage(flight: Flight, atc: string): DepartureMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.ReadyToDepartureTo,
        rwy: flight.from,
        dest: flight.to
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildDepartureLeaveMessage(flight: Flight, atc: string): DepartureMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.ReadyToDepartureLeave,
        rwy: flight.from,
        dest: flight.to
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildRunwayVacated(flight: Flight, atc: string): RunwayMessage {
    if (!flight.rwy) {
        throw new Error('missing runway');
    }
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.RunwayVacated,
        rwy: flight.rwy
    };
}

/**
 * 
 * @param flight 
 * @param atc 
 */
export function buildWrongRunwayVacated(flight: Flight, atc: string): RunwayMessage {
    return {
        from: flight.id,
        to: atc,
        tags: [MessageTag.FlightReport],
        report: Report.WrongRunwayVacated,
        rwy: flight.rwy as string
    };
}

/**
 * Returns a goodday message
 * @param atcId 
 * @param flightId 
 */
export function buildGoodDayMessage(atcId: string, flightId: string): BasicConfirmationMessage {
    return {
        from: atcId,
        to: flightId,
        tags: [MessageTag.Confirmation],
        confirmation: Confirmation.GoodDay
    }
}

/**
 * Returns a roger message
 * @param atcId 
 * @param flightId 
 */
export function buildRogerMessage(atcId: string, flightId: string): BasicConfirmationMessage {
    return {
        from: atcId,
        to: flightId,
        tags: [MessageTag.Confirmation],
        confirmation: Confirmation.Roger
    }
}

/**
 * Returns a cleared to beacon message
 * @param atcId 
 * @param flightId 
 * @param dest 
 */
export function buildClearedToMessage(atcId: string, flightId: string, dest: string): ClearedToDestinationMessage {
    return {
        from: atcId,
        to: flightId,
        tags: [MessageTag.Confirmation],
        confirmation: Confirmation.ClearedTo,
        dest
    }
}
/**
 * Returns a cleared to leave message
 * @param atcId 
 * @param flightId 
 * @param dest 
 */
export function buildClearedToLeaveMessage(atcId: string, flightId: string, dest: string): ClearedToDestinationMessage {
    return {
        from: atcId,
        to: flightId,
        tags: [MessageTag.Confirmation],
        confirmation: Confirmation.ClearedToLeave,
        dest
    }
}

export function buildFlightNotFoundMessage(atcId: string, flightId: string): AbstractErrorMessage {
    return {
        from: atcId,
        to: flightId,
        tags: [MessageTag.Error],
        error: ErrorCode.FlightNotFound
    };
}

export function buildUnitellegibleMessage(speech: string, parserError: string): SpeechErrorMessage {
    return {
        tags: [MessageTag.Error, MessageTag.VoiceMessage],
        error: ErrorCode.Unitellegible,
        speech, parserError
    };

}