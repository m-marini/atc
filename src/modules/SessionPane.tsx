import React, { Component } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { sessionDao } from './SessionDao';
import { CommandPane } from './CommandPane';
import { mapDao } from './MapDao';
import { flatMap, map, tap } from 'rxjs/operators';
import '../App.css';
import { interval, Observable, of } from 'rxjs';
import { levelDao } from './LevelDao';
import { cockpitLogger, CockpitLogger } from './CockpitLogger';
import _ from 'lodash';
import { buildSimulator, DefaultSimProps } from './TrafficSimulator';
import { RadarPane } from './RadarPane';
import { ATCNavBar } from './ATCNavbar';
import { Session } from './Session';
import { Level } from './Level';
import { AreaMap, FlightMap } from './Map';
import { andMsgOp, CommandMessage, isCommand, isSpeechError, isVoice, Message, MessageTag, tagMsgOp } from './Message';
import { OptionsPane } from './OptionPane';
import { InfoPane } from './InfoPane';
import { AudioBuilder, TextBuilder } from './MessageConverters';
import { synthVoices } from './Audio';
import { AudioDialog } from './AudioDialog';
import { SpeechPane } from './SpeechPane';
import { speechToMessage } from './CommandInterpreter';

const ClockInterval = 400;
const RadarInterval = 4;
const SIM_INTERVAL = 1;

const muteMessage = andMsgOp([isVoice, tagMsgOp(MessageTag.Command)]);
/**
 * 
 */
class SessionPane1 extends Component<{
  readonly sessionId: string;
}, Readonly<{
  session?: Session;
  level?: Level;
  map?: AreaMap;
  nodeMap?: FlightMap;
  logger: CockpitLogger;
  listenEnabled: boolean;
  muted: boolean;
  speed: number;
  ts: number;
  flightVoices: string[];
  audioDialog?: AudioDialog<Message>;
  listening: boolean;
  speech: string;
}>> {
  private clock: Observable<number>;

  /**
   * 
   * @param {*} props 
   */
  constructor(props: {
    readonly sessionId: string;
  }) {
    super(props);
    const logger = cockpitLogger();
    this.state = {
      logger,
      muted: false,
      listenEnabled: true,
      speed: 10,
      ts: 0,
      flightVoices: [],
      listening: false,
      speech: ''
    };
    this.clock = interval(ClockInterval);
    _.bindAll(this, [
      'handleClock', 'handleCommand', 'handleListenEnabled',
      'handleMuted', 'handleSpeed', 'handleMessages'
    ]);
  }

  /**
   *
   */
  componentDidMount() {
    const self = this;

    const audioDialog = new AudioDialog<Message>({
      polling: 100,
      parseSpeech: speechToMessage,
      isCompleted: m => !(isSpeechError(m) && m.parserError === 'partial-command'),
      onRecognized: speech => self.handleSpeechMessage(speech),
      onSpeech: speech => self.setState({ speech }),
      onListening: listening => self.handleListening(listening)
    });
    audioDialog.listenEnabled = this.state.listenEnabled;
    this.setState({ audioDialog });

    sessionDao.getSession(this.props.sessionId).pipe(
      flatMap(session => {
        if (!session) {
          return of({});
        }
        return levelDao.level(session.level).pipe(
          flatMap(level =>
            mapDao.getMap((session).map).pipe(
              flatMap(map1 =>
                synthVoices().pipe(
                  map(voices => {
                    const indices = _.range(0, voices.length).map(i => i.toString());
                    const atcVoice = session.atcVoice;
                    const nodeMap = mapDao.coords(map1.nodes, map1.center);
                    const flightVoices1 = _.reject(indices, i => i === atcVoice);
                    const flightVoices = flightVoices1.length > 0 ? flightVoices1
                      : atcVoice ? [atcVoice]
                        : [];
                    return { session, map: map1, nodeMap, level, flightVoices };
                  })
                )
              )
            )
          )
        );
      }),
      tap(data => { self.setState(data) })
    ).subscribe();

    this.clock.pipe(
      tap(this.handleClock)
    ).subscribe()

  }

  /**
   * 
   * @param listening 
   */
  private handleListening(listening: boolean) {
    this.setState({ listening });
  }

  /**
   *
   * @param {*} cmd
   */
  private handleCommand(cmd: CommandMessage) {
    const { session, map, level, flightVoices } = this.state;
    if (session && map && level) {
      const sim = buildSimulator(session, {
        map, level, flightVoices
      });
      const next = sim.processCommand(cmd);
      const newSession = sessionDao.putSession(next.session);
      this.handleMessages([cmd]);
      this.handleMessages(next.messages);
      this.setState({ session: newSession });
    }
  }

  /**
   *
   * @param t
   */
  private handleClock(t: number) {
    const { session, map, level, speed, ts, flightVoices } = this.state;
    if (session && map && level) {
      const ts1 = ts + ClockInterval * speed / 1000;
      if (ts1 >= RadarInterval) {
        var sess = session;
        for (var ts2 = ts1; ts2 >= SIM_INTERVAL; ts2 -= SIM_INTERVAL) {
          const sim = buildSimulator(sess, {
            map, level, dt: SIM_INTERVAL, flightVoices
          }).transition();
          this.handleMessages(sim.messages);
          sess = sim.session;
        }
        this.setState({ session: sessionDao.putSession(sess), ts: ts2 });
      } else {
        this.setState({ ts: ts1 });
      }
    }
  }

  /**
   * 
   * @param messages 
   */
  private handleMessages(messages: Message[]) {
    const { map, logger, session, muted, audioDialog } = this.state;
    if (map && messages.length > 0 && session) {
      const texts = messages.map(m => new TextBuilder(m, map).build());
      logger.putMessages(texts);
      texts.forEach(txt => console.log(txt.text));
      if (!muted) {
        const clips = _(messages)
          .reject(muteMessage)
          .map(m => new AudioBuilder(m, map, session).build())
          .value();
        if (audioDialog) {
          audioDialog.say(clips);
        }
      }
    }
  }

  /**
   *
   */
  private handleMuted() {
    const muted = !this.state.muted;
    if (muted && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.setState({ muted });
  }

  /**
   *
   */
  private handleListenEnabled() {
    const { audioDialog } = this.state;
    const listenEnabled = !this.state.listenEnabled;
    if (audioDialog) {
      audioDialog.listenEnabled = listenEnabled;
    }
    this.setState({ listenEnabled });
  }

  /**
   *
   * @param {*} ev
   */
  private handleSpeed(speed: number) {
    this.setState({ speed });
  }

  private handleSpeechMessage(msg: Message) {
    console.log(msg);
    if (isCommand(msg)) {
      this.handleCommand(msg)
    } else {
      this.handleMessages([msg]);
    }
  }

  /**
   *
   */
  render() {
    const { session, map, nodeMap, level, logger, muted, listenEnabled,
      speed, listening, speech } = this.state;
    if (!nodeMap || !session || !map || !level) {
      return (<div></div>);
    } else {
      return (
        <Container fluid>
          <ATCNavBar session={session} />
          <Container fluid className="ATC">
            <Row>
              <Col xs={2}>
                <InfoPane session={session} logger={logger} />
              </Col>
              <Col><RadarPane
                session={session}
                nodeMap={nodeMap}
                map={map}
                collisionDistance={DefaultSimProps.collisionDistance} />
                <SpeechPane listening={listening} speech={speech} />
              </Col>
              <Col xs={2}>
                <CommandPane session={session} map={map}
                  onCommand={this.handleCommand} />
                <OptionsPane
                  speed={speed}
                  onSpeed={this.handleSpeed}
                  muted={muted}
                  onMuted={this.handleMuted}
                  listeningEnabled={listenEnabled}
                  onListeningEnabled={this.handleListenEnabled} />
              </Col>
            </Row>
          </Container>
        </Container >
      );
    }
  }
}

/**
 * 
 */
export function SessionPane(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  return (
    <SessionPane1 sessionId={id} />
  );
}
