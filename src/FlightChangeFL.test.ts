import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { SimulationProps, FlightProcessor } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import {
  buildATCNotFoundMessage, buildAtGroundMessage, buildClimbCommand, buildDescendCommand,
  buildInvalidFlightLevelMessage, buildMaintainCommand, buildNotAtGroundMessage,
  buildReadbackMessage, buildTakeoffCommand,
} from './modules/Message';
import { flightBuilder, multipleTestWithData } from './TestUtil';

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

describe('Flight should process climb command', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);

  test('flying FL280 -> FL320, hdg ${hdg}', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildClimbCommand(A1.id, map.id, '320');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(hdg);
    expect(flight).toBeAlt(28000);
    expect(flight).toBeToAlt(32000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBePos(A1);

    const messages = result.messages;
    expect(messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  multipleTestWithData(['039', '361', '281', '280'], (flightLevel) =>
    test(`flying FL280 -> FL${flightLevel} ${hdg}`, () => {
      const d0 = 10;
      const hdg = Math.floor(Math.random() * 360 + 1);
      const A1 = flightBuilder()
        .radial(BEACON, d0, hdg + 180)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const cmd = buildClimbCommand(A1.id, map.id, flightLevel);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);

      const flight = result.flight;
      expect(flight).toBe(flight);

      const messages = result.messages;
      expect(messages).toEqual([
        buildInvalidFlightLevelMessage(A1.id, map.id, flightLevel)
      ]);
    }));

  test(`wrong atc hdg ${hdg}`, () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildClimbCommand(A1.id, 'PAR', '320');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });

  test('holding short -> FL040', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildClimbCommand(A1.id, map.id, '040');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });
});

describe('Flight should process descend command', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);

  test('flying FL280 -> FL240, hdg ${hdg}', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildDescendCommand(A1.id, map.id, '240');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(hdg);
    expect(flight).toBeAlt(28000);
    expect(flight).toBeToAlt(24000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBePos(A1);

    const messages = result.messages;
    expect(messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  multipleTestWithData(['039', '361', '279', '280'], flightLevel => {
    test(`flying FL280 -> FL${flightLevel} ${hdg}`, () => {
      const d0 = 10;
      const hdg = Math.floor(Math.random() * 360 + 1);
      const A1 = flightBuilder()
        .radial(BEACON, d0, hdg + 180)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const cmd = buildDescendCommand(A1.id, map.id, flightLevel);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);

      const flight = result.flight;
      expect(flight).toBe(flight);

      const messages = result.messages;
      expect(messages).toEqual([
        buildInvalidFlightLevelMessage(A1.id, map.id, flightLevel)
      ]);
    });
  });

  test(`wrong atc hdg ${hdg}`, () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildDescendCommand(A1.id, 'PAR', '240');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });

  test('holding short -> FL040', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildDescendCommand(A1.id, map.id, '040');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });
});

describe('Flight should process maintain command', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);

  test(`flying FL280 -> FL280, hdg ${hdg}`, () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildMaintainCommand(A1.id, map.id, '280');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(hdg);
    expect(flight).toBeAlt(28000);
    expect(flight).toBeToAlt(28000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBePos(A1);

    const messages = result.messages;
    expect(messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  multipleTestWithData(['039', '361', '279', '320', '240'], flightLevel => {
    test(`flying FL280 -> FL${flightLevel} ${hdg}`, () => {
      const d0 = 10;
      const hdg = Math.floor(Math.random() * 360 + 1);
      const A1 = flightBuilder()
        .radial(BEACON, d0, hdg + 180)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const cmd = buildMaintainCommand(A1.id, map.id, flightLevel);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);

      const flight = result.flight;
      expect(flight).toBe(flight);

      const messages = result.messages;
      expect(messages).toEqual([
        buildInvalidFlightLevelMessage(A1.id, map.id, flightLevel)
      ]);
    });
  });

  test(`wrong atc hdg ${hdg}`, () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FlightStatus.Flying).flight;

    const cmd = buildMaintainCommand(A1.id, 'PAR', '280');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });

  test('holding short -> FL040', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;


    const cmd = buildMaintainCommand(A1.id, map.id, '040');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);


    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });
});

describe('Flight should process cleared to takeoff command', () => {
  test('holding short -> FL040', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildTakeoffCommand(A1.id, map.id, RUNWAY.id, '040');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBeHdg(RUNWAY.hdg);
    expect(flight).toBeAlt(0);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBePos(A1);

    const messages = result.messages;
    expect(messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
  });

  multipleTestWithData(['039', '361', '279'], flightLevel => {
    test(`flying FL280 -> FL${flightLevel}`, () => {
      const A1 = flightBuilder()
        .pos(RUNWAY)
        .hdg(RUNWAY.hdg)
        .alt(0)
        .toAlt(0)
        .status(FlightStatus.WaitingForTakeoff).flight;

      const cmd = buildTakeoffCommand(A1.id, map.id, RUNWAY.id, flightLevel);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);

      const flight = result.flight;
      expect(flight).toBe(flight);

      const messages = result.messages;
      expect(messages).toEqual([
        buildInvalidFlightLevelMessage(A1.id, map.id, flightLevel)
      ]);
    });
  });

  test(`flying FL040`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(4000)
      .toAlt(4000)
      .from(RUNWAY.id)
      .status(FlightStatus.Flying).flight;

    const cmd = buildTakeoffCommand(A1.id, map.id, RUNWAY.id, '320');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildNotAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });

  test(`wrong atc`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildTakeoffCommand(A1.id, 'PAR', RUNWAY.id, '320');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    const flight = result.flight;
    expect(flight).toBe(flight);

    const messages = result.messages;
    expect(messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });
});
