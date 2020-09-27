import React, { Component } from 'react';
import { Card } from 'react-bootstrap';

function LogPane() {
    const txt = 'a log\nbi log';
    return (
        <Card bg="dark" text="white">
            <Card.Body>
                <pre className="terminal">
                    {txt}
                </pre>
            </Card.Body>
        </Card>
    );
}

export default LogPane;
