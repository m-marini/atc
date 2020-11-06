import { NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES } from './modules/Flight';
import { flightBuilder, distance, turnedHdg, multipleTest, turnedRight } from './TestUtil';

const DT = 10; // sec

const RUNWAY = {
  id: 'RUNWAY',
  type: NODE_TYPES.RUNWAY,
  lat: 45,
  lon: 11,
  hdg: 132
};

const ENTRY = {
  id: 'ENTRY',
  type: NODE_TYPES.ENTRY,
  lat: 46,
  lon: 10,
  hdg: 132
};

const BEACON = {
  id: 'BEACON',
  type: NODE_TYPES.BEACON,
  lat: 44,
  lon: 9
};

const map = {
  id: 'LRX',
  name: 'Lamarx',
  nodes: { RUNWAY, BEACON, ENTRY },
  center: {
    lat: 45,
    lon: 10
  }
};

function rndFloat(from, to) {
  return Math.random() * (to - from) + from;
}

function rndInt(from, to) {
  if (to === undefined) {
    to = from;
    from = 0;
  }
  return Math.floor(rndFloat(from, to));
}

function rndHdg() {
  return rndInt(1, 361);
}


function props(props = {}, withMessages) {
  if (!withMessages) {
    return _.defaults({}, props, {
      dt: DT,
      map: map
    }, TRAFFIC_SIM_DEFAULTS);
  } else {
    return _.defaults({}, props, {
      dt: DT,
      map: map,
      sendMessage: msg => { console.log(msg); }
    }, TRAFFIC_SIM_DEFAULTS);
  }
}

/**
 * Given a flight holding at fix point
 *   and flying to fix point near it
 * When passing fix point
 * Then should change the state to HOLDING_FROM
 *   and start loop timer
 */
multipleTest('Flight should process time when holding and passing fix point', () => {
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
      .status(FLIGHT_STATES.HOLDING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeLoopTimer(120);
    expect(result).toBeFix(map.center);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
  });
});

/**
 * Given a flight holding at fix point
 *   and flying to fix point faraway it
 * When computing next status by time
 * Then should turn to fix point
 */
multipleTest('Flight should process time when holding and flying to fix faraway from it', () => {
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
      .status(FLIGHT_STATES.HOLDING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const hdg1 = turnedHdg(hdg, mapDao.normHdg(radial + 180), DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO);
  });
});

/**
 * Given a flight holding at fix point
 *   and flying from the fix point
 * When computing next status by time
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
multipleTest('Flight should process time when holding and flying from fit', () => {

  const hdg = rndHdg();
  const holdHdg = mapDao.normHdg(hdg + 180);

  test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .loopTimer(120)
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedRight(hdg, holdHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeLoopTimer(110);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
  });
});

/**
 * Given a flight holding at fix point
 *   and turning from the fix point to hold heading
 * When completing turn
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
multipleTest('Flight should process time when holding from fix at complete turn to outbound track', () => {

  const hdg = rndHdg();
  const holdHdg = mapDao.normHdg(hdg + rndInt(0, 30));

  test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .loopTimer(120)
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(holdHdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeLoopTimer(110);
    expect(result).toBeRadial(A1, ds, holdHdg);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
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
multipleTest('Flight should process time when holding and flying from fix point before loop timeout', () => {

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
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(hdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeLoopTimer(110);
    expect(result).toBeRadial(A1, ds, hdg);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
  });
});

/**
 * Given a flight holding at fix point
 *   and flying from the fix point
 *   and triggering loopTimer
 * When timeout loopTimer
 * Then should turn right to fix point
 */
multipleTest('Flight should process time when holding and flying from fix point after loop timeout', () => {

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
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedRight(hdg, mapDao.normHdg(hdg + 180), DT)
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(hdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO);
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying to BEACON
 * When passing BEACON
 * Then should change the state to HOLDING_FROM_AT
 *   and start loop timer
 */
multipleTest('Flight should process time when holding and passing BEACON', () => {
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
      .status(FLIGHT_STATES.HOLDING_TO_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeLoopTimer(120);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
  });
});


/**
 * Given a flight holding at BEACON
 *   and flying to BEACON faraway it
 * When computing next status by time
 * Then should turn to BEACON
 */
multipleTest('Flight should process time when holding and flying to BEACON faraway from it', () => {
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
      .status(FLIGHT_STATES.HOLDING_TO_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const hdg1 = turnedHdg(hdg, mapDao.normHdg(radial + 180), DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO_AT);
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying from the BEACON
 * When computing next status by time
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
multipleTest('Flight should process time when holding and flying from BEACON', () => {

  const hdg = rndHdg();
  const holdHdg = mapDao.normHdg(hdg + 180);

  test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .at(BEACON)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .loopTimer(120)
      .status(FLIGHT_STATES.HOLDING_FROM_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedRight(hdg, holdHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeLoopTimer(110);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
  });
});

/**
 * Given a flight holding at BEACON
 *   and turning from the BEACON to hold heading
 * When completing turn
 * Then should turn right to holding heading
 *   and should decrement loop timer
 */
multipleTest('Flight should process time when holding from BEACON at complete turn to outbound track', () => {

  const hdg = rndHdg();
  const holdHdg = mapDao.normHdg(hdg + rndInt(0, 30));

  test(`hdg ${hdg}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .at(BEACON)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .loopTimer(120)
      .status(FLIGHT_STATES.HOLDING_FROM_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(holdHdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeLoopTimer(110);
    expect(result).toBeRadial(A1, ds, holdHdg);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
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
multipleTest('Flight should process time when holding and flying from BEACON before loop timeout', () => {

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
      .status(FLIGHT_STATES.HOLDING_FROM_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(hdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeLoopTimer(110);
    expect(result).toBeRadial(A1, ds, hdg);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
  });
});

/**
 * Given a flight holding at BEACON
 *   and flying from the BEACON
 *   and triggering loopTimer
 * When timeout loopTimer
 * Then should turn right to BEACON
 */
multipleTest('Flight should process time when holding and flying from BEACON after loop timeout', () => {

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
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedRight(hdg, mapDao.normHdg(hdg + 180), DT)
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(hdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO);
  });
});
