import React, { FunctionComponent } from 'react';
import { Accordion, Card, Form } from 'react-bootstrap';
import '../App.css';

const DefaultSpeeds = [1, 3, 10];

/**
 * 
 * @param {*} param0 
 */
export const OptionsPane: FunctionComponent<{
  readonly muted?: boolean;
  readonly onMuted?: () => void;
  readonly listeningEnabled?: boolean;
  readonly onListeningEnabled?: () => void;
  readonly speed?: number;
  readonly speeds?: number[];
  readonly onSpeed?: (speed: number) => void;
}> = ({ muted, onMuted, listeningEnabled, onListeningEnabled, speed, speeds = DefaultSpeeds, onSpeed }) => {
  return (
    <Accordion defaultActiveKey="1">
      <Card bg="dark" text="white">
        <Accordion.Toggle as={Card.Header} eventKey="1">
          Options
      </Accordion.Toggle>
        <Accordion.Collapse eventKey="1">
          <Card.Body>
            <Form>
              <Form.Group controlId="muted">
                <Form.Label>Audio</Form.Label>
                <Form.Check
                  type="switch"
                  id="muted"
                  label="Muted"
                  onChange={onMuted}
                  checked={muted} />
                <Form.Check
                  type="switch"
                  id="listening"
                  label="Listening"
                  onChange={onListeningEnabled}
                  checked={listeningEnabled} />
              </Form.Group>
              <Form.Group controlId="speed">
                <Form.Label>Speed</Form.Label>
                {speeds.map(sp => {
                  return (
                    <Form.Check
                      type="radio"
                      name="speed"
                      checked={speed === sp}
                      // id={sp}
                      key={sp}
                      value={sp}
                      onChange={(ev: React.ChangeEvent<HTMLInputElement>) => { if (onSpeed) { onSpeed(parseFloat(ev.target.value)) } }}
                      label={`x ${sp}`} />
                  );
                })}
              </Form.Group>
            </Form>
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}
