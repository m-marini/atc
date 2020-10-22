import { TrafficSimulator, NODE_TYPES, FLIGHT_STATES, FLIGHT_TYPES, COMMAND_TYPES, COMMAND_CONDITIONS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { distance, flightBuilder } from './TestUtil';
import {sprintf} from 'sprintf-js';

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

const level = {
  maxPlane: 1,
  flightFreq: 10e3 // fph
};

const map = {
  center: {
    lat: 45,
    lon: 10
  },
  nodes: { RUNWAY, BEACON, ENTRY }
};

const session = {
  t: 10,
  noFlights: 0,
  noLandedOk: 0,
  noLandedKo: 0,
  noExitOk: 0,
  noExitKo: 0,
  noCollision: 0,
  flights: {},
  entries: {}
};

function createSession() {
  const flights = _(arguments).groupBy('id').mapValues(f => f[0]).value();
  const sess = _.defaults({ noFlights: arguments.length, flights }, session);
  return sess;
}

describe('Traffic simulation should createEntryCandidates ', () => {
  test('full entries', () => {
    const ts = new TrafficSimulator({ session, map, level });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });

  test('with safe entry', () => {
    const session1 = _.defaults({}, {
      entries: {
        ENTRY: 8
      }
    }, session);
    const ts = new TrafficSimulator({ session: session1, map, level, safeEntryDelay: 2 });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(1);
    expect(result).toContainEqual(RUNWAY);
  });

  test('with timeout safe entry', () => {
    const session1 = _.defaults({}, {
      entries: {
        ENTRY: 7
      }
    }, session);
    const ts = new TrafficSimulator({ session: session1, map, level, safeEntryDelay: 2 });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });
});

describe('Traffic simulation should createExitCandidates', () => {
  test('full entries', () => {
    const ts = new TrafficSimulator({ session, map, level });

    const result = ts.createExitCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });
});


describe('Traffic simulation should createFlight', () => {
  test('jet', () => {
    const map = { nodes: { RUNWAY } };
    const ts = new TrafficSimulator({ session, map, level, jetProb: 1 });

    const result = ts.createFlight().sessionJS;
    expect(result).toMatchObject({
      noFlights: 1,
      flights: {
        A1: {
          id: 'A1',
          type: FLIGHT_TYPES.JET,
          alt: 0,
          toAlt: 0,
          to: 'RUNWAY',
          lat: 45,
          lon: 11,
          hdg: 132,
          speed: 0
        }
      }
    });
  });

  test('plane', () => {
    const map = { nodes: { RUNWAY } };
    const ts = new TrafficSimulator({ session, map, level, jetProb: 0 });

    const result = ts.createFlight().sessionJS;
    expect(result).toMatchObject({
      noFlights: 1,
      flights: {
        A1: {
          id: 'A1',
          type: FLIGHT_TYPES.AIRPLANE,
          alt: 0,
          toAlt: 0,
          to: 'RUNWAY',
          lat: 45,
          lon: 11,
          hdg: 132,
          speed: 0
        }
      }
    });
  });

  test('flighing jet', () => {
    const map = { nodes: { ENTRY } };
    const ts = new TrafficSimulator({ session, map, level, jetProb: 1 });

    const result = ts.createFlight().sessionJS;
    expect(result).toMatchObject({
      noFlights: 1,
      flights: {
        A1: {
          id: 'A1',
          type: FLIGHT_TYPES.JET,
          alt: 28000,
          toAlt: 28000,
          to: 'ENTRY',
          lat: 46,
          lon: 10,
          hdg: 132,
          speed: 373
        }
      },
      entries: { ENTRY: 10 }
    });
  });

  test('flighing plane', () => {
    const map = { nodes: { ENTRY } };
    const ts = new TrafficSimulator({ session, map, level, jetProb: 0 });

    const result = ts.createFlight().sessionJS;
    expect(result).toMatchObject({
      noFlights: 1,
      flights: {
        A1: {
          id: 'A1',
          type: FLIGHT_TYPES.AIRPLANE,
          alt: 28000,
          toAlt: 28000,
          to: 'ENTRY',
          lat: 46,
          lon: 10,
          hdg: 132,
          speed: 236
        }
      },
      entries: { ENTRY: 10 }
    });
  });
});

describe('Traffic simulation should processForNewFlight ', () => {
  const session = {
    t: 10,
    noFlights: 0,
    flights: {},
    entries: {}
  };

  test('true', () => {
    const map = { nodes: { RUNWAY } };

    const result = new TrafficSimulator({ session, map, level, jetProb: 1 })
      .processForNewFlight().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      flights: {
        A1: {}
      }
    });
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeAlt(0);
    expect(result.flights.A1).toBeToAlt(0);
    expect(result.flights.A1).toBeSpeed(0);
    expect(result.flights.A1).toBeFrom(RUNWAY.id);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.WAITING_FOR_TAKEOFF);
    expect(result.flights.A1).toBePos(RUNWAY);
    expect(result.entries).toEqual({})
  });

  test('with capping', () => {
    const level = {
      maxPlane: 1,
      planeEntryProb: 1
    };
    const A1 = {
      id: 'A1',
      type: FLIGHT_TYPES.JET,
      alt: 0,
      toAlt: 0,
      to: 'RUNWAY',
      lat: 45,
      lon: 11,
      hdg: 132,
      speed: 0
    };

    const session1 = _.defaults({
      noFlights: 1,
      flights: { A1 }
    }, session);

    const map = { nodes: { RUNWAY } };
    const result = new TrafficSimulator({ session: session1, map, level, jetProb: 1 })
      .processForNewFlight().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      flights: { A1 }
    });
    expect(result.entries).toEqual({})
  });

  test('with no capping', () => {
    const level = {
      maxPlane: 2,
      flightFreq: 10e3
    };
    const A1 = flightBuilder()
      .alt(0)
      .toAlt(0)
      .hdg(132)
      .speed(0)
      .pos(RUNWAY)
      .from(RUNWAY.id)
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF).flight;

    const session1 = createSession(A1);

    const map = { nodes: { RUNWAY } };
    const result = new TrafficSimulator({ session: session1, map, level, jetProb: 1 })
      .processForNewFlight().sessionJS;

    expect(result).toMatchObject({
      noFlights: 2,
      flights: {
        A1: {},
        B1: {}
      }
    });
    expect(result.flights.B1).toBeHdg(132);
    expect(result.flights.B1).toBeAlt(0);
    expect(result.flights.B1).toBeToAlt(0);
    expect(result.flights.B1).toBeStatus(FLIGHT_STATES.WAITING_FOR_TAKEOFF);
    expect(result.flights.B1).toBePos(RUNWAY);
    expect(result.flights.B1).toBeFrom(RUNWAY.id);
    expect(result.entries).toEqual({})
  });

  test('false', () => {
    const level = {
      maxPlane: 1,
      flightFreq: 0
    };

    const map = { nodes: { RUNWAY } };
    const result = new TrafficSimulator({ session, map, level, jetProb: 1 })
      .processForNewFlight().sessionJS;

    expect(result).toMatchObject({
      noFlights: 0,
      flights: {}
    });
  });
});

describe('Traffic simulation should filterForOutOfArea', () => {
  test('outOfArea', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING)
      .radial(map.center, 100, hdg).flight;
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterForOutOfArea().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      noExitOk: 0,
      noExitKo: 1
    });
    expect(result.flights).toEqual({});
  });

  test('landed ko', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .speed(0)
      .alt(0)
      .toAlt(0)
      .to(ENTRY.id)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.LANDED).flight

    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterForLanded().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      noLandedOk: 0,
      noLandedKo: 1
    });
    expect(result.flights).toEqual({});
    expect(result.entries).toEqual({});
  });
});

describe('Traffic simulation should filterForLanded ', () => {
  test('landed ok', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .speed(0)
      .alt(0)
      .toAlt(0)
      .to(RUNWAY.id)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.LANDED).flight

    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterForLanded().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      noLandedOk: 1,
      noLandedKo: 0
    });
    expect(result.flights).toEqual({});
    expect(result.entries).toEqual({});
  });

  test('landed ko', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .speed(0)
      .alt(0)
      .toAlt(0)
      .to(ENTRY.id)
      .rwy(RUNWAY.id)
      .status(FLIGHT_STATES.LANDED).flight

    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterForLanded().sessionJS;

    expect(result).toMatchObject({
      noFlights: 1,
      noLandedOk: 0,
      noLandedKo: 1
    });
    expect(result.flights).toEqual({});
    expect(result.entries).toEqual({});
  });
});

describe('Traffic simulation should processFlights ', () => {

  test('flying', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(map.center, 2, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeAlt(28000);
    expect(result.flights.A1).toBeToAlt(28000);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBeRadial(A1, ds, hdg);
  });

  test('fl:280, to fl 300', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdg)
      .alt(28000)
      .toAlt(30000)
      .status(FLIGHT_STATES.FLYING).flight
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeClimbedFrom(A1.alt, DT);
    expect(result.flights.A1).toBeToAlt(30000);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBeRadial(A1, ds, hdg);
  });

  test('fl:299, to fl 300', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdg)
      .alt(29900)
      .toAlt(30000)
      .status(FLIGHT_STATES.FLYING).flight
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeAlt(30000);
    expect(result.flights.A1).toBeToAlt(30000);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBeRadial(A1, ds, hdg);
  });

  test('fl:241, to fl 240', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdg)
      .alt(24100)
      .toAlt(24000)
      .status(FLIGHT_STATES.FLYING).flight
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeAlt(24000);
    expect(result.flights.A1).toBeToAlt(24000);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBeRadial(A1, ds, hdg);
  });

});

describe('Traffic simulation should processCommand for change flight level', () => {

  test('flying', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .at(RUNWAY)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CHANGE_LEVEL, flightLevel: '320'
    }
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBePos(A1);
    expect(result.flights.A1).toBeHdg(A1.hdg);
    expect(result.flights.A1).toBeAlt(28000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeToAlt(32000);
    expect(result.flights.A1).toBeTurnTo(undefined);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
  });

  test('taking off', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .speed(0)
      .alt(0)
      .toAlt(0)
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF).flight;
    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CHANGE_LEVEL, flightLevel: '320'
    }
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeAlt(0);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeToAlt(32000);
    expect(result.flights.A1).toBeTurnTo(undefined);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBePos(RUNWAY);
  });

  test('landing', () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, 10).flight;
    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CHANGE_LEVEL, flightLevel: '320'
    }
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBePos(A1);
    expect(result.flights.A1).toBeHdg(A1.hdg);
    expect(result.flights.A1).toBeAlt(A1.alt);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeToAlt(32000);
    expect(result.flights.A1).toBeTurnTo(undefined);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

describe('Traffic simulation should processCommand for turn heading', () => {

  test('to ENTRY at BEACON', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, 40, hdg + 180)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.TURN_HEADING, when: BEACON.id, to: ENTRY.id
    };
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeAt(BEACON.id);
    expect(result.flights.A1).toBeTurnTo(ENTRY.id);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result.flights.A1).toBePos(A1);
  });
});

/**
 * Condizioni per accettare il comando di clear to land:
 * - l'aereo deve essere sufficientemente vicino alla pista
 * - l'aereo deve essere ad un'altitudine non superiore a quella di discesa
 * - la direzione della pista e la rotta verso la pista non devono discostare di un determinato angolo
 *   per permettere la manovra di allineamento con la pista.
 */
describe('Traffic simulation should processCommand for clear to land', () => {

  test('approach', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(RUNWAY, 20, hdg + 180)
      .alt(4000)
      .toAlt(4000)
      .hdg(hdg)
      .status(FLIGHT_STATES.FLYING).flight;
    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CLEAR_TO_LAND, to: RUNWAY.id
    };
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBeAlt(4000);
    expect(result.flights.A1).toBeToAlt(4000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(A1.hdg);
    expect(result.flights.A1).toBeRunway(RUNWAY.id);
    expect(result.flights.A1).toBeOm(RUNWAY);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.APPROACHING);
    expect(result.flights.A1).toBePos(A1);
  });

  test('to high', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(RUNWAY, 20, hdg + 180)
      .alt(8000)
      .toAlt(8000)
      .hdg(hdg)
      .status(FLIGHT_STATES.FLYING).flight;
    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CLEAR_TO_LAND, to: RUNWAY.id
    };
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBeAlt(8000);
    expect(result.flights.A1).toBeToAlt(8000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(A1.hdg);
    expect(result.flights.A1).toBeRunway(undefined);
    expect(result.flights.A1).toBeAt(undefined);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBePos(A1);
  });

  test('too distant', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(RUNWAY, 26, hdg + 180)
      .alt(4000)
      .toAlt(4000)
      .hdg(hdg)
      .status(FLIGHT_STATES.FLYING).flight;
    const cmd = {
      flight: A1.id, type: COMMAND_TYPES.CLEAR_TO_LAND, to: RUNWAY.id
    };
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level })
      .processCommand(cmd).sessionJS;

    expect(result.flights.A1).toBeAlt(4000);
    expect(result.flights.A1).toBeToAlt(4000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(A1.hdg);
    expect(result.flights.A1).toBeRunway(undefined);
    expect(result.flights.A1).toBeAt(undefined);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBePos(A1);
  });
});

describe('Traffic simulation should processFlight turning at', () => {
  test('BEACON to', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const A1 = flightBuilder()
      .radial(BEACON, 10, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights()
      .sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeHdg(hdg);
    expect(result.flights.A1).toBeAlt(36000);
    expect(result.flights.A1).toBeToAlt(36000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeTurnTo(ENTRY.id);
    expect(result.flights.A1).toBeAt(BEACON.id);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result.flights.A1).toBeRadial(A1, ds, hdg);
  });
});

describe('Traffic simulation should processFlight approaching', () => {

  test('at 20 nms', () => {
    const d0 = 20;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .alt(4000)
      .toAlt(4000)
      .om(RUNWAY)
      .status(FLIGHT_STATES.APPROACHING)
      .flight
    const session = createSession(A1);

    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    const d1 = d0 - ds;
    expect(result.flights.A1).toBeRadial(RUNWAY, d1, RUNWAY.hdg + 180);
    expect(result.flights.A1).toBeAlt(4000);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.APPROACHING);
  });

  test('at 10 nms', () => {
    const d0 = 10;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000)
      .om(RUNWAY)
      .status(FLIGHT_STATES.APPROACHING)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    const d1 = d0 - ds;
    expect(result.flights.A1).toBeRadial(RUNWAY, d1, RUNWAY.hdg + 180);
    expect(result.flights.A1).toBeApproachAlt(RUNWAY, 2);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.APPROACHING);
  });
});

describe('Traffic simulation should processFlight landing', () => {
  test('at 2 nms', () => {
    const d0 = 2;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    const d1 = d0 - ds;
    expect(result.flights.A1).toBeRadial(RUNWAY, d1, RUNWAY.hdg + 180);
    expect(result.flights.A1).toBeLandingAlt(RUNWAY);
    expect(result.flights.A1).toBeSpeedAtAlt();
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.LANDING);
  });

  test('land at 0.1 nms', () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, d0)
      .toAlt(4000)
      .flight

    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    expect(result.flights.A1).toBeAlt(0);
    expect(result.flights.A1).toBeSpeed(0);
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.LANDED);
    expect(result.flights.A1).toBePos(RUNWAY);
  });

  test('abort at 0.1 nms from', () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .approachRadial(RUNWAY, d0, RUNWAY.hdg)
      .rwy(RUNWAY.id)
      .hdg(RUNWAY.hdg)
      .toAlt(8000)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights().sessionJS;

    const ds = distance(A1.speed, DT);
    expect(result.flights.A1).toBeClimbedFrom(A1.alt, DT)
    expect(result.flights.A1).toBeSpeedAtAlt()
    expect(result.flights.A1).toBeHdg(RUNWAY.hdg);
    expect(result.flights.A1).toBeToAlt(4000);
    expect(result.flights.A1).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result.flights.A1).toBeRadial(A1, ds, RUNWAY.hdg);
  });
});

describe('Traffic simulation should processExited', () => {
  const dhdg = Math.floor(Math.random() * 89);
  const hdg = mapDao.normHdg(ENTRY.hdg + dhdg - 180);
  test(`exit ok ${hdg}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(ENTRY.id)
      .status(FLIGHT_STATES.FLYING)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights()
      .filterForExited().sessionJS;

    expect(result).toMatchObject({
      noExitOk: 1,
      noExitKo: 0
    });

    expect(result.flights).toEqual({});
  });

  test(`exit ko altitude ${hdg}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(32000)
      .toAlt(32000)
      .to(ENTRY.id)
      .status(FLIGHT_STATES.FLYING)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights()
      .filterForExited().sessionJS;

    expect(result).toMatchObject({
      noExitOk: 0,
      noExitKo: 1
    });

    expect(result.flights).toEqual({});
  });

  test(`exit ko exit ${hdg}`, () => {
    const d0 = 0.1;
    const A1 = flightBuilder()
      .radial(ENTRY, d0, hdg + 180)
      .hdg(hdg)
      .alt(36000)
      .toAlt(36000)
      .to(RUNWAY.id)
      .status(FLIGHT_STATES.FLYING)
      .flight
    const session = createSession(A1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .processFlights()
      .filterForExited().sessionJS;

    expect(result).toMatchObject({
      noExitOk: 0,
      noExitKo: 1
    });

    expect(result.flights).toEqual({});
  });
});
describe('Traffic simulation should detect collision ', () => {
  const d = Math.random() * 4;
  const r = Math.floor(Math.random() * 360 + 1);
  const hdga = Math.floor(Math.random() * 360 + 1);
  const hdgb = Math.floor(Math.random() * 360 + 1);
  const a1Alt = Math.round(Math.random() * 34000 + 1000);
  const b1Alt = Math.round(a1Alt + Math.random() * 1000);

  test(`collisions ${sprintf('%.3f', d)} nms R${r}, ${a1Alt} ft, ${b1Alt} ft`, () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdga)
      .alt(a1Alt)
      .toAlt(a1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const B1 = flightBuilder()
      .id('B1')
      .radial(map.center, d, r)
      .hdg(hdgb)
      .alt(b1Alt)
      .toAlt(b1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const session = createSession(A1, B1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterCollision().sessionJS;

    expect(result).toMatchObject({
      noCollision: 2
    });
    expect(result.flights).toEqual({});
  });

  test(`no collisions 4.01 nms R${r}, ${a1Alt} ft, ${b1Alt} ft`, () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdga)
      .alt(a1Alt)
      .toAlt(a1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const B1 = flightBuilder()
      .id('B1')
      .radial(map.center, 4.01, r)
      .hdg(hdgb)
      .alt(b1Alt)
      .toAlt(b1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const session = createSession(A1, B1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterCollision().sessionJS;

    expect(result).toMatchObject({
      noCollision: 0
    });
    expect(result.flights).toEqual(session.flights);
  });

  test(`no collisions ${sprintf('%.3f', d)} nms R${r}, ${a1Alt} ft, ${a1Alt + 1001} ft`, () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdga)
      .alt(a1Alt)
      .toAlt(a1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const B1 = flightBuilder()
      .id('B1')
      .radial(map.center, 4.01, r)
      .hdg(hdgb)
      .alt(a1Alt + 1001)
      .toAlt(b1Alt)
      .status(FLIGHT_STATES.FLYING).flight;
    const session = createSession(A1, B1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterCollision().sessionJS;

    expect(result).toMatchObject({
      noCollision: 0
    });
    expect(result.flights).toEqual(session.flights);
  });

  test(`no collisions at rwy ${sprintf('%.3f', d)} nms R${r}, 0ft, 100 ft`, () => {
    const A1 = flightBuilder()
      .pos(map.center)
      .hdg(hdga)
      .alt(0)
      .toAlt(0)
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF).flight;
    const B1 = flightBuilder()
      .id('B1')
      .radial(map.center, d, r)
      .hdg(hdgb)
      .alt(100)
      .toAlt(100)
      .status(FLIGHT_STATES.FLYING).flight;
    const session = createSession(A1, B1);
    const result = new TrafficSimulator({ session, map, level, dt: DT })
      .filterCollision().sessionJS;

    expect(result).toMatchObject({
      noCollision: 0
    });
    expect(result.flights).toEqual(session.flights);
  });
});
