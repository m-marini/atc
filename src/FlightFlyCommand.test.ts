import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import {
  buildATCNotFoundMessage, buildAtGroundMessage, buildBeaconNotFoundMessage,
  buildFlyToCommand, buildReadbackMessage
} from './modules/Message';
import { flightBuilder } from './TestUtil';

const DT = 10; // sec

const RUNWAY: HeadingMapNode = {
  id: '13',
  type: MapNodeType.Runway,
  alignment: MapNodeAlignment.N,
  lat: 45,
  lon: 11,
  hdg: 132
};

const ENTRY: HeadingMapNode = {
  id: 'ENT',
  type: MapNodeType.Entry,
  alignment: MapNodeAlignment.N,
  lat: 46,
  lon: 10,
  hdg: 132
};

const BEACON: BasicMapNode = {
  id: 'BEA',
  type: MapNodeType.Beacon,
  alignment: MapNodeAlignment.N,
  lat: 44,
  lon: 9
};

const map: AreaMap = {
  id: 'LON',
  name: 'London ATC',
  descr: 'London ATC',
  nodes: { '13': RUNWAY, BEA: BEACON, ENT: ENTRY },
  center: {
    lat: 45,
    lon: 10
  },
  routes: []
};

const DefaultProps: SimulationProps = {
  map: map,
  dt: DT,                     // sec
  level: {
    id: '',
    name: '',
    maxPlane: 1,
    flightFreq: 0
  },
  jetProb: 0.5,
  safeEntryDelay: 120,        // sec
  entryAlt: 28000,            // feet
  exitAlt: 36000,             // feet
  collisionDistance: 4,       // nms
  collisionAlt: 1000,         // feet
  om: 7,                      // nms
  mm: 0.9,                    // nms (5469')
  clearToLandDistance: 30,    // nms
  exitDistance: 2,            // nms
  landingHdgRange: 2,         // DEG
  landingAngle: 3,            // DEG
  conditionDistance: 400 / 3600 * 10 * 1.5, // nms
  holdingDuration: 240,       // sec
  goAroundAlt: 4000,          // feet
  flightTempl: {
    J: {
      speed0: 140,        // nmh
      speed360: 440,      // nmh
      vspeed: 1500        // fpm
    },
    A: {
      speed0: 80,         // nmh
      speed360: 280,      // nmh
      vspeed: 700         // fpm
    }
  },
  flightVoices: []
};

function props(props: any = {}) {
  return _.assign({}, DefaultProps, props) as SimulationProps;
}

describe('Flight should process fly to command', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);

  test('fly immediate', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, ENTRY.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(hdg);
    expect(flight).toBeAlt(28000);
    expect(flight).toBeToAlt(28000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeAt(ENTRY.id)
    expect(flight).toBeStatus(FlightStatus.FlyingTo);
    expect(flight).toBePos(A1);

    expect(result.messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  test('fly to via', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, ENTRY.id, BEACON.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(hdg);
    expect(flight).toBeAlt(28000);
    expect(flight).toBeToAlt(28000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeTurnTo(ENTRY.id);
    expect(flight).toBeAt(BEACON.id);
    expect(flight).toBeStatus(FlightStatus.Turning);
    expect(flight).toBePos(A1);

    expect(result.messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  test('landing', () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, 7)
      .toAlt(28000).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, ENTRY.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(132);
    expect(flight).toBeAlt(A1.alt);
    expect(flight).toBeToAlt(A1.toAlt);
    expect(flight).toBeSpeed(A1.speed);
    expect(flight).toBeAt(ENTRY.id);
    expect(flight).toBeStatus(FlightStatus.FlyingTo);
    expect(flight).toBePos(A1);

    expect(result.messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  test('waiting for take off', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .speed(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, ENTRY.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });

  test('wrong atc', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildFlyToCommand(A1.id, 'PAR', ENTRY.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });

  test('wrong to beacon', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, 'BHO');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildBeaconNotFoundMessage(A1.id, map.id, 'BHO')
    ]);
  });

  test('wrong when beacon', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildFlyToCommand(A1.id, map.id, ENTRY.id, 'BHO');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildBeaconNotFoundMessage(A1.id, map.id, 'BHO')
    ]);
  });
});
