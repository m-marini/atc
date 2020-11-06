import React, { Component } from 'react';
import { Accordion, Card, Col, Container, Form, Row } from 'react-bootstrap';
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

const CLOCK_INTERVAL = 400;
const RADAR_INTERVAL = 4;
const SIM_INTERVAL = 1;

/**
 * 
 * @param {*} param0 
 */
function AccordionPane({ session, logger, muted, onMuted, speed, onSpeed }) {
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
      <Card bg="dark" text="white">
        <Accordion.Toggle as={Card.Header} eventKey="2">
          Options
          </Accordion.Toggle>
        <Accordion.Collapse eventKey="2">
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
              </Form.Group>
              <Form.Group controlId="speed">
                <Form.Label>Speed</Form.Label>
                {
                  [1, 3, 10].map(sp => {
                    return (
                      <Form.Check
                        type="radio"
                        name="speed"
                        checked={speed === sp}
                        id={sp}
                        key={sp}
                        value={sp}
                        onChange={onSpeed}
                        label={`x ${sp}`} />
                    );
                  })
                }
              </Form.Group>
            </Form>
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
    this.state = { logger, reader, muted: false, speed: 10, ts: 0 };
    this.clock = interval(CLOCK_INTERVAL);
    _.bindAll(this, [
      'handleClock', 'handleCommand', 'handleAudioEnded', 'handleSimulationEvent', 'handleAudioError',
      'handleMuted', 'handleSpeed'
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
    const { reader, logger, muted } = this.state;
    const clips = new AudioBuilder(event).toAudio().clips;
    clips.forEach(clip => logger.sendMessage(toMessage(clip, event.map.voice)));
    if (!muted) {
      this.setState({ reader: reader.say(clips.flatMap(toMp3)) });
    }
  }

  /**
   * 
   * @param {*} t 
   */
  handleClock(t) {
    const { session, map, level, speed, ts } = this.state;

    const ts1 = ts + CLOCK_INTERVAL * speed / 1000;
    if (ts1 >= RADAR_INTERVAL) {

      var sim = new TrafficSimulator(session, {
        map, level, dt: SIM_INTERVAL,
        onEvent: this.handleSimulationEvent
      });
      for (var ts2 = ts1; ts2 >= SIM_INTERVAL; ts2 -= SIM_INTERVAL) {
        sim = sim.transition();
      }
      const newSession = sessionDao.putSession(sim.session);
      this.setState({ session: newSession, ts: ts2 });
    } else {
      this.setState({ ts: ts1 });
    }
  }

  handleAudioEnded() {
    this.setState({ reader: this.state.reader.next() })
  }

  handleAudioError() {
    const { reader } = this.state;
    console.error('missing src', reader.src);
    this.setState({ reader: reader.next() })
  }

  /**
   * 
   */
  handleMuted() {
    const { muted } = this.state;
    const newState = muted
      ? {
        muted: false
      } : {
        muted: true,
        reader: new Reader()
      };
    this.setState(newState);
  }

  /**
   * 
   * @param {*} ev 
   */
  handleSpeed(ev) {
    this.setState({ speed: parseFloat(ev.target.value) })
  }

  /**
   * 
   */
  render() {
    const { session, map, nodeMap, level, logger, reader, muted, speed } = this.state;
    const src = reader.src;
    if (!nodeMap || !session || !map || !level) {
      return (<div></div>);
    } else {
      return (
        <Container fluid>
          <ATCNavbar session={session} />
          <Container fluid className="ATC">
            <Row>
              <Col xs={2}>
                <AccordionPane session={session} logger={logger}
                  speed={speed}
                  onSpeed={this.handleSpeed}
                  muted={muted}
                  onMuted={this.handleMuted} />
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
