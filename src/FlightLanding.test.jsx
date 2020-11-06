import { NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES } from './modules/Flight';
import { flightBuilder, distance, multipleTest, rndInt, digits, } from './TestUtil';
import { EVENT_TYPES } from './modules/Events';

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

describe('Flight should process time when landing', () => {
  test('at D0.2', () => {
    const d0 = 0.2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEven: ev => events.push(ev) }))
      .processTime().flight;

    const d1 = d0 - distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(0)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeed(0);
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDED);
    expect(result).toBePos(RUNWAY);
  });
});

multipleTest('Flight should process time when landing shifted', () => {
  //  const dhdg = rndInt(-5, 6);
  const dhdg = rndInt(-1, 2);
  const hdg = RUNWAY.hdg;
  const radial = mapDao.normHdg(hdg + dhdg + 180);
  const d = rndInt(5, 70) / 10;

  test(`D${d} R${radial} delta=${dhdg}`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, d, radial)
      .landingAlt(d)
      .status(FLIGHT_STATES.LANDING)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(4000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEven: ev => events.push(ev) }))
      .processTime().flight;

    const hdg1 = mapDao.hdg(RUNWAY, result);
    const da = mapDao.normAngle(hdg1 - RUNWAY.hdg);
    expect(da).toBeCloseTo(0, digits(1.1));

    const ds = distance(A1.speed, DT);
    //    expect(result).toBeLandingAlt(RUNWAY, d - ds, 1);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(events).toHaveLength(0);
  });
});

multipleTest('Flight should process time when missing runway cause altitude', () => {
  const alt = rndInt(3900, 4000);
  test(`${alt}'`, () => {
    const d0 = 2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .alt(alt)
      .rwy(RUNWAY.id)
      .toAlt(alt)
      .hdg(RUNWAY.hdg).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeAlt(4000)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: EVENT_TYPES.GO_AROUND_RUNWAY,
      flight: { id: A1.id },
      map
    });
    expect(events[1]).toMatchObject({
      type: EVENT_TYPES.PASSING,
      flight: result,
      map
    });
  });
});

multipleTest('Flight should process time when missing runway cause land alignment', () => {
  const d0 = 0.2;
  const da = rndInt(3, 5);
  const hdg = mapDao.normHdg(RUNWAY.hdg + (Math.random() < 0.5 ? da : -da));
  test(`hdg ${hdg}`, () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
    expect(events).toEqual([{
      type: EVENT_TYPES.GO_AROUND_RUNWAY,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when missing runway cause too right', () => {
  const radial = mapDao.normHdg(RUNWAY.hdg + 180 - rndInt(46, 90));
  const d0 = rndInt(50, 89) / 100;
  test(`D${d0}, R${radial}, hdg: ${RUNWAY.hdg}`, () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .radial(RUNWAY, d0, radial)
      .hdg(RUNWAY.hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
    expect(events).toEqual([{
      type: EVENT_TYPES.GO_AROUND_RUNWAY,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when missing runway cause too left', () => {
  const radial = mapDao.normHdg(RUNWAY.hdg + 180 + rndInt(47, 90));
  const d0 = rndInt(50, 89) / 100;
  test(`D${d0}, R${radial}, hdg: ${RUNWAY.hdg}`, () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .radial(RUNWAY, d0, radial)
      .hdg(RUNWAY.hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(RUNWAY.hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
    expect(events).toEqual([{
      type: EVENT_TYPES.GO_AROUND_RUNWAY,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when missing runway cause flying away', () => {
  const hdg = mapDao.normHdg(RUNWAY.hdg + 180 + rndInt(-89, 90));
  const d0 = 0.1;
  test(`D${d0}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .hdg(hdg)
      .rwy(RUNWAY.id)
      .toAlt(28000).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    expect(result).toBeHdg(hdg);
    expect(result).toBeClimbedFrom(A1.alt, DT)
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, ds, A1.hdg);
    expect(events).toEqual([{
      type: EVENT_TYPES.GO_AROUND_RUNWAY,
      flight: result,
      map
    }]);
  });
}, 1);
