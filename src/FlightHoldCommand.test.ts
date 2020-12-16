import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { SimulationProps, FlightProcessor } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import {
  buildATCNotFoundMessage, buildAtGroundMessage, buildBeaconNotFoundMessage,
  buildHoldCommand, buildReadbackMessage
} from './modules/Message';
import { flightBuilder, multipleTest, rndFL, rndHdg, rndInt } from './TestUtil';

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

describe('Flight should process hold command', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const alt = rndFL();
    const d = rndInt(5, 40);
    const radial = rndHdg();

    test(`immediate ${alt}' hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(alt)
        .toAlt(alt)
        .status(FlightStatus.Flying).flight;

      const cmd = buildHoldCommand(A1.id, map.id);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);
      const flight = result.flight;

      const hdg1 = mapDao.normHdg(hdg + 180);
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(hdg1);
      expect(flight).toBeAlt(alt);
      expect(flight).toBeToAlt(alt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeFix(A1);
      expect(flight).toBePos(A1);
      expect(flight).toBeStatus(FlightStatus.HoldingFrom);

      expect(result.messages).toEqual([
        buildReadbackMessage(cmd)
      ]);
    });

    test(`at beacon D${d} R${radial} ${alt}' hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(alt)
        .status(FlightStatus.Flying).flight;

      const cmd = buildHoldCommand(A1.id, map.id, BEACON.id);
      const result = new FlightProcessor(A1, props()).processCommand(cmd);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(radial);
      expect(flight).toBeAlt(alt);
      expect(flight).toBeToAlt(alt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBePos(A1);
      expect(flight).toBeStatus(FlightStatus.HoldingToAt);
      expect(result.messages).toEqual([
        buildReadbackMessage(cmd)
      ]);
    });
  });
});

describe('Flight should process hold command', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const d = rndInt(5, 40);
  const alt = rndFL();

  test(`wrong atc D${d} R${radial} ${alt}' hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .status(FlightStatus.Flying).flight;

    const cmd = buildHoldCommand(A1.id, 'PAR', BEACON.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildATCNotFoundMessage(A1.id, 'PAR')
    ]);
  });

  test(`wrong beacon D${d} R${radial} ${alt}' hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .status(FlightStatus.Flying).flight;

    const cmd = buildHoldCommand(A1.id, map.id, 'BHO');
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildBeaconNotFoundMessage(A1.id, map.id, 'BHO')
    ]);
  });

  test(`holding short`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;

    const cmd = buildHoldCommand(A1.id, map.id, ENTRY.id);
    const result = new FlightProcessor(A1, props()).processCommand(cmd);

    expect(result.flight).toBe(A1);
    expect(result.messages).toEqual([
      buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
    ]);
  });
});
