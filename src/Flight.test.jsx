import { COMMAND_CONDITIONS, COMMAND_TYPES, NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES } from './modules/Flight';
import { flightBuilder, distance, outerMarker } from './TestUtil';

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

function rndHdg() {
  return Math.floor(Math.random() * 360 + 1);
}

function rndFL() {
  return Math.floor(Math.random() * 9 + 1) * 4000;
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

describe('Flight should process time when holding fix', () => {

  const hdg = rndHdg();
  const holdHdg = rndHdg();
  const radial = rndHdg();
  const len = 120 * 440 / 3600;
  const inbound = 0.1;
  const outbound = len - 0.1;

  test(`flying from fix at inbound hdg ${hdg}, D${inbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(map.center, inbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(holdHdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeFix(map.center);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), holdHdg);
  });

  test(`flying from fix at outbound hdg ${hdg}, D${outbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(map.center, outbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .status(FLIGHT_STATES.HOLDING_FROM).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.normHdg(radial + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(map.center, 2 * len - outbound - ds, radial, 0.05);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO);
  });

  test(`flying to fix at inbound hdg ${hdg}, D${inbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(map.center, inbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .status(FLIGHT_STATES.HOLDING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(holdHdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(map.center, ds - inbound, holdHdg);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
  });

  test(`flying to fix at outbound hdg ${hdg}, D${outbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(map.center, outbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .fix(map.center)
      .status(FLIGHT_STATES.HOLDING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const hdg1 = mapDao.normHdg(radial + 180);
    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeFix(map.center);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO);
  });
});

describe('Flight should process time when holding', () => {

  const hdg = rndHdg();
  const radial = rndHdg();
  const holdHdg = rndHdg();
  const len = 120 * 440 / 3600;
  const inbound = 0.1;
  const outbound = len - 0.1;

  test(`flying to BEACON at outbound hdg ${hdg}, D${outbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, outbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.HOLDING_TO_AT)
      .flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.normHdg(radial + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO_AT);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test(`flying to BEACON at inbound hdg ${hdg}, D${inbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, inbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.HOLDING_TO_AT)
      .flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT)
    const df = ds - 0.1;
    expect(result).toBeHdg(holdHdg);
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
    expect(result).toBeRadial(BEACON, df, holdHdg);
  });

  test(`flying from BEACON at outbound hdg ${hdg}, D${outbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, outbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.HOLDING_FROM_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.normHdg(radial + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO_AT);
    expect(result).toBeRadial(BEACON, 2 * len - outbound - ds, radial, 0.01);
  });

  test(`flying from BEACON at inbound hdg ${hdg}, D${inbound} R${radial}, holdHdg ${holdHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, inbound, radial)
      .hdg(hdg)
      .holdHdg(holdHdg)
      .alt(36000)
      .toAlt(36000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.HOLDING_FROM_AT).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(holdHdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeHoldHdg(holdHdg);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM_AT);
    expect(result).toBeRadial(A1, ds, holdHdg);
  });
});

describe('Flight should process time when flying to', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);
  const fixHdg = Math.floor(Math.random() * 360 + 1);

  test(`BEACON D10 R${fixHdg} heading ${hdg}`, () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(BEACON, d0, fixHdg)
      .hdg(hdg)
      .at(BEACON.id)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const hdg1 = mapDao.normHdg(fixHdg + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
  });

  test(`BEACON D0.1 R${fixHdg} heading ${hdg}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, fixHdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.FLYING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

describe('Flight should process time when flying', () => {
  test('hdg 45', () => {
    const hdg = 45;
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(ENTRY, d0 + distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });

  test('hdg 315 descend', () => {
    const hdg = 315;
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(24000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = d0 + distance(A1.speed, DT);
    expect(result).toBeRadial(ENTRY, d1, hdg);
    expect(result).toBeDescentFrom(28000, DT);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });

  test('hdg 135 climb', () => {
    const hdg = 135;
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(32000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = d0 + distance(A1.speed, DT);
    expect(result).toBeRadial(ENTRY, d1, hdg);
    expect(result).toBeClimbedFrom(28000, DT);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });

  test('hdg 210 climb to 32000', () => {
    const hdg = 210;
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg)
      .hdg(hdg)
      .alt(31900)
      .toAlt(32000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = d0 + distance(A1.speed, DT);
    expect(result).toBeRadial(ENTRY, d1, hdg);
    expect(result).toBeAlt(32000);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });

  test('hdg 250 descend to 24000', () => {
    const hdg = 250;
    const d0 = 10;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg)
      .hdg(hdg)
      .alt(24100)
      .toAlt(24000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = d0 + distance(A1.speed, DT);
    expect(result).toBeRadial(ENTRY, d1, hdg);
    expect(result).toBeAlt(24000);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

describe('Flight should process time when turning to ENTRY', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const alt = rndFL();

  test(`flying ${alt}\' hdg ${hdg} D1.5 R${radial} BEACON`, () => {
    const d0 = 1.5;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.normHdg(radial + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test('before BEACON climb', () => {
    const d0 = 1.5;
    const hdg = 30;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(32000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = distance(A1.speed, DT) - d0;
    expect(result).toBeRadial(BEACON, d1, hdg);
    expect(result).toBeClimbedFrom(28000, DT);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
  });

  test('before BEACON descend', () => {
    const d0 = 1.5;
    const hdg = 30;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(24000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = distance(A1.speed, DT) - d0;
    expect(result).toBeRadial(BEACON, d1, hdg);
    expect(result).toBeDescentFrom(28000, DT);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
  });

  test('before BEACON climb to 320', () => {
    const d0 = 1.5;
    const hdg = 30;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(31900)
      .toAlt(32000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = distance(A1.speed, DT) - d0;
    expect(result).toBeRadial(BEACON, d1, hdg);
    expect(result).toBeAlt(32000);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
  });

  test('before BEACON descend to 240', () => {
    const d0 = 1.5;
    const hdg = 30;
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(24100)
      .toAlt(24000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = distance(A1.speed, DT) - d0;
    expect(result).toBeRadial(BEACON, d1, hdg);
    expect(result).toBeAlt(24000);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
  });

  test(`passing BEACON flying ${alt}\' hdg ${hdg} D0.1 R${radial} BEACON`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.hdg(ENTRY, A1);

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test(`passing BEACON climb hdg ${hdg} D0.1 R${radial}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(28000)
      .toAlt(32000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.hdg(ENTRY, A1);

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg1);
    expect(result).toBeClimbedFrom(28000, DT);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test(`passing BEACON climb 32000' hdg ${hdg} D0.1 R${radial}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(31900)
      .toAlt(32000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(32000);
    expect(result).toBeToAlt(32000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
  });

  test(`passing BEACON descend hdg ${hdg} D0.1 R${radial}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(28000)
      .toAlt(24000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeDescentFrom(28000, DT);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test(`passing BEACON descend 24000' hdg ${hdg} D0.1 R${radial}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(BEACON, d0, radial)
      .hdg(hdg)
      .alt(24100)
      .toAlt(24000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(24000);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
  });
});

describe('Flight should process time when approaching', () => {

  test('at 20 nms', () => {
    const d0 = 20;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .om(RUNWAY)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(4000)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(4000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(RUNWAY, d0 - distance(A1.speed, DT), RUNWAY.hdg + 180);
  });

  test('at 10 nms', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .om(RUNWAY)
      .status(FLIGHT_STATES.APPROACHING)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeApproachAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, ds, RUNWAY.hdg);
  });


  test('at 7.1 nms', () => {
    const d0 = 7.1;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .om(RUNWAY)
      .status(FLIGHT_STATES.APPROACHING)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeLandingAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(A1, ds, RUNWAY.hdg);
  });

  test('at 3nm to OM R+15', () => {
    const hdg = mapDao.normHdg(RUNWAY.hdg + 15);
    const d0 = 3;
    const om = outerMarker(RUNWAY);
    const A1 = flightBuilder()
      .approachRadial(om, d0, hdg + 180)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .om(RUNWAY)
      .approachAlt(10)
      .status(FLIGHT_STATES.APPROACHING)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeApproachAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeOm(RUNWAY);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, ds, hdg);
  });

  test('at 3nm to OM R-15', () => {
    const hdg = mapDao.normHdg(RUNWAY.hdg - 15);
    const d0 = 3;
    const om = outerMarker(RUNWAY);
    const A1 = flightBuilder()
      .approachRadial(om, d0, hdg + 180)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .om(RUNWAY)
      .approachAlt(10)
      .status(FLIGHT_STATES.APPROACHING)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeApproachAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeOm(RUNWAY);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, ds, hdg);
  });


  test('at 0.1nm to OM R+15', () => {
    const hdg = mapDao.normHdg(RUNWAY.hdg + 15);
    const d0 = 0.1;
    const om = outerMarker(RUNWAY);
    const A1 = flightBuilder()
      .approachRadial(om, d0, hdg + 180)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .om(RUNWAY)
      .approachAlt(7.1)
      .status(FLIGHT_STATES.APPROACHING)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    const d1 = d0 + 7 - ds;
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeLandingAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeOm(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(RUNWAY, d1, RUNWAY.hdg + 180);
  });

});

describe('Flight should process time when landing', () => {

  test('at 7 nms', () => {
    const d0 = 7;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeLandingAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(A1, ds, RUNWAY.hdg);
  });

  test('at 0.2 nms', () => {
    const d0 = 0.2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = d0 - distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(0)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeed(0);
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDED);
    expect(result).toBePos(RUNWAY);
  });

  const dhdg = Math.floor(Math.random() * 5 + 1);

  test(`at 5 nms delta ${dhdg}`, () => {
    const d0 = 5;
    const hdg = mapDao.normHdg(RUNWAY.hdg + dhdg);
    const A1 = flightBuilder()
      .radial(RUNWAY, d0, hdg + 180)
      .approachAlt(d0)
      .status(FLIGHT_STATES.LANDING)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const hdg1 = hdg + 1;
    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeLandingAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test(`at 5 nms delta ${-dhdg}`, () => {
    const d0 = 5;
    const hdg = mapDao.normHdg(RUNWAY.hdg - dhdg);
    const A1 = flightBuilder()
      .radial(RUNWAY, d0, hdg + 180)
      .approachAlt(d0)
      .status(FLIGHT_STATES.LANDING)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(4000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const hdg1 = hdg - 1;
    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeLandingAlt(RUNWAY, 2)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(A1, ds, hdg1);
  });

  test('missing runway', () => {
    const d0 = 0.2;
    const A1 = flightBuilder()
      .approachRadial(RUNWAY, d0, RUNWAY.hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000)
      .hdg(RUNWAY.hdg).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const d1 = distance(A1.speed, DT) + d0;
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt()
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(RUNWAY, d1, RUNWAY.hdg)
  });

  test('too high', () => {
    const d0 = 2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .alt(3900)
      .rwy(RUNWAY.id)
      .toAlt(28000)
      .hdg(RUNWAY.hdg).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(4000)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
  });

  test('wrong alignment', () => {
    const d0 = 0.2;
    const hdg = RUNWAY.hdg + 2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
  });

  test('wrong approach +16', () => {
    const d0 = 5;
    const hdg = RUNWAY.hdg + 16;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
  });

  test('wrong approach -16', () => {
    const d0 = 5;
    const hdg = mapDao.normHdg(RUNWAY.hdg - 16);
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
  });
});

describe('Flight should process change flight level command', () => {

  test('flying FL280 -> FL280', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        flightLevel: '280',
        type: COMMAND_TYPES.CHANGE_LEVEL
      }).flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBePos(A1);
  });

  test('flying FL280 -> FL240', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        flightLevel: '240',
        type: COMMAND_TYPES.CHANGE_LEVEL
      }).flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(24000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBePos(A1);
  });

  test('taking off to FL280', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        flightLevel: '280',
        type: COMMAND_TYPES.CHANGE_LEVEL
      }).flightJS;

    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(0);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeFrom(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBePos(A1);
  });

  test('landing', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(28000).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        flightLevel: '080',
        type: COMMAND_TYPES.CHANGE_LEVEL
      }).flightJS;

    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(A1.alt);
    expect(result).toBeToAlt(8000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRunway(undefined);
    expect(result).toBePos(A1);
  });
});

describe('Flight should process turn command', () => {
  test('flying immediate', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.TURN_HEADING,
        when: COMMAND_CONDITIONS.IMMEDIATE,
        to: ENTRY.id
      }).flightJS;

    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id)
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBePos(A1);
  });

  test('flying to at', () => {
    const d0 = 10;
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, d0, hdg)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.TURN_HEADING,
        when: BEACON.id,
        to: ENTRY.id
      }).flightJS;

    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBePos(A1);
  });

  test('waiting for take off', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .alt(0)
      .toAlt(0)
      .speed(0)
      .from(RUNWAY.id)
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.TURN_HEADING,
        when: COMMAND_CONDITIONS.IMMEDIATE,
        to: ENTRY.id
      }).flightJS;

    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(0);
    expect(result).toBeToAlt(0);
    expect(result).toBeSpeed(0);
    expect(result).toBeStatus(FLIGHT_STATES.WAITING_FOR_TAKEOFF);
    expect(result).toBePos(A1);
  });

  test('landing', () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, 7)
      .toAlt(28000).flight;

    const result = new Flight(A1, props())
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.TURN_HEADING,
        when: COMMAND_CONDITIONS.IMMEDIATE,
        to: ENTRY.id
      }).flightJS;

    const hdg1 = mapDao.hdg(ENTRY, A1);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(A1.alt);
    expect(result).toBeToAlt(A1.toAlt);
    expect(result).toBeSpeed(A1.speed);
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBePos(A1);
  });
});


describe('Flight should process clear to land command', () => {
  test('flying', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const d0 = 24;
    const A1 = flightBuilder()
      .radial(RUNWAY, d0, hdg + 180)
      .hdg(hdg)
      .alt(4000)
      .toAlt(4000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props({}))
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.CLEAR_TO_LAND,
        to: RUNWAY.id
      }).flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(4000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeOm(RUNWAY);
    expect(result).toBePos(A1);
  });

  test('too distant', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const d0 = 26;
    const A1 = flightBuilder()
      .radial(RUNWAY, d0, hdg + 180)
      .hdg(hdg)
      .alt(4000)
      .toAlt(4000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props({}))
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.CLEAR_TO_LAND,
        to: RUNWAY.id
      }).flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(4000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRunway(undefined);
    expect(result).toBeOm(undefined);
    expect(result).toBePos(A1);
  });

  test('too high', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const d0 = 20;
    const A1 = flightBuilder()
      .radial(RUNWAY, d0, hdg + 180)
      .hdg(hdg)
      .alt(8000)
      .toAlt(8000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props({}))
      .processCommand({
        flight: A1.id,
        type: COMMAND_TYPES.CLEAR_TO_LAND,
        to: RUNWAY.id
      }).flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(8000);
    expect(result).toBeToAlt(8000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRunway(undefined);
    expect(result).toBeOm(undefined);
    expect(result).toBePos(A1);
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(ENTRY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.EXITED);
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(ENTRY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.EXITED);
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flightJS;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

describe('Flight should process hold command', () => {

  const hdg = rndHdg();
  const radial = rndHdg();

  test('immediate', () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props()).processCommand({
      flight: 'A1',
      type: COMMAND_TYPES.HOLD,
      when: COMMAND_CONDITIONS.IMMEDIATE
    }).flightJS;

    const hdg1 = mapDao.normHdg(hdg + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(hdg1);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeFix(A1);
    expect(result).toBePos(A1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
  });

  test('at BEACON', () => {
    const A1 = flightBuilder()
      .radial(BEACON, 20, radial)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props()).processCommand({
      flight: 'A1',
      type: COMMAND_TYPES.HOLD,
      when: BEACON.id
    }).flightJS;

    const hdg1 = mapDao.normHdg(radial + 180);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeHoldHdg(radial);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBePos(A1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO_AT);
  });
});

