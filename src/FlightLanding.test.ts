import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import { buildClimbCommand, buildMissingRunwayMessage, buildPassingFlightLevelMessage, buildReadbackMessage, buildRogerMessage } from './modules/Message';
import { digits, distance, flightBuilder, multipleTest, rndInt, speedByAlt } from './TestUtil';

const DT = 1; // sec

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

describe('Flight should process time when landing', () => {
  multipleTest(() => {
    const d0 = rndInt(10, 38) / 1000;
    test(`at D${d0}`, () => {
      const hdg = RUNWAY.hdg;
      const radial = mapDao.normHdg(hdg + 180);
      const A1 = flightBuilder()
        .radial(RUNWAY, d0, radial)
        .status(FlightStatus.Landing)
        .hdg(hdg)
        .rwy(RUNWAY.id)
        .landingAlt(d0)
        .toAlt(4000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const d1 = d0 - distance(A1.speed, DT);
      expect(flight).toBeHdg(RUNWAY.hdg);
      expect(flight).toBeAlt(0)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeed(0);
      expect(flight).toBeRunway(RUNWAY.id);
      expect(flight).toBeStatus(FlightStatus.Landed);
      expect(flight).toBePos(RUNWAY);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when shifted landing', () => {
  multipleTest(() => {
    const dhdg = rndInt(-1, 2);
    const hdg = RUNWAY.hdg;
    const radial = mapDao.normHdg(hdg + dhdg + 180);
    const d = rndInt(5, 70) / 100;

    test(`D${d} R${radial} delta=${dhdg}`, () => {
      const A1 = flightBuilder()
        .radial(RUNWAY, d, radial)
        .landingAlt(d)
        .status(FlightStatus.Landing)
        .hdg(hdg)
        .rwy(RUNWAY.id)
        .toAlt(4000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const hdg1 = mapDao.hdg(RUNWAY, flight);
      const da = mapDao.normAngle(hdg1 - RUNWAY.hdg);
      expect(da).toBeCloseTo(0, digits(1.1));

      const ds = distance(A1.speed, DT);
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(RUNWAY.id);
      expect(flight).toBeStatus(FlightStatus.Landing);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when missing runway cause altitude', () => {
  multipleTest(() => {
    const alt = rndInt(3976, 4000);
    test(`${alt}'`, () => {
      const d0 = 2;
      const A1 = flightBuilder()
        .approachRunway(RUNWAY, d0)
        .alt(alt)
        .rwy(RUNWAY.id)
        .toAlt(alt)
        .hdg(RUNWAY.hdg).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const ds = distance(A1.speed, DT);
      expect(flight).toBeHdg(RUNWAY.hdg);
      expect(flight).toBeAlt(4000)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, ds, A1.hdg);
      expect(result.messages).toEqual([
        buildMissingRunwayMessage(A1.id, map.id, '040'),
        buildClimbCommand(A1.id, map.id, '040'),
        buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040')),
        buildPassingFlightLevelMessage(A1.id, map.id, '040'),
        buildRogerMessage(map.id, A1.id)
      ]);
    });
  });
});

describe(`Flight should process time when missing runway cause land alignment
  Given a flight touching runway
    And heading turned to more than 3-5 DEG then runway heading
  When time last
  Than should going around for missing runway`, () => {
  multipleTest(() => {
    const d0 = rndInt(10, 37) / 1000;
    const da = rndInt(3, 5);
    const hdg = mapDao.normHdg(RUNWAY.hdg + (Math.random() < 0.5 ? da : -da));
    test(`D${d0} hdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .approachRunway(RUNWAY, d0)
        .hdg(hdg)
        .rwy(RUNWAY.id)
        .toAlt(28000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const ds = distance(A1.speed, DT);
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeClimbedFrom(A1.alt, DT)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, ds, A1.hdg);
      expect(result.messages).toEqual([
        buildMissingRunwayMessage(A1.id, map.id, '040'),
        buildClimbCommand(A1.id, map.id, '040'),
        buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
      ]);
    });
  });
});

describe('Flight should process time when missing runway cause too right', () => {
  multipleTest(() => {
    const radial = mapDao.normHdg(RUNWAY.hdg + 180 - rndInt(46, 90));
    // 0.55 is the minimal distance for 46DEG 
    const d0 = rndInt(55, 89) / 100;
    test(`D${d0}, R${radial}, hdg: ${RUNWAY.hdg}`, () => {
      const A1 = flightBuilder()
        .approachRunway(RUNWAY, d0)
        .radial(RUNWAY, d0, radial)
        .hdg(RUNWAY.hdg)
        .rwy(RUNWAY.id)
        .toAlt(28000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;


      const ds = distance(A1.speed, DT);
      expect(flight).toBeHdg(RUNWAY.hdg);
      expect(flight).toBeClimbedFrom(A1.alt, DT)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, ds, A1.hdg);
      expect(result.messages).toEqual([
        buildMissingRunwayMessage(A1.id, map.id, '040'),
        buildClimbCommand(A1.id, map.id, '040'),
        buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
      ]);
    });
  });
});

describe('Flight should process time when missing runway cause too left', () => {
  multipleTest(() => {
    const radial = mapDao.normHdg(RUNWAY.hdg + 180 + rndInt(46, 90));
    // 0.55 is the minimal distance for 46DEG 
    const d0 = rndInt(55, 89) / 100;
    test(`D${d0}, R${radial}, hdg: ${RUNWAY.hdg}`, () => {
      const A1 = flightBuilder()
        .approachRunway(RUNWAY, d0)
        .radial(RUNWAY, d0, radial)
        .hdg(RUNWAY.hdg)
        .rwy(RUNWAY.id)
        .toAlt(28000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const ds = distance(A1.speed, DT);
      expect(flight).toBeHdg(RUNWAY.hdg);
      expect(flight).toBeClimbedFrom(A1.alt, DT)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, ds, A1.hdg);
      expect(result.messages).toEqual([
        buildMissingRunwayMessage(A1.id, map.id, '040'),
        buildClimbCommand(A1.id, map.id, '040'),
        buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
      ]);
    });
  });
});

describe('Flight should process time when missing runway cause flying away', () => {
  multipleTest(() => {
    const hdg = mapDao.normHdg(RUNWAY.hdg + 180 + rndInt(-89, 90));
    const d0 = 0.1;
    test(`D${d0}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .approachRunway(RUNWAY, d0)
        .hdg(hdg)
        .rwy(RUNWAY.id)
        .toAlt(28000).flight;

      const result = new FlightProcessor(A1, props()).processTime();
      const flight = result.flight;

      const ds = distance(A1.speed, DT);
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeClimbedFrom(A1.alt, DT)
      expect(flight).toBeToAlt(4000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRunway(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, ds, A1.hdg);
      expect(result.messages).toEqual([
        buildMissingRunwayMessage(A1.id, map.id, '040'),
        buildClimbCommand(A1.id, map.id, '040'),
        buildReadbackMessage(buildClimbCommand(A1.id, map.id, '040'))
        ]);
    });
  });
});
