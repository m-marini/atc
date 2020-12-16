import React, { Component } from 'react';
import { Button, ButtonGroup, ButtonToolbar, CardDeck, Col, Container, Jumbotron, Row } from 'react-bootstrap';
import _ from 'lodash';
import { mapDao } from './MapDao';
import { sessionDao } from './SessionDao';
import { levelDao } from './LevelDao';
import { tap, toArray } from 'rxjs/operators';
import { LevelSelection } from './LevelSelection';
import { MapSelection } from './MapSelection';
import { AreaMapSet } from './Map';
import { LevelList } from './Level';
import { Session } from './Session';
import { ATCNavBar } from './ATCNavbar';
import { synthVoices } from './Audio';

interface HomeState {
  readonly map?: string;
  readonly maps?: AreaMapSet;
  readonly level?: string;
  readonly levels?: LevelList;
  readonly sessions?: Session[];
}
/**
 * 
 */
class Home extends Component<{}, HomeState> {

  /**
   * 
   * @param props 
   */
  constructor(props: {}) {
    super(props);
    this.state = {};
    _.bindAll(this, ['handleLevel', 'handleMap', 'handleStart', 'handleLoad']);
  }

  /**
   * 
   */
  componentDidMount() {
    const th = this;
    mapDao.getMaps().pipe(
      tap(maps => {
        th.setState({ maps, map: 'LON' });
      })
    ).subscribe();

    levelDao.levels().pipe(
      tap(levels => {
        th.setState({ levels, level: levels.levels[0].id });
      })
    ).subscribe()

    sessionDao.getSessions().pipe(
      toArray(),
      tap((sessions: Session[]) => {
        th.setState({ sessions });
      })
    ).subscribe();
  }

  /**
   * 
   */
  handleStart() {
    const { level = '', map: map1 = '' } = this.state;
    synthVoices().pipe(
      tap(voices => {
        const atcVoice = voices.length > 0
          ? Math.floor(Math.random() * voices.length).toString()
          : undefined;
        const session = sessionDao.create(level, map1, atcVoice);
        window.location.href = process.env.REACT_APP_BASENAME + '#/sessions/' + session.id;
      })
    ).subscribe();
  }

  handleLoad() {
    const { sessions } = this.state;
    if (sessions) {
      window.location.href = process.env.REACT_APP_BASENAME + '#/sessions/' + sessions[0].id;
    }
  }

  /**
   * 
   * @param level 
   */
  handleLevel(level: string) {
    this.setState({ level });
  }

  /**
   * 
   * @param map 
   */
  handleMap(map: string) {
    this.setState({ map });
  }

  /**
   * 
   */
  render() {
    const { levels = { levels: [] }, level, maps = { maps: {} }, map, sessions } = this.state;

    return (
      <Container fluid>
        <ATCNavBar />
        <Container>
          <Jumbotron>
            <h1>ATC</h1>
            <Container>
              <Row>
                <Col>
                  <CardDeck>
                    <LevelSelection value={level} values={levels.levels} onSelect={this.handleLevel} />
                    <MapSelection value={map} values={_.values(maps.maps)} onSelect={this.handleMap} />
                  </CardDeck>
                </Col>
              </Row>
              <Row>
                <Col>
                  <ButtonToolbar aria-label="Buttons">
                    <ButtonGroup className="mr-2" aria-label="Start">
                      <Button onClick={this.handleStart} >Start</Button>
                    </ButtonGroup>
                    <ButtonGroup className="mr-2" aria-label="Load">
                      <Button disabled={!sessions || sessions.length === 0}
                        onClick={this.handleLoad}>Load last game</Button>
                    </ButtonGroup>
                  </ButtonToolbar>
                </Col>
              </Row>
            </Container>
          </Jumbotron>
          <p>Your goal is to route safely the planes in your area.</p>
          <p>You need to:</p>
          <ul>
            <li>take off planes waiting at runways</li>
            <li>land the planes at destination runways</li>
            <li>fly the planes via the leaving beacons at altitude
				of 36000 feet.</li>
          </ul>
          <p>You must avoid:</p>
          <ul>
            <li>planes collinsion, the collision happend when
            the distance between two planes are lower then 4 nautic miles and
				the altitude difference is lower then 1000 feet</li>
            <li>leaving to a wrong beacons</li>
            <li>landing to a wrong runway</li>
          </ul>
          <p>You can zoom the map using the mouse wheel and shift key or move the map by dragging it with the left mouse button</p>
          <p>A click with the center mouse button fits the map to the viewport.</p>
        </Container>
      </Container >
    );
  }
}

export default Home;
