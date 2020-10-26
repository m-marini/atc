import React, { Component } from 'react';
import { Accordion, Card, Col, Container, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { sessionDao } from './SessionDao';
import ATCNavbar from './ATCNavbar';
import QueuePane from './QueuePane';
import RadarPane from './RadarPane';
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

/**
 * 
 * @param {*} param0 
 */
function AccordionPane({ session, logger }) {
    return (
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
      <Card bg="dark" text="white">
        <Accordion.Toggle as={Card.Header} eventKey="1">
          Cockpit Log
          </Accordion.Toggle>
        <Accordion.Collapse eventKey="1">
          <Card.Body>
            {
              logger.log.map((msg, i) => {
                return (
                  <div key={i} className={`${msg.type} text-monospace`}>{msg.msg}</div>
                );
              })
            }
          </Card.Body>
        </Accordion.Collapse>
      </Card>
    </Accordion>
  );
}

class Session extends Component {

  /**
   * 
   * @param {*} props 
   */
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

  /**
   * 
   */
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

  /**
   * 
   * @param {*} cmd 
   */
  handleCommand(cmd) {
    const { session, map, level } = this.state;
    const sim = new TrafficSimulator(session, {
      map, level,
      onEvent: this.handleSimulationEvent
    });
    const next = sim.processCommand(cmd).session;
    const newSession = sessionDao.putSession(next);
    this.setState({ session: newSession });
  }

  /**
   * 
   * @param {*} event 
   */
  handleSimulationEvent(event) {
    const { reader, logger } = this.state;
    const clips = new AudioBuilder(event).toAudio().clips;
    clips.forEach(clip => logger.sendMessage(toMessage(clip, event.map.voice)));
    const newReader = reader.say(clips.flatMap(toMp3));
    this.setState({ reader: newReader });
  }

  /**
   * 
   * @param {*} t 
   */
  handleClock(t) {
    const { session, map, level } = this.state;
    const sim = new TrafficSimulator(session, {
      map, level, dt: SIM_INTERVAL,
      onEvent: this.handleSimulationEvent
    });
    const next = sim.transition().session;
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
                <AccordionPane session={session} logger={logger} />
              </Col>
              <Col><RadarPane session={session} nodeMap={nodeMap} map={map} /></Col>
              <Col xs={2}>
                <CommandPane session={session} map={map}
                  onCommand={this.handleCommand} />
              </Col>
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
