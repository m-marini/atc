import React, { Component } from 'react';
import { Alert, Button, Card, Container, Form, FormGroup } from 'react-bootstrap';
import _ from 'lodash';
import { synthSay, synthVoices } from './Audio';
import { tap } from 'rxjs/operators';

class AudioTest extends Component {

    constructor(props) {
        super(props);
        this.state = {
            voice: '0',
            voices: [],
            text: 'London ATC good day',
            errors: []
        };
        _.bindAll(this, [
            'handlePlay', 'handleText',
            'handleCloseAlert', 'handleVoice'
        ]);
    }

    componentDidMount() {
        synthVoices().pipe(
            tap(voices => this.setState({ voices }))
        ).subscribe();
    }

    handlePlay() {
        const { voice, text } = this.state;
        synthSay([voice + ' ' + text]).subscribe();
    }

    handleText(ev) {
        this.setState({ text: ev.target.value })
    }

    handleVoice(ev) {
        this.setState({ voice: ev.target.value })
    }

    handleCloseAlert(i) {
        const { errors } = this.state;
        errors.splice(i, 1);
        this.setState({ errors });
    }

    render() {
        const { voice, text, errors, voices } = this.state;
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
                                        voices.map((voice, i) =>
                                            (
                                                <option key={i} value={i}>{voice.name}</option>
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
                            <Button onClick={this.handlePlay}>Play</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
}

export default AudioTest;
