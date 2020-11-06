import React, { Component } from 'react';
import { Alert, Button, Card, Container, Form, FormGroup } from 'react-bootstrap';
import Reader from './Reader';
import ReactAudioPlayer from 'react-audio-player';
import _ from 'lodash';
import { toMp3 } from './Audio';

const VOICES = [
    'george',
    'john',
    'marco'
];

class AudioTest extends Component {

    constructor(props) {
        super(props);
        this.state = {
            voice: 'george',
            text: 'lonatc goodday',
            reader: new Reader(),
            errors: []
        };
        _.bindAll(this, [
            'handlePlay', 'handleText', 'handleAudioEnded', 'handleAudioError',
            'handleCloseAlert', 'handleVoice'
        ]);
    }

    handlePlay() {
        const { reader, voice, text } = this.state;
        this.setState({ reader: reader.say(toMp3(voice + ' ' + text)) });
    }

    handleText(ev) {
        this.setState({ text: ev.target.value })
    }

    handleVoice(ev) {
        this.setState({ voice: ev.target.value })
    }

    handleAudioEnded(ev) {
        this.setState({ reader: this.state.reader.next() })
    }

    handleCloseAlert(i) {
        const { errors } = this.state;
        errors.splice(i, 1);
        this.setState({ errors });
    }

    handleAudioError(ev) {
        const { reader, errors } = this.state;
        errors.push(`Missing src ${reader.src}`);
        this.setState({
            reader: reader.next(),
            errors
        })
    }

    render() {
        const { voice, text, reader, errors } = this.state;
        const src = reader.src;
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
                                    onChange={this.handleVoice} >
                                    {
                                        VOICES.map(voice =>
                                            (
                                                <option key={voice}>{voice}</option>
                                            )
                                        )
                                    }
                                </Form.Control>
                            </FormGroup>
                            <FormGroup controlId="textInput">
                                <Form.Label>Phrase</Form.Label>
                                <Form.Control type="text" placeholder="voice text" value={text}
                                    onChange={this.handleText} />
                            </FormGroup>
                            <FormGroup controlId="mp3Input">
                                <Form.Label>Mp3</Form.Label>
                                <Form.Control plaintext readOnly defaultValue={src} />
                            </FormGroup>
                            <Button onClick={this.handlePlay}>Play</Button>
                        </Form>
                    </Card.Body>
                </Card>
                <ReactAudioPlayer autoPlay
                    src={src}
                    onEnded={this.handleAudioEnded}
                    onError={this.handleAudioError} />
            </Container>
        );
    }
}

export default AudioTest;
