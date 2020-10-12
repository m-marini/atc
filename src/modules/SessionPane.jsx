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

const INTERVAL = 1000;
const SIM_INTERVAL = 10;

class Session extends Component {

  constructor(props) {
    super(props);
    const logger = cockpitLogger();
    this.state = { logger };
    this.handleClock = this.handleClock.bind(this);
    this.handleCommand = this.handleCommand.bind(this);
    this.clock = interval(INTERVAL);
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
    console.log('cmd', cmd);
    const { session, map, level, logger } = this.state;
    const sim = new TrafficSimulator({
      session, map, level,
      sendMessage: logger.sendMessage
    });
    const next = sim.processCommand(cmd).sessionJS;
    const newSession = sessionDao.putSession(next);
    this.setState({ session: newSession });
  }

  handleClock(t) {
    const { session, map, level, logger } = this.state;
    const sim = new TrafficSimulator({
      session, map, level, dt: SIM_INTERVAL,
      sendMessage: logger.sendMessage
    });
    const next = sim.transition().sessionJS;
    const newSession = sessionDao.putSession(next);
    this.setState({ session: newSession });
  }

  render() {
    const { session, map, nodeMap, level, logger } = this.state;
    if (!nodeMap || !session || !map || !level) {
      return (<div></div>);
    } else {
      return (
        <Container fluid>
          <ATCNavbar session={session} />
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
