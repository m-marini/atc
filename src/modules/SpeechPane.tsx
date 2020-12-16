import React, { FunctionComponent } from 'react';
import { faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Form, InputGroup } from 'react-bootstrap';
import '../App.css';

/**
 * 
 * @param {*} param0 
 */
export const SpeechPane: FunctionComponent<{
  readonly listening?: boolean;
  readonly speech?: string;
}> = ({ listening, speech = '' }) => {
  return (
    <Card bg="dark" text="white">
      <Card.Body>
        <Form>
          <Form.Group >
            <Form.Label>Listening</Form.Label>
            <InputGroup>
              <InputGroup.Prepend>
                {listening ?
                  (<FontAwesomeIcon icon={faMicrophone} />) :
                  (<FontAwesomeIcon icon={faMicrophoneSlash} />)}
              </InputGroup.Prepend>
            </InputGroup>
            {speech.toLowerCase()}
          </Form.Group>
        </Form>
      </Card.Body>
    </Card>
  );
}
