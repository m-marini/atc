import React, { FunctionComponent } from 'react';
import { Accordion, Card } from 'react-bootstrap';
import '../App.css';
import { Session } from './Session';
import { CockpitLogger } from './CockpitLogger';
import { QueuePane } from './QueuePane';

/**
 * 
 * @param {*} param0 
 */
export const InfoPane: FunctionComponent<{
  session?: Session,
  logger?: CockpitLogger;
}> = ({ session, logger }) => {
  return (
    <div>
      <Accordion defaultActiveKey="0">
        <Card bg="dark" text="white">
          <Accordion.Toggle as={Card.Header} eventKey="0">
            Flights
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <QueuePane session={session} />
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
      <Accordion defaultActiveKey="0">
        <Card bg="dark" text="white">
          <Accordion.Toggle as={Card.Header} eventKey="2">
            Cockpit Log
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="2">
            <Card.Body>
              {logger && logger.log.map((msg, i) => (
                <div key={i} className={`term-${msg.style} text-monospace`}>{msg.text}</div>
              ))}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    </div>
  );
}
