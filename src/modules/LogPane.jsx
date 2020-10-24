import React from 'react';
import _ from 'lodash';
import { Card } from 'react-bootstrap';

function LogPane({ logger }) {
    return (
        <Card bg="dark" text="white">
            <Card.Body>
                {
                    _.clone(logger.log).map( (msg, i) => {
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
