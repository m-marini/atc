import { LocatedVector } from "./MapDao";
import { Validator } from 'jsonschema';
import { GeoLocation, GeoLocationSchema } from './Map';

export enum FlightType {
    Jet = 'J',
    Airplane = 'A'
}

const FlightTypeSchema = {
    type: 'string',
    enum: Object.values(FlightType)
};

export enum FlightStatus {
    WaitingForTakeoff = 'waiting-for-takeoff',
    Flying = 'flying',
    FlyingTo = 'flying-to',
    Turning = 'turning',
    Approaching = 'approaching',
    Aligning = 'aligning',
    Landing = 'landing',
    HoldingFromAt = 'holding-from-at',
    HoldingToAt = 'holding-to-at',
    HoldingFrom = 'holding-from',
    HoldingTo = 'holding-to',
    Landed = 'landed',
    Exited = 'exited'
}

const FlightStatusSchema = {
    type: 'string',
    enum: Object.values(FlightStatus)
};

export interface Flight extends LocatedVector {
    readonly id: string;
    readonly type: FlightType;
    readonly status: FlightStatus;
    readonly speed: number;
    readonly alt: number;
    readonly toAlt: number;
    readonly to: string;
    readonly from: string;
    readonly rwy?: string;
    readonly at?: string;
    readonly turnTo?: string;
    readonly loopTimer?: number;
    readonly holdHdg?: number;
    readonly fix?: GeoLocation;
    readonly right?: boolean;
    readonly exit?: string;
    readonly voice?: string;
}

export const FlightSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        type: FlightTypeSchema,
        status: FlightStatusSchema,
        speed: { type: 'integer' },
        alt: { type: 'integer' },
        toAlt: { type: 'integer' },
        to: { type: 'string' },
        from: { type: 'string' },
        rwy: { type: 'string' },
        at: { type: 'string' },
        turnTo: { type: 'string' },
        loopTimer: { type: 'number' },
        holdHdg: { type: 'integer' },
        fix: GeoLocationSchema,
        right: { type: 'boolean' },
        exit: { type: 'string' },
        voice: { type: 'string' }
    },
    required: ['id', 'type', 'status', 'speed', 'alt', 'toAlt', 'to', 'from']
};

export function validateFlight(obj: any) {
    new Validator().validate(obj, FlightSchema, { throwError: true });
    return obj;
}
