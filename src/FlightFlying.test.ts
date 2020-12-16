import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import {  buildClearedToMessage,  buildFlyingToMessage, buildPassingFlightLevelMessage, buildRogerMessage, } from './modules/Message';
import { distance, flightBuilder, multipleTest, rndFL, rndHdg, rndInt, rndMidFL, turnedHdg } from './TestUtil';

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

describe(`Flight should process time when large turning to BEACON
  Given a flight flying 5-10 nms from beacon
    And a random heading opposite the beacon within +-30 DEG
  When time last
  Then the flight should have turned directly to beacon
`, () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const maxa = DT * 3;
    const da = rndInt(-maxa, maxa + 1);
    const radial = mapDao.normHdg(hdg + da);
    const dist = rndInt(5, 10);

    test(`D${dist} R${radial} hdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, dist, radial)
        .hdg(hdg)
        .at(BEACON.id)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.FlyingTo).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const flight = result.flight;
      const hdg1 = turnedHdg(hdg, radial + 180, DT);
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(28000);
      expect(flight).toBeToAlt(28000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg1);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe(`Flight should process time when passing BEACON during large turn
  Given a flight flying 0.4-1 nms from beacon
    And a random heading opposite the beacon within +-30 DEG
  When time last
  Then the flight should have turned directly to beacon`, () => {
  multipleTest(() => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const maxa = DT * 3;
    const da = mapDao.normAngle(rndInt(-maxa, maxa + 1));
    const r = mapDao.normHdg(hdg + da);
    const d = rndInt(1, 4) / 10;

    test(`D${d} R${r} hdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, r)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .at(BEACON.id)
        .status(FlightStatus.FlyingTo).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const hdg1 = turnedHdg(hdg, r + 180, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(28000);
      expect(flight).toBeToAlt(28000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(undefined);
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg1);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when flying', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    test(`hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeAlt(28000);
      expect(flight).toBeToAlt(28000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when flying descending', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(500, 4000);
    test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const d = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeDescentFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, d, hdg);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when flying climbing', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(500, 4000);

    test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const d = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeClimbedFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(flight).toBeRadial(A1, d, hdg);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when flying climbing and passing FL', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(1, 100);

    test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
      const hdg = 210;
      const d0 = 10;
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .status(FlightStatus.Flying).flight;
      const result = new FlightProcessor(A1, props()).processTime();

      const d = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeRadial(A1, d, hdg);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id)
      ])
    });
  });
});

describe('Flight should process time when flying descending and passing FL', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(1, 100);

    test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
      const hdg = 210;
      const d0 = 10;
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .status(FlightStatus.Flying).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const d = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeRadial(A1, d, hdg);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id)
      ])
    });
  });
});

describe('Flight should process time when turning faraway to ENTRY via BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toHdg = rndHdg();
    const radial = mapDao.normHdg(toHdg + 180);
    const alt = rndFL();
    const d = rndInt(5, 70);

    test(`D${d} R${radial}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(alt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedHdg(hdg, toHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(alt);
      expect(flight).toBeToAlt(alt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when turning faraway climbing to ENTRY via BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toHdg = rndHdg();
    const radial = mapDao.normHdg(toHdg + 180);
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(500, 4000);
    const d = rndInt(5, 70);

    test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedHdg(hdg, toHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeClimbedFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when turning faraway descending to ENTRY via BEACON ', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toHdg = rndHdg();
    const radial = mapDao.normHdg(toHdg + 180);
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(500, 4000);
    const d = rndInt(5, 70);

    test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedHdg(hdg, toHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeDescentFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toHaveLength(0);
    });
  });
});

describe('Flight should process time when turning faraway climbing and passing FL to ENTRY via BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toHdg = rndHdg();
    const radial = mapDao.normHdg(toHdg + 180);
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(1, 100);
    const d = rndInt(5, 70);

    test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedHdg(hdg, toHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id)
      ]);
    });
  });
});

describe('Flight should process time when turning faraway descending and passing FL to ENTRY via BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const toHdg = rndHdg();
    const radial = mapDao.normHdg(toHdg + 180);
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(1, 100);
    const d = rndInt(5, 70);

    test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedHdg(hdg, toHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id)
      ]);
    });
  });
});

describe('Flight should process time when turning passing BEACON to ENTRY via BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const alt = rndFL();
    const d = rndInt(1, 5) / 10;
    const toHdg = mapDao.hdg(ENTRY, BEACON);

    test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(alt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const ds = distance(A1.speed, DT);

      const result = new FlightProcessor(A1, props()).processTime();

      const toHdg = mapDao.hdg(BEACON, A1);
      const hdg1 = turnedHdg(hdg, toHdg, DT);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(alt);
      expect(flight).toBeToAlt(alt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(ENTRY.id);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildFlyingToMessage(flight, map.id),
        buildClearedToMessage(map.id, flight.id, ENTRY.id)
      ]);
    });
  });
});

describe('Flight should process time when turning climbing to ENTRY via BEACON passing BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(500, 4000);
    const d = rndInt(1, 5) / 10;
    const toHdg = mapDao.hdg(ENTRY, BEACON);

    test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const ds = distance(A1.speed, DT);

      const result = new FlightProcessor(A1, props()).processTime();

      const toHdg = mapDao.hdg(BEACON, A1);
      const hdg1 = turnedHdg(hdg, toHdg, DT);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeClimbedFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(ENTRY.id);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildFlyingToMessage(flight, map.id),
        buildClearedToMessage(map.id, flight.id, ENTRY.id)
      ]);
    });
  });
});

describe('Flight should process time when turning descending to ENTRY via BEACON passing BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(500, 4000);
    const d = rndInt(1, 5) / 10;
    const toHdg = mapDao.hdg(ENTRY, BEACON);

    test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const ds = distance(A1.speed, DT);

      const result = new FlightProcessor(A1, props()).processTime();

      const toHdg = mapDao.hdg(BEACON, A1);
      const hdg1 = turnedHdg(hdg, toHdg, DT);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeDescentFrom(alt, DT);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(ENTRY.id);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildFlyingToMessage(flight, map.id),
        buildClearedToMessage(map.id, flight.id, ENTRY.id)
      ]);
    });
  });
});

describe('Flight should process time when turning descending and passing FL to ENTRY via BEACON passing BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt + rndInt(1, 100);
    const d = rndInt(1, 5) / 10;
    const toHdg = mapDao.hdg(ENTRY, BEACON);

    test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const ds = distance(A1.speed, DT);

      const result = new FlightProcessor(A1, props()).processTime();

      const toHdg = mapDao.hdg(BEACON, A1);
      const hdg1 = turnedHdg(hdg, toHdg, DT);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(ENTRY.id);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id),
        buildFlyingToMessage(flight, map.id),
        buildClearedToMessage(map.id, flight.id, ENTRY.id)
      ]);
    });
  });
});

describe('Flight should process time when turning climbing and passing FL to ENTRY via BEACON passing BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const toAlt = rndMidFL();
    const alt = toAlt - rndInt(1, 100);
    const d = rndInt(1, 5) / 10;
    const toHdg = mapDao.hdg(ENTRY, BEACON);

    test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .alt(alt)
        .toAlt(toAlt)
        .turnTo(ENTRY.id)
        .at(BEACON.id)
        .status(FlightStatus.Turning).flight;

      const ds = distance(A1.speed, DT);

      const result = new FlightProcessor(A1, props()).processTime();

      const toHdg = mapDao.hdg(BEACON, A1);
      const hdg1 = turnedHdg(hdg, toHdg, DT);

      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeAlt(toAlt);
      expect(flight).toBeToAlt(toAlt);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeAt(ENTRY.id);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.FlyingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(flight.id, map.id, toAlt),
        buildRogerMessage(map.id, flight.id),
        buildFlyingToMessage(flight, map.id),
        buildClearedToMessage(map.id, flight.id, ENTRY.id)
      ]);
    });
  });
});
