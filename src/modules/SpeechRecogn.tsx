import React, { Component } from 'react';
import { Card, Col, Container, Form, Row } from 'react-bootstrap';
import _ from 'lodash';
import { synthSay } from './Audio';
// import grammar from './SpeachGrammar.jsx';
// const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList
// const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent

const createRecogn: (arg: {
    onresult?: (ev: SpeechRecognitionEvent) => void,
    onnomatch?: (ev: SpeechRecognitionEvent) => void,
    onend?: (ev: Event) => void
    onerror?: (ev: Event) => void
    ondefault?: (ev: Event) => void
}) => SpeechRecognition | undefined
    // = ({  }) => {
    = ({ ondefault = null, onresult = null, onend = null, onnomatch = null, onerror = null }) => {
        const SpeechRecognition: (new () => SpeechRecognition) | undefined = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        console.log('create recogn', SpeechRecognition);
        if (!!SpeechRecognition) {
            const recognition = new SpeechRecognition();
            // const speechRecognitionList = new SpeechGrammarList();
            // speechRecognitionList.addFromString(grammar, 1);
            // recognition.grammars = speechRecognitionList;
            recognition.continuous = false;
            recognition.lang = 'en';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = onresult || ondefault;
            recognition.onspeechend = ondefault;
            recognition.onnomatch = onnomatch || ondefault
            recognition.onerror = onerror || ondefault;
            recognition.onstart = ondefault;
            recognition.onaudiostart = ondefault;
            recognition.onsoundstart = ondefault;
            recognition.onspeechstart = ondefault;
            recognition.onspeechend = ondefault;
            recognition.onsoundend = ondefault;
            recognition.onaudioend = ondefault;
            recognition.onend = onend || ondefault;
            console.log('create recogn', recognition);
            return recognition;
        } else {
            return undefined;
        }
    }

/**
 * 
 */
class SpeechRecogn extends Component<{}, Readonly<{
    cmd?: string;
    error?: string;
    event?: Event;
}>> {
    private _recognition?: SpeechRecognition;

    /**
     * 
     * @param props 
     */
    constructor(props = {}) {
        super(props);
        this.state = {};
        _.bindAll(this, [
            'handleResult', 'listen'
        ]);

        const self = this;
        const errorHandler = (event: any) => {
            console.log(event);
            const error = event.error;
            self.setState({ error })
        }
        this._recognition = createRecogn({
            onresult: self.handleResult,
            onend: (event: Event) => {
                console.log(event);
                const r = self.recognition;
                if (r) {
                    r.start();
                }
            },
            onnomatch: (event: SpeechRecognitionEvent) => {
                console.log(event);
                const error = 'No match';
                self.setState({ error })
            },
            onerror: errorHandler,
            ondefault: (event: any) => {
                console.log(event);
                self.setState({ event });
            },
        });
    }

    get recognition() { return this._recognition; }

    componentDidMount() {
        this.listen();
    }

    listen() {
        const rec = this._recognition;
        if (rec) {
            rec.start();
        }
        this.setState({ error: undefined });
    }

    /**
     * 
     * @param event 
     */
    handleResult(event: SpeechRecognitionEvent) {
        console.log(event);
        const cmd = event.results[0][0].transcript;
        synthSay(['3 ' + cmd]).subscribe();
        this.setState({ cmd });
    }

    render() {
        const { cmd, error, event = {} } = this.state;
        return (
            <Container>
                <Card>
                    <Card.Header>
                        Speach Recognition Test
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <Form.Group as={Row} controlId="status" >
                                <Form.Label column sm="2">
                                    Status
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control plaintext readOnly defaultValue="" value={(event as any).type} />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="Error">
                                <Form.Label column sm="2">
                                    Errors
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control plaintext readOnly defaultValue="" value={error} />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} controlId="Text">
                                <Form.Label column sm="2">
                                    Text
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control plaintext readOnly defaultValue="" value={cmd} />
                                </Col>
                            </Form.Group>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
}

export default SpeechRecogn;
