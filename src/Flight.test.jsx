import { COMMAND_CONDITIONS, COMMAND_TYPES, NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES, Modifier } from './modules/Flight';
import { flightBuilder, distance, landingAlt, speedByAlt, multipleTest, rndHdg, rndFL, rndInt, digits } from './TestUtil';
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

describe('Null property', () => {
  test(`null heading`, () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(4000)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING).flight;
    const result = new Flight(A1, props()).apply(
      Modifier.set('hdg', null)
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
      .status(FLIGHT_STATES.FLYING).flight;
    const result = new Flight(A1, props()).apply(
      Modifier.set('speed', null)
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
      .status(FLIGHT_STATES.FLYING).flight;
    const result = new Flight(A1, props()).apply(
      Modifier.set('alt', null)
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
      .status(FLIGHT_STATES.FLYING).flight;
    const result = new Flight(A1, props()).apply(
      Modifier.set('lat', null)
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
      .status(FLIGHT_STATES.FLYING).flight;
    const result = new Flight(A1, props()).apply(
      Modifier.set('lon', null)
    );

    expect(result.flight).toBe(A1);
  });
});

multipleTest('Flight should compute max approach alt', () => {
  const d = rndInt(7, 26);
  const r = rndHdg();

  test(`at OM D${d} R${r}`, () => {
    const A1 = flightBuilder()
      .radial(OM, d, r)
      .hdg(360)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .maxApproachAlt();
    const v = speedByAlt(4000);
    const descentRate = 1500 * 60 / v;
    const expected = Math.round(descentRate * mapDao.distance(OM, A1) + OM_ALT);
    expect(result).toBe(expected);
  });
});

test(`Flight should return outermarker`, () => {
  const A1 = flightBuilder()
    .at(OM)
    .hdg(360)
    .alt(4000)
    .toAlt(4000)
    .rwy(RUNWAY.id)
    .status(FLIGHT_STATES.FLYING).flight;

  const result = new Flight(A1, props())
    .outerMarker()

  expect(result).toEqual(OM);
});

test(`Flight should return outermarkerAlt`, () => {
  const A1 = flightBuilder()
    .radial(OM)
    .hdg(360)
    .alt(4000)
    .toAlt(4000)
    .rwy(RUNWAY.id)
    .status(FLIGHT_STATES.FLYING).flight;

  const result = new Flight(A1, props())
    .outerMarkerAlt()

  expect(result).toBeCloseTo(OM_ALT);
});

multipleTest('Flight should compute approach distance', () => {
  const d = rndInt(7, 26);
  const r = rndHdg();

  test(`at OM D${d} R${r}`, () => {
    const A1 = flightBuilder()
      .radial(OM, d, r)
      .hdg(360)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .approachDistance()
    expect(result).toBeCloseTo(d + 7, digits(0.05));
  });
});

multipleTest('Flight should compute approach alt', () => {
  const d = rndInt(7, 26);
  const r = rndHdg();

  test(`at OM D${d} R${r}`, () => {
    const A1 = flightBuilder()
      .radial(OM, d, r)
      .hdg(360)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .approachAlt()
    const expected = landingAlt(mapDao.distance(OM, A1) + 7);
    expect(result).toBeCloseTo(expected, digits(1.1));
  });
});

multipleTest('Flight should compute landing alt', () => {
  const d = rndInt(1, 70) / 10;
  const r = rndHdg();

  test(`RUNWAY D${d} R${r}`, () => {
    const A1 = flightBuilder()
      .radial(RUNWAY, d, r)
      .hdg(360)
      .alt(4000)
      .toAlt(4000)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .landingAlt();
    const expected = Math.round(d * LANDING_RATE);
    expect(result).toBeCloseTo(expected, digits(1.1));
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .approachJunction();
    const CL = mapDao.radial(PL020, 21, R020)
    expect(result).toMatchObject({
      sigma: 291,
      c: CL,
      p: PL020,
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
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .approachJunction();
    const CR = mapDao.radial(PR020, 243, R020)
    expect(result).toMatchObject({
      sigma: 333,
      c: CR,
      p: PR020,
      right: true
    });
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
      }).flight;

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
      }).flight;

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
      }).flight;

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
      }).flight;

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
    const cmd = {
      flight: A1.id,
      type: COMMAND_TYPES.TURN_HEADING,
      when: COMMAND_CONDITIONS.IMMEDIATE,
      to: ENTRY.id
    };
    const result = new Flight(A1, props())
      .processCommand(cmd).flight;

    expect(result).toBeHdg(hdg);
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
      }).flight;

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
      }).flight;

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
    const cmd = {
      flight: A1.id,
      type: COMMAND_TYPES.TURN_HEADING,
      when: COMMAND_CONDITIONS.IMMEDIATE,
      to: ENTRY.id
    };
    const events = []
    const result = new Flight(A1, props({
      onEvent: evt => events.push(evt)
    }))
      .processCommand(cmd).flight;

    expect(result).toBeHdg(132);
    expect(result).toBeAlt(A1.alt);
    expect(result).toBeToAlt(A1.toAlt);
    expect(result).toBeSpeed(A1.speed);
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBePos(A1);
    expect(events).toEqual([{
      type: EVENT_TYPES.FLY_TO,
      flight: result,
      map,
      cmd
    }]);
  });
});

multipleTest('Flight should process clear to land command while flying', () => {
  const hdg = rndHdg();
  const d = rndInt(7, 23);
  test(`D${d} hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(OM, d, hdg + 180)
      .hdg(hdg)
      .alt(4000)
      .toAlt(4000)
      .status(FLIGHT_STATES.FLYING).flight;
    const cmd = {
      flight: A1.id,
      type: COMMAND_TYPES.CLEAR_TO_LAND,
      to: RUNWAY.id
    };
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processCommand(cmd).flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(4000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRunway(RUNWAY.id);
    expect(result).toBePos(A1);
    expect(result).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(events).toEqual([{
      type: EVENT_TYPES.CLEARED_TO_LAND,
      flight: result,
      map,
      cmd
    }]);
  });
});

multipleTest('Flight should process clear to land command while flying faraway', () => {
  const hdg = rndHdg()
  const d = rndInt(24, 50);
  test(`OM D${d}, hdg:${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(OM, d, hdg + 180)
      .hdg(hdg)
      .alt(4000)
      .toAlt(4000)
      .status(FLIGHT_STATES.FLYING).flight;

    const cmd = {
      flight: A1.id,
      type: COMMAND_TYPES.CLEAR_TO_LAND,
      to: RUNWAY.id
    };
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processCommand(cmd).flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(4000);
    expect(result).toBeToAlt(4000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRunway(undefined);
    expect(result).toBePos(A1);
    expect(events).toEqual([{
      type: EVENT_TYPES.UNABLE_TO_LAND_DISTANCE,
      flight: result,
      map,
      cmd
    }]);
  });

});

multipleTest('Flight should process clear to land command flying to high', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);
  const alt = rndFL();
  test(`${alt}' hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .pos(OM)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .status(FLIGHT_STATES.FLYING).flight;

    const cmd = {
      flight: A1.id,
      type: COMMAND_TYPES.CLEAR_TO_LAND,
      to: RUNWAY.id
    };
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processCommand(cmd).flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRunway(undefined);
    expect(result).toBePos(A1);
    expect(events).toEqual([{
      type: EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE,
      flight: result,
      map,
      cmd
    }]);
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
      .processTime().flight;

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
      .processTime().flight;

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
      .processTime().flight;

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
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(36000);
    expect(result).toBeToAlt(36000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeExit(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

multipleTest('Flight should process hold command immediate', () => {
  const hdg = rndHdg();
  const alt = rndFL();

  test(`${alt}' hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .status(FLIGHT_STATES.FLYING).flight;

    const events = [];
    const cmd = {
      flight: 'A1',
      type: COMMAND_TYPES.HOLD,
      when: COMMAND_CONDITIONS.IMMEDIATE
    };
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processCommand(cmd).flight;

    const hdg1 = mapDao.normHdg(hdg + 180);
    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(hdg1);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeFix(A1);
    expect(result).toBePos(A1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_FROM);
    expect(events).toEqual([{
      type: EVENT_TYPES.HOLD,
      flight: result,
      map,
      cmd
    }]);
  });

});

multipleTest('Flight should process hold command at BEACON', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const d = rndInt(5, 40);
  const alt = rndFL();

  test(`D${d} R${radial} ${alt}' hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .status(FLIGHT_STATES.FLYING).flight;

    const events = [];
    const cmd = {
      flight: 'A1',
      type: COMMAND_TYPES.HOLD,
      when: BEACON.id
    };
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processCommand(cmd).flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeHoldHdg(radial);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBePos(A1);
    expect(result).toBeStatus(FLIGHT_STATES.HOLDING_TO_AT);
    expect(events).toEqual([{
      type: EVENT_TYPES.HOLD_AT,
      flight: result,
      map,
      cmd
    }]);
  });
});
