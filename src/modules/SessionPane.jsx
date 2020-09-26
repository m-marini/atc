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
import { map, tap } from 'rxjs/operators';
import { Map } from 'immutable';
import _ from 'lodash';

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
    const session = sessionDao.session(props.sessionId);
    this.session = session;
    this.state = {};
  }

  componentDidMount() {
    const self = this;
    mapDao.map(self.session.map).pipe(
      map(toMapData),
      tap(map => {
        self.setState({ map });
      })
    ).subscribe();
  }

  render() {
    const session = this.session;
    const { map } = this.state;
    return (
      <Container fluid>
        <ATCNavbar />
        <Container>
          <Row>
            <Col xs={1}><QueuePane session={session} /></Col>
            <Col><RadarPane map={map} session={session} /></Col>
            <Col xs={1}><CommandPane session={session} /></Col>
          </Row>
          <LogPane session={session} />
          <Row>
          </Row>
        </Container>
      </Container >
    );
  }
}

function SessionPane() {
  const { id } = useParams();
  return (
    <Session sessionId={id} />
  );
}

export default SessionPane;
