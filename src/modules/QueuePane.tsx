import React, { FunctionComponent } from 'react';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { Flight, FlightStatus } from './Flight';
import { Session } from './Session';

/**
 * 
 * @param {*} flight 
 */
function status(flight: Flight): string {
    const { status, at, turnTo, rwy, from } = flight;

    switch (status) {
        case FlightStatus.Flying:
            return '';
        case FlightStatus.FlyingTo:
            return `flying to ${at}`;
        case FlightStatus.WaitingForTakeoff:
            return sprintf('holding rwy %s', from);
        case FlightStatus.Landing:
            return sprintf('landing rwy %s', rwy);
        case FlightStatus.Aligning:
            return sprintf('aligning rwy %s', rwy);
        case FlightStatus.Approaching:
            return sprintf('approaching rwy %s', rwy);
        case FlightStatus.HoldingFrom:
        case FlightStatus.HoldingTo:
            return 'holding';
        case FlightStatus.HoldingFromAt:
        case FlightStatus.HoldingToAt:
            return `holding at ${at}`;
        case FlightStatus.Turning:
            return sprintf('turn to %s via %s', turnTo, at);
        default:
            return status;
    }
}

/**
 * 
 * @param {*} flight 
 */
function toLines(flight: Flight): string[] {
    const fl = Math.round(flight.alt / 100);
    const toFl = Math.round(flight.toAlt / 100);
    const st = status(flight);
    const line1 = sprintf('%3s to %s Class %s', flight.id, flight.to, flight.type);

    const line2 = fl !== toFl
        ? sprintf('    FL%03d to FL%03d Hdg %03d', fl, toFl, flight.hdg)
        : sprintf('    FL%03d  Hdg %03d', fl, flight.hdg);

    return st.length === 0
        ? [line1, line2]
        : [line1, line2, sprintf('    %s', status(flight))];
}

/**
 * 
 * @param {*} param0 
 */
export const QueuePane: FunctionComponent<{
    readonly session?: Session;
}> = ({ session }) => {
    if (!session) {
        return (
            <pre className="terminal" />
        );
    } else {
        const lines = _(session.flights)
            .values()
            .sortBy(['id'])
            .flatMap(toLines)
            .join('\n');
        return (
            <pre className="terminal">{lines}</pre>
        );
    }
}
