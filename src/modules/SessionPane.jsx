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
import { Map } from 'immutable';
import _ from 'lodash';
import '../App.css';
import { interval } from 'rxjs';

const INTERVAL = 1000;

/**
 * Returns the map data {center, nodes, xmin, xmax, ymin, ymax}
 * @param {*} map the map
 */
function toMapData(map) {
  const data = mapDao.coords(map.nodes, map.center);
  const nodes = _(data.nodes);
  const x = nodes.map(node => node.coords[0]);
  const y = nodes.map(node => node.coords[1]);

  const map1 = Map(data)
    .set('xmin', x.min())
    .set('xmax', x.max())
    .set('ymin', y.min())
    .set('ymax', y.max());
  return map1.toObject();
}

class Session extends Component {

  constructor(props) {
    super(props);
    this.state = {};
    this.handleClock = this.handleClock.bind(this);
    this.clock = interval(INTERVAL);

  }

  componentDidMount() {
    const self = this;

    sessionDao.getSession(this.props.sessionId).pipe(
      flatMap(session =>
        mapDao.map(session.map).pipe(
          map(map => {
            const nodeMap = toMapData(map);
            return { session, map, nodeMap };
          })
        )
      ),
      tap(data => self.setState(data))
    ).subscribe();

    this.clock.pipe(
      tap(this.handleClock)
    ).subscribe()
  }

  handleClock(t) {
    if ((t % 4) === 0) {
      const { session } = this.state;
      session.flights = [{
        id: 'A1',
        lat: 45.6449981253281,
        lon: 9.0216665994376,
        hdg: Math.round(Math.random() * 360),
        speed: Math.round(200 + Math.random() * 200),
        type: 'jet',
        alt: Math.round(Math.random() * 36000),
        status: 'wait',
        to: 'VIC'
      }, {
        id: 'B1',
        lat: 45.749881253281,
        lon: 10.0216615994376,
        hdg: Math.round(Math.random() * 360),
        speed: Math.round(200 + Math.random() * 200),
        type: 'plane',
        alt: Math.round(Math.random() * 36000),
        status: 'wait',
        to: 'DJ'
      },
      ];
      const newSession = sessionDao.putSession(session);
      this.setState({ session: newSession });
    }
  }

  render() {
    const { session, map, nodeMap } = this.state;
    if (!nodeMap || !session || !map) {
      return (<div></div>);
    } else {
      return (
        <Container fluid>
          <ATCNavbar />
          <Container fluid className="ATC">
            <Row>
              <Col xs={2}><QueuePane session={session} /></Col>
              <Col><RadarPane session={session} nodeMap={nodeMap} map={map} /></Col>
              <Col xs={2}>
                <CommandPane session={session} map={map}
                  onCommand={cmd => console.log('cmd', cmd)} />
              </Col>
            </Row>
            <LogPane session={session} />
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
