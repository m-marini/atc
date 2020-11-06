import { NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES } from './modules/Flight';
import { flightBuilder, distance, speedByAlt } from './TestUtil';
import { EVENT_TYPES } from './modules/Events';

const DT = 10; // sec

const RUNWAY = {
  id: 'RUNWAY',
  type: NODE_TYPES.RUNWAY,
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

describe('Flight should process time when aligning right', () => {
  test(`turning PR D(radius) R222 hdg 312`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020, 222)
      .rwy(RUNWAY.id)
      .hdg(312)
      .status(FLIGHT_STATES.ALIGNING)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(342);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.ALIGNING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 342);
    expect(result).toBeRight(true);
    expect(events.length).toBe(0);
  });

  test(`aligned PR D(radius) R12 hdg 102`, () => {

    const A1 = flightBuilder()
      .radial(PR020, R020, 12)
      .rwy(RUNWAY.id)
      .hdg(102)
      .status(FLIGHT_STATES.ALIGNING)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(132);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRight(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(events.length).toBe(0);
  });
});


describe('Flight should process time when aligning left', () => {
  test(`turning PL D(radius) R42 hdg 312`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020, 42)
      .rwy(RUNWAY.id)
      .hdg(312)
      .status(FLIGHT_STATES.ALIGNING)
      .right(false)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(282);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.ALIGNING);
    expect(result).toBeRight(false);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 282);
    expect(events.length).toBe(0);
  });

  test(`aligned PR D(radius) R252 hdg 162`, () => {

    const A1 = flightBuilder()
      .radial(PR020, R020, 252)
      .rwy(RUNWAY.id)
      .hdg(162)
      .status(FLIGHT_STATES.ALIGNING)
      .right(true)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(132);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(result).toBeRight(undefined);
    expect(events.length).toBe(0);
  });
});

describe('Flight should process time when approaching right', () => {
  test(`missing approach too near to PR`, () => {
    const A1 = flightBuilder()
      .radial(PR020, R020 - 0.1, 42)
      .rwy(RUNWAY.id)
      .hdg(282)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(282);
    expect(result).toBeClimbedFrom(2000, DT);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(events).toMatchObject([{
      type: EVENT_TYPES.GO_AROUND_APPROACH,
      flight: result,
      map: map
    }]);
  });

  test(`CR D10 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(314);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(events.length).toBe(0);
  });

  test(`CR D10 R134 hdg 344`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(344)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(314);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(events.length).toBe(0);
  });

  test(`CR D10 R134 hdg 124`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(124)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(94);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 94);
    expect(events.length).toBe(0);
  });

  test(`CR D10 R134 hdg 284`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(284)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(314);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 314);
    expect(events.length).toBe(0);
  });

  test(`CR D10 R134 hdg 144`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 134)
      .rwy(RUNWAY.id)
      .hdg(144)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(174);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 174);
    expect(events.length).toBe(0);
  });

  test(`CR D2 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 2, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(314);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(events.length).toBe(0);
  });

  test(`long junction CR D0.1 R134 hdg 314`, () => {
    const C = mapDao.radial(PR020, 224, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 134)
      .rwy(RUNWAY.id)
      .hdg(314)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(344);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 344);
    expect(result).toBeStatus(FLIGHT_STATES.ALIGNING);
    expect(result).toBeRight(true);
    expect(events.length).toBe(0);
  });

  test(`short junction CR D0.1 R282 hdg 102`, () => {
    const C = mapDao.radial(PR020, 12, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 282)
      .rwy(RUNWAY.id)
      .hdg(102)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(102);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 102);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(events.length).toBe(0);
  });
});

describe('Flight should process time when approaching left', () => {

  test(`missing approach too near TO PL`, () => {
    const A1 = flightBuilder()
      .radial(PL020, R020 - 0.1, 42)
      .rwy(RUNWAY.id)
      .hdg(282)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(282);
    expect(result).toBeClimbedFrom(2000, DT);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(events).toMatchObject([{
      type: EVENT_TYPES.GO_AROUND_APPROACH,
      flight: result,
      map: map
    }]);
  });

  test(`CL D10 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(310);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(events.length).toBe(0);
  });

  test(`CL D10 R130 hdg 340`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(340)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(310);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(events.length).toBe(0);
  });

  test(`CL D10 R130 hdg 120`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(120)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(90);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 90);
    expect(events.length).toBe(0);
  });

  test(`CL D10 R130 hdg 280`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(280)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(310);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 310);
    expect(events.length).toBe(0);
  });

  test(`CL D10 R130 hdg 140`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 10, 130)
      .rwy(RUNWAY.id)
      .hdg(140)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(170);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 170);
    expect(events.length).toBe(0);
  });

  test(`CL D2 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 2, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(310);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), A1.hdg);
    expect(events.length).toBe(0);
  });

  test(`long junction CL D0.1 R130 hdg 310`, () => {
    const C = mapDao.radial(PL020, 40, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 130)
      .rwy(RUNWAY.id)
      .hdg(310)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(280);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 280);
    expect(result).toBeRight(false);
    expect(result).toBeStatus(FLIGHT_STATES.ALIGNING);
    expect(events.length).toBe(0);
  });

  test(`short junction CL D0.1 342 hdg 162`, () => {
    const C = mapDao.radial(PL020, 252, R020);
    const A1 = flightBuilder()
      .radial(C, 0.1, 342)
      .rwy(RUNWAY.id)
      .hdg(162)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(2000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(162);
    expect(result).toBeAlt(2000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 162);
    expect(result).toBeStatus(FLIGHT_STATES.LANDING);
    expect(events.length).toBe(0);
  });
});

describe('Flight should process time when approaching center', () => {
  test(`alt 5000 RW D14 R312 hdg 132`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, 14, 312)
      .rwy(RUNWAY.id)
      .hdg(132)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(5000)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    expect(result).toBeHdg(132);
    expect(result).toBeDescentFrom(5000, DT);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), 132);
    expect(events.length).toBe(0);
  });

  test(`center alt 4458 RW D14 R312 hdg 132`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, 14, 312)
      .rwy(RUNWAY.id)
      .hdg(132)
      .status(FLIGHT_STATES.APPROACHING)
      .alt(4458)
      .toAlt(4000).flight;

    var events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const d = distance(A1.speed, DT);
    const da = d * LANDING_RATE;
    expect(result).toBeHdg(132);
    expect(result).toBeAlt(Math.round(4458 - da), 2);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result).toBeRadial(A1, d, 132);
    expect(events.length).toBe(0);
  });
});
