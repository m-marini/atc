import React from 'react';
import { Card } from 'react-bootstrap';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { FLIGHT_STATES } from './TrafficSimulator';

function status(flight) {
    const { status, at, turnTo, rwy, from } = flight;

    switch (status) {
        case FLIGHT_STATES.FLYING:
            return '';
        case FLIGHT_STATES.WAITING_FOR_TAKEOFF:
            return sprintf('hold short runway %s', from);
        case FLIGHT_STATES.LANDING:
            return sprintf('landing runway %s', rwy);
        case FLIGHT_STATES.APPROACHING:
            return sprintf('approach runway %s', rwy);
        case FLIGHT_STATES.HOLDING_FROM:
        case FLIGHT_STATES.HOLDING_TO:
            return 'holding';
        case FLIGHT_STATES.TURNING:
            return sprintf('turn to %s passing %s', turnTo, at);
        default:
            return status;
    }
}

function FlightEntry({ flight }) {
    const line1 = sprintf('ID: %3s-%s   FL  %03d', flight.id, flight.type, Math.round(flight.alt / 100));
    const line2 = sprintf('    to %3s  Hdg %03d', flight.to, Math.round(flight.hdg));
    const line3 = sprintf('    %s', status(flight));
    return (
        <pre className="terminal">{line1}<br />
            {line2}<br />
            {line3}<br /></pre>
    );
}

function QueuePane({ session }) {
    if (!session) {
        return (
            <Card bg="dark">Queue</Card>
        );
    } else {
        return (
            <Card bg="dark" text="white">
                <Card.Header>Flights</Card.Header>
                <Card.Body>
                    {
                        _.map(session.flights, (flight, i) => {
                            return (
                                <FlightEntry key={i} flight={flight} />
                            );
                        })
                    }
                </Card.Body>
            </Card>
        );
    }
}

export default QueuePane;
