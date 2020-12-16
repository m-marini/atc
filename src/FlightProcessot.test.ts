import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { FlightStatus } from './modules/Flight';
import {
  flightBuilder, distance, landingAlt, speedByAlt, multipleTest, rndHdg, rndInt, digits
} from './TestUtil';
import { AreaMap, HeadingMapNode, MapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { setMod, SimulationProps, FlightProcessor } from './modules/FlightProcessor';

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
const OM_ALT = Math.round(7 * LANDING_RATE);
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

const BEACON: MapNode = {
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
  nodes: { '13': RUNWAY, 'BEA': BEACON, 'ENT': ENTRY },
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

describe('Null property', () => {
  test(`null heading`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;
    const result = new FlightProcessor(A1, props()).apply(
      setMod('hdg', null)
    );

    expect(result.flight).toBe(A1);
  });

  test(`null speed`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;
    const result = new FlightProcessor(A1, props()).apply(
      setMod('speed', null)
    );

    expect(result.flight).toBe(A1);
  });

  test(`null alt`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;
    const result = new FlightProcessor(A1, props()).apply(
      setMod('alt', null)
    );

    expect(result.flight).toBe(A1);
  });

  test(`null lat`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;
    const result = new FlightProcessor(A1, props()).apply(
      setMod('lat', null)
    );

    expect(result.flight).toBe(A1);
  });

  test(`null lon`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;
    const result = new FlightProcessor(A1, props()).apply(
      setMod('lon', null)
    );

    expect(result.flight).toBe(A1);
  });
});

describe('Flight should compute max approach alt', () => {
  multipleTest(() => {
    const d = rndInt(7, 26);
    const r = rndHdg();

    test(`at OM D${d} R${r}`, () => {
      const A1 = flightBuilder()
        .radial(OM, d, r)
        .hdg(360)
        .alt(4000)
        .toAlt(4000)
        .rwy(RUNWAY.id)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props())
        .maxApproachAlt();
      const v = speedByAlt(4000);
      const descentRate = 1500 * 60 / v;
      const expected = Math.round(descentRate * mapDao.distance(OM, A1) + OM_ALT);
      expect(result).toBe(expected);
    });
  });

  test(`Flight should return outermarker`, () => {
    const A1 = flightBuilder()
      .pos(OM)
      .hdg(360)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props()).outerMarker()

    expect(result).toEqual(OM);
  });
});

test(`Flight should return outermarkerAlt`, () => {
  const A1 = flightBuilder()
    .pos(OM)
    .hdg(360)
    .alt(4000)
    .toAlt(4000)
    .rwy(RUNWAY.id)
    .status(FlightStatus.Flying).flight;

  const result = new FlightProcessor(A1, props())
    .outerMarkerAlt()

  expect(result).toBeCloseTo(OM_ALT);
});

describe('Flight should compute approach distance', () => {
  multipleTest(() => {
    const d = rndInt(7, 26);
    const r = rndHdg();

    test(`at OM D${d} R${r}`, () => {
      const A1 = flightBuilder()
        .radial(OM, d, r)
        .hdg(360)
        .alt(4000)
        .toAlt(4000)
        .rwy(RUNWAY.id)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props())
        .approachDistance()
      expect(result).toBeCloseTo(d + 7, digits(0.05));
    });
  });
});

describe('Flight should compute approach alt', () => {
  multipleTest(() => {
    const d = rndInt(7, 26);
    const r = rndHdg();

    test(`at OM D${d} R${r}`, () => {
      const A1 = flightBuilder()
        .radial(OM, d, r)
        .hdg(360)
        .alt(4000)
        .toAlt(4000)
        .rwy(RUNWAY.id)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props())
        .approachAlt()
      const expected = landingAlt(mapDao.distance(OM, A1) + 7);
      expect(result).toBeCloseTo(expected, digits(1.1));
    });
  });
});

describe('Flight should compute landing alt', () => {
  multipleTest(() => {
    const d = rndInt(1, 70) / 10;
    const r = rndHdg();

    test(`RUNWAY D${d} R${r}`, () => {
      const A1 = flightBuilder()
        .radial(RUNWAY, d, r)
        .hdg(360)
        .alt(4000)
        .toAlt(4000)
        .rwy(RUNWAY.id)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props())
        .landingAlt();
      const expected = Math.round(d * LANDING_RATE);
      expect(result).toBeCloseTo(expected, digits(1.1));
    });
  });
});

describe('Flight should compute junction info', () => {
  test(`approaching from left`, () => {
    const A1 = flightBuilder()
      .radial(OM, 10, 102)
      .hdg(360)
      .alt(2000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .approachJunction();
    const CL = mapDao.radial(PL020, 21, R020)
    expect(result).toEqual({
      sigma: 291,
      entry: CL,
      pivot: PL020,
      right: false
    });
  });

  test(`approaching from right`, () => {
    const A1 = flightBuilder()
      .radial(OM, 10, 162)
      .hdg(360)
      .alt(2000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .approachJunction();
    const CR = mapDao.radial(PR020, 243, R020)
    expect(result).toEqual({
      sigma: 333,
      entry: CR,
      pivot: PR020,
      right: true
    });
  });
});

describe('Flight should process exit', () => {

  test('flying hdg+91', () => {
    const hdg = mapDao.normHdg(ENTRY.hdg + 91);
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(ENTRY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(ENTRY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FlightStatus.Exited);
  });

  test('flying hdg-91', () => {
    const hdg = mapDao.normHdg(ENTRY.hdg - 91);
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(ENTRY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(ENTRY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FlightStatus.Exited);
  });

  test('flying hdg+90', () => {
    const hdg = mapDao.normHdg(ENTRY.hdg + 90);
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(ENTRY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FlightStatus.Flying);
  });

  test('flying hdg-90', () => {
    const hdg = mapDao.normHdg(ENTRY.hdg - 90);
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(ENTRY.id)
      .status(FlightStatus.Flying).flight;

    const result = new FlightProcessor(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FlightStatus.Flying);
  });
});
