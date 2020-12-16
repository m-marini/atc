import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import { distance, flightBuilder, multipleTest, rndHdg, rndInt, turnedHdg, turnedRight } from './TestUtil';

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
  jetProb: 0.5,
  level: {
    id: '',
    name: '',
    maxPlane: 1,
    flightFreq: 0
  },
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

/**
 * 
 */
describe(`Flight should process time when holding and passing fix point
  Given a flight holding at fix point
    and flying to fix point near it
  When passing fix point
  Then should change the state to HOLDING_FROM
    and start loop timer`, () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const oppHdg = mapDao.normHdg(hdg + 180);
    const holdHdg = rndHdg();
    const near = 0.1;

    test(`D${near} R${oppHdg}, hdg: ${hdg}, holdHdg: ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .radial(map.center, near, oppHdg)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .status(FlightStatus.HoldingTo).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg);
      expect(flight).toBeLoopTimer(120);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeStatus(FlightStatus.HoldingFrom);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * 
 */
describe(`Flight should process time when holding and flying to fix faraway from it
  Given a flight holding at fix point
    and flying to fix point faraway it
  When computing next status by time
  Then should turn to fix point`, () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const holdHdg = rndHdg();
    const d = rndInt(5, 20);

    test(`D${d} R${radial}, hdg: ${hdg}, holdHdg: ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .radial(map.center, d, radial)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .status(FlightStatus.HoldingTo).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const hdg1 = turnedHdg(hdg, mapDao.normHdg(radial + 180), DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg1);
      expect(flight).toBeStatus(FlightStatus.HoldingTo);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at fix point
 *   and flying from the fix point
 * When computing next status by time
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
describe('Flight should process time when holding and flying from fit', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const holdHdg = mapDao.normHdg(hdg + 180);

    test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .loopTimer(120)
        .status(FlightStatus.HoldingFrom).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedRight(hdg, holdHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeStatus(FlightStatus.HoldingFrom);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at fix point
 *   and turning from the fix point to hold heading
 * When completing turn
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
describe('Flight should process time when holding from fix at complete turn to outbound track', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const holdHdg = mapDao.normHdg(hdg + rndInt(0, 30));

    test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .pos(map.center)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .loopTimer(120)
        .status(FlightStatus.HoldingFrom).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(holdHdg);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeRadial(A1, ds, holdHdg);
      expect(flight).toBeStatus(FlightStatus.HoldingFrom);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at fix point
 *   and flying from the fix point
 *   and before loop timeout
 * When computing next status by time
 * Then should turn right to fix point
 *   and should decrement loop timer
 */
describe('Flight should process time when holding and flying from fix point before loop timeout', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const d = rndInt(5, 10);

    test(`D{d} hdg ${hdg}, holdHdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(map.center, d, hdg + 180)
        .hdg(hdg)
        .holdHdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .loopTimer(120)
        .status(FlightStatus.HoldingFrom).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(hdg);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeRadial(A1, ds, hdg);
      expect(flight).toBeStatus(FlightStatus.HoldingFrom);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at fix point
 *   and flying from the fix point
 *   and triggering loopTimer
 * When timeout loopTimer
 * Then should turn right to fix point
 */
describe(`Flight should process time when holding and flying from fix point after loop timeout
  Given a flight holding at fix point
    and flying from the fix point
    and triggering loopTimer
  When timeout loopTimer
  Then should turn right to fix point`, () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const d = rndInt(5, 10);

    test(`D${d} hdg ${hdg}, holdHdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(map.center, d, hdg + 180)
        .hdg(hdg)
        .holdHdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .fix(map.center)
        .loopTimer(0)
        .status(FlightStatus.HoldingFrom).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedRight(hdg, mapDao.normHdg(hdg + 180), DT)
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(hdg);
      expect(flight).toBeFix(map.center);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeStatus(FlightStatus.HoldingTo);
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying to BEACON
 * When passing BEACON
 * Then should change the state to HOLDING_FROM_AT
 *   and start loop timer
 */
describe('Flight should process time when holding and passing BEACON', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const oppHdg = mapDao.normHdg(hdg + 180);
    const holdHdg = rndHdg();
    const near = 0.1;

    test(`D${near} R${oppHdg}, hdg: ${hdg}, holdHdg: ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, near, oppHdg)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .status(FlightStatus.HoldingToAt).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg);
      expect(flight).toBeLoopTimer(120);
      expect(flight).toBeStatus(FlightStatus.HoldingFromAt);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying to BEACON faraway it
 * When computing next status by time
 * Then should turn to BEACON
 */
describe('Flight should process time when holding and flying to BEACON faraway from it', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    const radial = rndHdg();
    const holdHdg = rndHdg();
    const d = rndInt(5, 20);

    test(`D${d} R${radial}, hdg: ${hdg}, holdHdg: ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, radial)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .status(FlightStatus.HoldingToAt).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const hdg1 = turnedHdg(hdg, mapDao.normHdg(radial + 180), DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, distance(A1.speed, DT), hdg1);
      expect(flight).toBeStatus(FlightStatus.HoldingToAt);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying from the BEACON
 * When computing next status by time
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
describe('Flight should process time when holding and flying from BEACON', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const holdHdg = mapDao.normHdg(hdg + 180);

    test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .at(BEACON.id)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .loopTimer(120)
        .status(FlightStatus.HoldingFromAt).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedRight(hdg, holdHdg, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeStatus(FlightStatus.HoldingFromAt);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and turning from the BEACON to hold heading
 * When completing turn
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
describe('Flight should process time when holding from BEACON at complete turn to outbound track', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const holdHdg = mapDao.normHdg(hdg + rndInt(0, 30));

    test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
      const A1 = flightBuilder()
        .pos(BEACON)
        .hdg(hdg)
        .holdHdg(holdHdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .loopTimer(120)
        .status(FlightStatus.HoldingFromAt).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(holdHdg);
      expect(flight).toBeHoldHdg(holdHdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeRadial(A1, ds, holdHdg);
      expect(flight).toBeStatus(FlightStatus.HoldingFromAt);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying from the fBEACON
 *   and before loop timeout
 * When computing next status by time
 * Then should fly to 
 *   and should decrement loop timer
 */
describe('Flight should process time when holding and flying from BEACON before loop timeout', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const d = rndInt(5, 10);

    test(`D{d} hdg ${hdg}, holdHdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, hdg + 180)
        .hdg(hdg)
        .holdHdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .loopTimer(120)
        .status(FlightStatus.HoldingFromAt).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const flight = result.flight;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeHoldHdg(hdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeLoopTimer(110);
      expect(flight).toBeRadial(A1, ds, hdg);
      expect(flight).toBeStatus(FlightStatus.HoldingFromAt);
      expect(result.messages).toHaveLength(0);
    });
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying from the BEACON
 *   and triggering loopTimer
 * When timeout loopTimer
 * Then should turn right to BEACON
 */
describe('Flight should process time when holding and flying from BEACON after loop timeout', () => {
  multipleTest(() => {

    const hdg = rndHdg();
    const d = rndInt(5, 10);

    test(`D${d} hdg ${hdg}, holdHdg ${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, d, hdg + 180)
        .hdg(hdg)
        .holdHdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .at(BEACON.id)
        .loopTimer(0)
        .status(FlightStatus.HoldingFrom).flight;

      const result = new FlightProcessor(A1, props()).processTime();

      const ds = distance(A1.speed, DT);
      const hdg1 = turnedRight(hdg, mapDao.normHdg(hdg + 180), DT)
      const flight = result.flight;
      expect(flight).toBeHdg(hdg1);
      expect(flight).toBeHoldHdg(hdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeAlt(36000);
      expect(flight).toBeToAlt(36000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeRadial(A1, ds, hdg1);
      expect(flight).toBeStatus(FlightStatus.HoldingTo);
      expect(result.messages).toHaveLength(0);
    });
  });
});
