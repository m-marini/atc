import React, { Component } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { sessionDao } from './SessionDao';
import ATCNavbar from './ATCNavbar';
import QueuePane from './QueuePane';
import RadarPane from './RadarPane';
import LogPane from './LogPane';
import CommandPane from './CommandPane';
import { mapDao } from './MapDao';
import { flatMap, map, tap } from 'rxjs/operators';
import '../App.css';
import { interval } from 'rxjs';
import { TrafficSimulator } from './TrafficSimulator';
import { levelDao } from './LevelDao';
import { cockpitLogger } from './CockpitLogger';
import Reader from './Reader';
import ReactAudioPlayer from 'react-audio-player';
import _ from 'lodash';
import { AudioBuilder, toMessage, toMp3 } from './Audio';

const INTERVAL = 1000;
const SIM_INTERVAL = 10;

class Session extends Component {

  constructor(props) {
    super(props);
    const logger = cockpitLogger();
    const reader = new Reader();
    this.state = { logger, reader, muted: false };
    this.clock = interval(INTERVAL);
    _.bindAll(this, [
      'handleClock', 'handleCommand', 'handleAudioEnded', 'handleSimulationEvent', 'handleAudioError',
      'handleMuted'
    ]);
  }

  componentDidMount() {
    const self = this;

    sessionDao.getSession(this.props.sessionId).pipe(
      flatMap(session =>
        levelDao.level(session.level).pipe(
          flatMap(level =>
            mapDao.map(session.map).pipe(
              map(map => {
                const nodeMap = mapDao.coords(map.nodes, map.center);
                return { session, map, nodeMap, level };
              })
            )
          )
        )
      ),
      tap(data => { self.setState(data) })
    ).subscribe();

    this.clock.pipe(
      tap(this.handleClock)
    ).subscribe()
  }

  handleCommand(cmd) {
    const { session, map, level } = this.state;
    const sim = new TrafficSimulator({
      session, map, level,
      onEvent: this.handleSimulationEvent
    });
    const next = sim.processCommand(cmd).sessionJS;
    const newSession = sessionDao.putSession(next);
    this.setState({ session: newSession });
  }

  handleSimulationEvent(event) {
    const { reader, logger } = this.state;
    // toMessages(event).forEach(logger.sendMessage);
    const clips = new AudioBuilder(event).toAudio().clips;
    clips.forEach(clip => logger.sendMessage(toMessage(clip)));
    const newReader = reader.say(clips.flatMap(toMp3));
    this.setState({ reader: newReader });
  }

  handleClock(t) {
    const { session, map, level } = this.state;
    const sim = new TrafficSimulator({
      session, map, level, dt: SIM_INTERVAL,
      onEvent: this.handleSimulationEvent
    });
    const next = sim.transition().sessionJS;
    const newSession = sessionDao.putSession(next);
    this.setState({ session: newSession });
  }

  handleAudioEnded() {
    this.setState({ reader: this.state.reader.next() })
  }

  handleAudioError() {
    const { reader } = this.state;
    console.error('missing src', reader.src);
    this.setState({ reader: reader.next() })
  }

  handleMuted(ev) {
    const { muted } = this.state;
    this.setState({ muted: !muted });
  }

  render() {
    const { session, map, nodeMap, level, logger, reader, muted } = this.state;
    const src = reader.src;
    if (!nodeMap || !session || !map || !level) {
      return (<div></div>);
    } else {
      return (
        <Container fluid>
          <ATCNavbar session={session} muted={muted} onMuted={this.handleMuted} />
          <Container fluid className="ATC">
            <Row>
              <Col xs={2}>
                <QueuePane session={session} />
              </Col>
              <Col><RadarPane session={session} nodeMap={nodeMap} map={map} /></Col>
              <Col xs={2}>
                <CommandPane session={session} map={map}
                  onCommand={this.handleCommand} />
              </Col>
            </Row>
            <LogPane logger={logger} />
            <Row>
            </Row>
          </Container>
          <ReactAudioPlayer autoPlay
            src={src}
            muted={muted}
            onEnded={this.handleAudioEnded}
            onError={this.handleAudioError} />
        </Container >
      );
    }
  }
}

function SessionPane() {
  const { id } = useParams();
  return (
    <Session sessionId={id} />
  );
}

export default SessionPane;
