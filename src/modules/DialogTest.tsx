import React, { Component } from 'react';
import { Alert, Card, Col, Container, Form, FormGroup, Row } from 'react-bootstrap';
import _ from 'lodash';
import { synthVoices } from './Audio';
import { tap } from 'rxjs/operators';
import { AudioDialog } from './AudioDialog';

export class DialogTest extends Component<{}, Readonly<{
    voice: string;
    voices: SpeechSynthesisVoice[];
    errors: string[];
    speech?: string;
    listening: boolean;
    audioDialog?: AudioDialog<string>;
}>> {
    constructor(props: {}) {
        super(props);
        this.state = {
            voice: '0',
            voices: [],
            errors: [],
            listening: false
        };
        _.bindAll(this, [
            'handleCloseAlert', 'handleVoice'
        ]);
    }

    componentDidMount() {
        const self = this;
        synthVoices().pipe(
            tap(voices => self.setState({ voices }))
        ).subscribe();
        const audioDialog = new AudioDialog<string>({
            polling: 100,
            parseSpeech: s => s,
            isCompleted: s => s !== '',
            onSpeech: speech => self.handleSpeech(speech),
            onListening: listening => {
                console.log(listening);
                self.setState({ listening });
            }
        });
        this.setState({ audioDialog });
    }

    handleSpeech(speech: string) {
        const { audioDialog, voice } = this.state;
        if (audioDialog) {
            console.log(speech);
            audioDialog.say([voice + ' ' + speech]);
        }
        this.setState({ speech })
    }

    handleVoice(voice: string) {
        this.setState({ voice });
    }

    handleCloseAlert(i: number) {
        const { errors } = this.state;
        errors.splice(i, 1);
        this.setState({ errors });
    }

    render() {
        const { voice, errors, voices, speech, listening } = this.state;
        console.log(listening);
        return (
            <Container>
                <Card>
                    <Card.Header>
                        Audio test
                    </Card.Header>
                    <Card.Body>
                        {
                            errors.map((error, i) => (
                                <Alert
                                    key={i}
                                    variant="danger" dismissible
                                    show={!!error}
                                    onClose={() => this.handleCloseAlert(i)}>
                                    {error}
                                </Alert>
                            ))
                        }
                        <Form>
                            <FormGroup controlId="voiceInput">
                                <Form.Label>Voice</Form.Label>
                                <Form.Control as="select" value={voice}
                                    onChange={ev => this.handleVoice(ev.target.value)} >
                                    {voices.map((voice, i) => (
                                        <option key={i} value={i}>{voice.name}</option>
                                    ))}
                                </Form.Control>
                            </FormGroup>
                            <Form.Group as={Row} controlId="Text">
                                <Form.Label column sm="2">
                                    Text
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control plaintext readOnly defaultValue={speech} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="Text">
                                <Form.Label column sm="2">
                                    Text
                                </Form.Label>
                                <Col sm="10">
                                    <Form.Control plaintext readOnly defaultValue={
                                        listening ?
                                            'Listening ...' :
                                            ''} />
                                </Col>
                            </Form.Group>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
}
