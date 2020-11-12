import React, { Component } from 'react';
import { Button, Card, Container, Form, FormGroup } from 'react-bootstrap';
import _ from 'lodash';
import { interval, of } from 'rxjs';
import { tap, map, first, filter } from 'rxjs/operators';

class VoiceSynth extends Component {

    constructor(props) {
        super(props);
        this.state = {
            voices: [],
            voiceIdx: 0
        };
        _.bindAll(this, [
            'play', 'handleVoiceSelection', 'loadVoicesAsync', 'handleText'
        ]);
    }

    componentDidMount() {
        const th = this;
        this.loadVoicesAsync().pipe(
            tap(allVoices => {
                const voices = _.filter(allVoices, v => v.lang.startsWith(''))
                th.setState({ voices });
            })
        ).subscribe();
    }

    loadVoicesAsync() {
        const synth = window.speechSynthesis;
        if (synth) {
            return interval(10).pipe(
                map(() => {
                    return synth.getVoices()
                }),
                filter(v => v.length > 0),
                first()
            );
        } else {
            return of([]);
        }
    }

    play() {
        const { voices, voiceIdx, text } = this.state;
        const synth = window.speechSynthesis;
        if (synth && voices && voiceIdx !== undefined) {
            const utt = new SpeechSynthesisUtterance(text);
            utt.voice = voices[voiceIdx];
            // utt.rate = 1.2;
            console.log('Playing');
            synth.speak(utt);
        } else {
            console.log('Missing speechSynthesis');
        }
    }

    handleVoiceSelection(ev) {
        this.setState({ voiceIdx: parseInt(ev.target.value) });
    }

    handleText(ev) {
        this.setState({ text: ev.target.value });
    }

    render() {
        const { voices, text, voiceIdx } = this.state;
        return (
            <Container>
                <Card>
                    <Card.Header>
                        Voice Synth
                    </Card.Header>
                    <Card.Body>
                        <Form>
                            <FormGroup controlId="voiceInput">
                                <Form.Label>Voice</Form.Label>
                                <Form.Control as="select"
                                    value={voiceIdx}
                                    onChange={this.handleVoiceSelection}>
                                    {
                                        voices.map((v, i) => {
                                            return (
                                            <option key={i} value={i} > {v.lang} {v.voiceURI}</option>
                                            );
                                        })
                                    }
                                </Form.Control>
                            </FormGroup>
                            <FormGroup controlId="textInput">
                                <Form.Label>Phrase</Form.Label>
                                <Form.Control type="text" placeholder="voice text"
                                    value={text}
                                    onChange={this.handleText} />
                            </FormGroup>
                            <Button onClick={this.play}>Play</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
        );
    }
}

export default VoiceSynth;
