import React, { Component } from 'react';
import { Button, Card, CardDeck, Col, Container, Jumbotron, ListGroup, Row } from 'react-bootstrap';
import _ from 'lodash';
import { mapDao } from './MapDao';
import ATCNavbar from './ATCNavbar';
import { sessionDao } from './SessionDao';
import { levelDao } from './LevelDao';
import { tap } from 'rxjs/operators';

function LevelSelection({ value, values = {}, onSelect }) {

  const listOnSelect = value => ev => {
    if (!!onSelect) {
      onSelect(value);
    }
  }

  return (
    <Card style={{ width: '18rem' }}>
      <Card.Header>Game Level</Card.Header>
      <ListGroup variant="flush">
        {_.map(values.levels, level =>
          (
            <ListGroup.Item action key={level.id}
              active={value.id === level.id}
              eventKey={level.id}
              onClick={listOnSelect(level)}>{level.name}</ListGroup.Item>
          )
        )
        }
      </ListGroup>
    </Card>
  );
}

function MapSelection({ value, values = {}, onSelect }) {
  const onClick = value => ev => {
    if (!!onSelect) {
      onSelect(value);
    }
  };
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Header>Map</Card.Header>
      <ListGroup variant="flush">
        {_.map(values.maps, map => {
          return (
            <ListGroup.Item key={map.id}
              eventKey={map.id}
              active={value.id === map.id}
              action onClick={onClick(map)}>
              {map.descr}
            </ListGroup.Item>
          );
        })
        }
      </ListGroup>
    </Card>
  );
}

class Home extends Component {

  constructor(props) {
    super();
    this.handleLevel = this.handleLevel.bind(this);
    this.handleMap = this.handleMap.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.state = {};
  }

  componentDidMount() {
    const th = this;
    mapDao.maps().pipe(
      tap(maps => {
        const map = maps.maps.LRX;
        th.setState({ maps, map });
      })
    ).subscribe();

    levelDao.levels().pipe(
      tap(levels => {
        th.setState({ levels, level: levels.levels[0] });
      })
    ).subscribe()
  }

  handleStart() {
    const { level, map } = this.state;
    const session = sessionDao.create(level.id, map.id);
    window.location.href = process.env.REACT_APP_BASENAME + '#/sessions/' + session.id;
  }

  handleLevel(level) {
    this.setState({ level });
  }

  handleMap(map) {
    this.setState({ map });
  }

  render() {
    const { levels = {}, level = {}, maps = {}, map = {} } = this.state;

    return (
      <Container fluid>
        <ATCNavbar />
        <Container>
          <Jumbotron>
            <h1>ATC</h1>
            <Container>
              <Row>
                <Col>
                  <CardDeck>
                    <LevelSelection value={level} values={levels} onSelect={this.handleLevel} />
                    <MapSelection value={map} values={maps} onSelect={this.handleMap} />
                  </CardDeck>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button onClick={this.handleStart} >Start</Button>
                </Col>
              </Row>
            </Container>
          </Jumbotron>
        </Container>
      </Container >
    );
  }
}

export default Home;
