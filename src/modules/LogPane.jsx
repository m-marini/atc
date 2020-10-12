import React from 'react';
import _ from 'lodash';
import { Card } from 'react-bootstrap';

function LogPane({ logger }) {
    console.log(logger.log);
    return (
        <Card bg="dark" text="white">
            <Card.Body>
                {
                    _.map(logger.log, (msg, i) => {
                        return (
                            <pre key={i} className={msg.type}>{msg.msg}</pre>
                        );
                    })
                }
            </Card.Body>
        </Card>
    );
}

export default LogPane;
