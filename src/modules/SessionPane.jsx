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
import { TrafficSimulator, choose } from './TrafficSimulator';
import { levelDao } from './LevelDao';
import { cockpitLogger } from './CockpitLogger';
import _ from 'lodash';
import { AudioBuilder, MessageBuilder, synthSay, synthVoices } from './Audio';

const CLOCK_INTERVAL = 400;
const RADAR_INTERVAL = 4;
const SIM_INTERVAL = 1;

/**
 * 
 * @param {*} param0 
 */
function AccordionPane({ session, logger, muted, onMuted, speed, onSpeed }) {
  return (
    <div>
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
      </Accordion>
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
      <Accordion defaultActiveKey="0">
        <Card bg="dark" text="white">
          <Accordion.Toggle as={Card.Header} eventKey="2">
            Cockpit Log
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="2">
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
    </div>
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
    this.state = {
      logger,
      muted: false,
      speed: 10,
      ts: 0,
      atcVoice: '0',
      flightVoices: []
    };
    this.clock = interval(CLOCK_INTERVAL);
    _.bindAll(this, [
      'handleClock', 'handleCommand', 'handleSimulationEvent',
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

    synthVoices().pipe(
      tap(voices => {
        const indices = _.range(0, voices.length).map(i => i.toString());
        const atcVoice = choose(indices);
        const flightVoices = _.filter(indices, i => i !== atcVoice);
        self.setState({ atcVoice, flightVoices })
      })
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
    const { session, map, level, flightVoices } = this.state;
    const sim = new TrafficSimulator(session, {
      map, level, flightVoices,
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
    const { logger, muted, atcVoice } = this.state;
    if (!muted) {
      const clips = new AudioBuilder(event, atcVoice).build();
      synthSay(clips).subscribe();
    }
    const msgs = new MessageBuilder(event, atcVoice).build();
    msgs.forEach(logger.sendMessage);
  }

  /**
   *
   * @param {*} t
   */
  handleClock(t) {
    const { session, map, level, speed, ts, flightVoices } = this.state;

    const ts1 = ts + CLOCK_INTERVAL * speed / 1000;
    if (ts1 >= RADAR_INTERVAL) {

      var sim = new TrafficSimulator(session, {
        map, level, dt: SIM_INTERVAL, flightVoices,
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

  /**
   *
   */
  handleMuted() {
    const muted = !this.state.muted;
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.setState({ muted });
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
    const { session, map, nodeMap, level, logger, muted, speed } = this.state;
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
