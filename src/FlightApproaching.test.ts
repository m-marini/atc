import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import { buildClimbCommand, buildMissingApproachMessage, buildReadbackMessage } from './modules/Message';
import { distance, flightBuilder, speedByAlt } from './TestUtil';

const DT = 10; // sec

const RUNWAY: HeadingMapNode = {
  id: '13',
  type: MapNodeType.Runway,
  alignment: MapNodeAlignment.N,
  lat: 45,
  lon: 11,
  hdg: 132
};

const OM = mapDao.radial(RUNWAY, RUNWAY.hdg + 180, 7);
const LANDING_RATE = Math.tan(3 * Math.PI / 180) * 1852 / 0.3048;
const V020 = speedByAlt(2000);
const R020 = V020 / 60 / Math.PI;
const PL020 = mapDao.radial(OM, 42, R020);
const PR020 = mapDao.radial(OM, 222, R020);

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

describe('Flight should process time when aligning right', () => {
  test(`turning PR D(radius) R222 hdg 312`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020, 222)
      .rwy(RUNWAY.id)
      .hdg(312)
      .status(FlightStatus.Aligning)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(342);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Aligning);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 342);
    expect(flight).toBeRight(true);
    expect(result.messages).toHaveLength(0);
  });

  test(`aligned PR D(radius) R12 hdg 102`, () => {

    const A1 = flightBuilder()
      .radial(PR020, R020, 12)
      .rwy(RUNWAY.id)
      .hdg(102)
      .status(FlightStatus.Aligning)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(132);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Landing);
    expect(flight).toBeRight(undefined);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(result.messages).toHaveLength(0);
  });
});


describe('Flight should process time when aligning left', () => {
  test(`turning PL D(radius) R42 hdg 312`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020, 42)
      .rwy(RUNWAY.id)
      .hdg(312)
      .status(FlightStatus.Aligning)
      .right(false)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(282);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Aligning);
    expect(flight).toBeRight(false);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 282);
    expect(result.messages).toHaveLength(0);
  });

  test(`aligned PR D(radius) R252 hdg 162`, () => {

    const A1 = flightBuilder()
      .radial(PR020, R020, 252)
      .rwy(RUNWAY.id)
      .hdg(162)
      .status(FlightStatus.Aligning)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(132);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Landing);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(flight).toBeRight(undefined);
    expect(result.messages).toHaveLength(0);
  });
});

describe('Flight should process time when approaching right', () => {
  test(`missing approach too near to PR`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020 - 0.1, 42)
      .rwy(RUNWAY.id)
      .hdg(282)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(282);
    expect(flight).toBeClimbedFrom(2000, DT);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(undefined);
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(result.messages).toEqual([
      buildMissingApproachMessage(A1.id, map.id, '040'),
      buildClimbCommand(A1.id, map.id, '040'),
      buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
    ]);
  });

  test(`CR D10 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(314);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(result.messages).toHaveLength(0);
  });

  test(`CR D10 R134 hdg 344`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(344)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(314);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(result.messages).toHaveLength(0);
  });

  test(`CR D10 R134 hdg 124`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(124)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(94);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 94);
    expect(result.messages).toHaveLength(0);
  });

  test(`CR D10 R134 hdg 284`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(284)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(314);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(result.messages).toHaveLength(0);
  });

  test(`CR D10 R134 hdg 144`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(144)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(174);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 174);
    expect(result.messages).toHaveLength(0);
  });

  test(`CR D2 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 2, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(314);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(result.messages).toHaveLength(0);
  });

  test(`long junction CR D0.1 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(344);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 344);
    expect(flight).toBeStatus(FlightStatus.Aligning);
    expect(flight).toBeRight(true);
    expect(result.messages).toHaveLength(0);
  });

  test(`short junction CR D0.1 R282 hdg 102`, () => {
    const C = mapDao.radial(PR020, 12, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 282)
      .rwy(RUNWAY.id)
      .hdg(102)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(102);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 102);
    expect(flight).toBeStatus(FlightStatus.Landing);
    expect(result.messages).toHaveLength(0);
  });
});

describe('Flight should process time when approaching left', () => {

  test(`missing approach too near TO PL`, () => {
    const A1 = flightBuilder()
      .radial(PL020, R020 - 0.1, 42)
      .rwy(RUNWAY.id)
      .hdg(282)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(282);
    expect(flight).toBeClimbedFrom(2000, DT);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(undefined);
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(result.messages).toEqual([
      buildMissingApproachMessage(A1.id, map.id, '040'),
      buildClimbCommand(A1.id, map.id, '040'),
      buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
    ]);
  });

  test(`CL D10 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(310);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(result.messages).toHaveLength(0);
  });

  test(`CL D10 R130 hdg 340`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(340)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(310);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(result.messages).toHaveLength(0);
  });

  test(`CL D10 R130 hdg 120`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(120)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(90);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 90);
    expect(result.messages).toHaveLength(0);
  });

  test(`CL D10 R130 hdg 280`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(280)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(310);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(result.messages).toHaveLength(0);
  });

  test(`CL D10 R130 hdg 140`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(140)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(170);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 170);
    expect(result.messages).toHaveLength(0);
  });

  test(`CL D2 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 2, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(310);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(result.messages).toHaveLength(0);
  });

  test(`long junction CL D0.1 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(280);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 280);
    expect(flight).toBeRight(false);
    expect(flight).toBeStatus(FlightStatus.Aligning);
    expect(result.messages).toHaveLength(0);
  });

  test(`short junction CL D0.1 342 hdg 162`, () => {
    const C = mapDao.radial(PL020, 252, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 342)
      .rwy(RUNWAY.id)
      .hdg(162)
      .status(FlightStatus.Approaching)
      .alt(2000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(162);
    expect(flight).toBeAlt(2000);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 162);
    expect(flight).toBeStatus(FlightStatus.Landing);
    expect(result.messages).toHaveLength(0);
  });
});

describe('Flight should process time when approaching center', () => {
  test(`alt 5000 RW D14 R312 hdg 132`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, 14, 312)
      .rwy(RUNWAY.id)
      .hdg(132)
      .status(FlightStatus.Approaching)
      .alt(5000)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    expect(flight).toBeHdg(132);
    expect(flight).toBeDescentFrom(5000, DT);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(result.messages).toHaveLength(0);
  });

  test(`center alt 4458 RW D14 R312 hdg 132`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, 14, 312)
      .rwy(RUNWAY.id)
      .hdg(132)
      .status(FlightStatus.Approaching)
      .alt(4458)
      .toAlt(4000).flight;

    const result = new FlightProcessor(A1, props()).processTime();
    const flight = result.flight;

    const d = distance(A1.speed, DT);
    const da = d * LANDING_RATE;
    expect(flight).toBeHdg(132);
    expect(flight).toBeAlt(Math.round(4458 - da), 2);
    expect(flight).toBeToAlt(4000);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeRunway(RUNWAY.id);
    expect(flight).toBeStatus(FlightStatus.Approaching);
    expect(flight).toBeRadial(A1, d, 132);
    expect(result.messages).toHaveLength(0);
  });
});
