import React from 'react';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { FLIGHT_STATES } from './TrafficSimulator';

/**
 * 
 * @param {*} flight 
 */
function status(flight) {
    const { status, at, turnTo, rwy, from } = flight;

    switch (status) {
        case FLIGHT_STATES.FLYING:
            return '';
        case FLIGHT_STATES.FLYING_TO:
            return `flying to ${at}`;
        case FLIGHT_STATES.WAITING_FOR_TAKEOFF:
            return sprintf('holding rwy %s', from);
        case FLIGHT_STATES.LANDING:
            return sprintf('landing rwy %s', rwy);
        case FLIGHT_STATES.APPROACHING:
            return sprintf('approach rwy %s', rwy);
        case FLIGHT_STATES.HOLDING_FROM:
        case FLIGHT_STATES.HOLDING_TO:
            return 'holding';
        case FLIGHT_STATES.HOLDING_FROM_AT:
        case FLIGHT_STATES.HOLDING_TO_AT:
            return `holding at ${at}`;
        case FLIGHT_STATES.TURNING:
            return sprintf('turn to %s via %s', turnTo, at);
        default:
            return status;
    }
}

/**
 * 
 * @param {*} flight 
 */
function toLines(flight) {
    const fl = Math.round(flight.alt / 100);
    const st = status(flight);
    const line1 = sprintf('%3s to %s Class %s', flight.id, flight.to, flight.type);
    const line2 = sprintf('    FL%03d  Hdg %03d', fl, flight.hdg);
    return st.length === 0
        ? [line1, line2]
        : [line1, line2, sprintf('    %s', status(flight))];
}

/**
 * 
 * @param {*} param0 
 */
function QueuePane({ session }) {
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

export default QueuePane;
