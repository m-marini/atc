import { Flight, FlightSchema } from "./Flight";
import { Validator } from 'jsonschema';

export const CURRENT_VERSION = '1.1';

export type Session = Readonly<{
    id: string;
    version: string;
    level: string;
    map: string;
    t: number;
    entries: Record<string, number>;
    flights: Record<string, Flight>;
    noFlights: number;
    noLandedOk: number;
    noLandedKo: number;
    noExitOk: number;
    noExitKo: number;
    noCollision: number;
    atcVoice?: string;
}>;

export const SessionSchema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        version: { type: 'string', const: CURRENT_VERSION },
        level: { type: 'string' },
        map: { type: 'string' },
        t: { type: 'number' },
        noFlights: { type: 'integer' },
        noLandedOk: { type: 'integer' },
        noLandedKo: { type: 'integer' },
        noExitOk: { type: 'integer' },
        noExitKo: { type: 'integer' },
        noCollision: { type: 'integer' },
        entries: {
            type: 'object',
            additionalProperties: { type: 'number' }
        },
        flights: {
            type: 'object',
            additionalProperties: FlightSchema
        },
        atcVoice: { type: 'string' }
    },
    required: ['id', 'version', 'level', 'map', 't',
        'noFlights', 'noLandedOk', 'noLandedKo', 'noExitOk', 'noCollision', 'entries',
        'flights']
}

/**
 * 
 * @param obj 
 */
export function validateSession(obj: any): Session {
    new Validator().validate(obj, SessionSchema, { throwError: true });
    return obj as Session;
}