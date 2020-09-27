import React from 'react';
import { Card } from 'react-bootstrap';
import _ from 'lodash';
import { sprintf } from 'sprintf-js';

function FlightEntry({ flight }) {
    const fc = flight.type === 'jet' ? 'J' : 'A';
    const line1 = sprintf('ID: %3s-%s   FL  %03d', flight.id, fc, Math.round(flight.alt / 100));
    const line2 = sprintf('    to %3s  Hdg %03d', flight.to, Math.round(flight.hdg));
    const line3 = sprintf('    %s', flight.status);
    return (
        <pre className="terminal">
            {line1}<br />
            {line2}<br />
            {line3}<br />
        </pre>
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
