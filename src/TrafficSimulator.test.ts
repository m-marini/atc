import _ from 'lodash';
import { sprintf } from 'sprintf-js';
import { Flight, FlightStatus, FlightType } from './modules/Flight';
import { Level } from './modules/Level';
import { HeadingMapNode, MapNodeAlignment, BasicMapNode, MapNode, MapNodeType, AreaMap } from './modules/Map';
import { mapDao } from './modules/MapDao';
import {
  buildClimbCommand, buildDepartureToMessage, buildFlyToCommand,
  buildGoodDayMessage, buildOutOfAreaMessage, buildPassingFlightLevelMessage,
  buildReadbackMessage, buildRogerMessage, buildRunwayVacated, buildTakeoffCommand,
  buildWrongRunwayVacated, buildLeavingMessage, buildClearedToLeaveMessage,
  buildLeavingMissingDepartureMessage, buildCollisionMessage, buildEnterLeaveMessage,
  buildHoldShortCommand
} from './modules/Message';
import { Session } from './modules/Session';
import { buildSimulator } from './modules/TrafficSimulator';
import { distance, flightBuilder, multipleTest, rndHdg, rndInt } from './TestUtil';

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

const level: Level = {
  id: 'level',
  name: '',
  maxPlane: 1,
  flightFreq: 10e3 // fph
};

const EmptyMap: AreaMap = {
  id: 'LON',
  name: 'London ATC',
  descr: 'London',
  center: {
    lat: 45,
    lon: 10
  },
  nodes: {},
  routes: []
};

const DefaultSession: Session = {
  id: '',
  version: 'test',
  level: 'level',
  map: 'LON',
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

function createMap(...nodesAry: MapNode[]) {
  const nodes = _(nodesAry).map(n => [n.id, n]).fromPairs().value() as Record<string, Node>;
  return _.assign({}, EmptyMap, { nodes }) as AreaMap;
}

const DefaultMap = createMap(RUNWAY, ENTRY, BEACON);

/**
 * 
 * @param args 
 */
function createSession(...args: Flight[]): Session {
  const flights = _(args).map(f => [f.id, f]).fromPairs().value() as Record<string, Flight>;
  return buildSession({ noFlights: _.keys(flights).length, flights });
}

function buildSession(props: any) {
  const sess = _.assign({}, DefaultSession, props) as Session;
  return sess;
}

describe('Traffic simulation should createEntryCandidates ', () => {
  test('full entries', () => {
    const ts = buildSimulator(DefaultSession, { map: DefaultMap, level });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });

  test('with safe entry', () => {
    const session1 = buildSession({
      entries: {
        ENT: 8
      }
    });
    const ts = buildSimulator(session1, { map: DefaultMap, level, safeEntryDelay: 2 });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(1);
    expect(result).toContainEqual(RUNWAY);
  });

  test('with timeout safe entry', () => {
    const session1 = buildSession({
      entries: {
        ENT: 7
      }
    });
    const ts = buildSimulator(session1, { map: DefaultMap, level, safeEntryDelay: 2 });

    const result = ts.createEntryCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });
});

describe('Traffic simulation should createExitCandidates', () => {
  test('full entries', () => {
    const ts = buildSimulator(DefaultSession, { map: DefaultMap, level });

    const result = ts.createExitCandidates();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(RUNWAY);
    expect(result).toContainEqual(ENTRY);
  });
});

describe('Traffic simulation should createFlight', () => {
  test('jet', () => {
    const map = createMap(RUNWAY);
    const ts = buildSimulator(DefaultSession, { map, level, jetProb: 1 });

    const result = ts.createFlight();

    expect(result.session).toMatchObject({
      noFlights: 1
    });

    const flight = _.values(result.session.flights)[0];
    expect(flight).toMatchObject({
      type: FlightType.Jet,
      alt: 0,
      toAlt: 0,
      to: RUNWAY.id,
      lat: 45,
      lon: 11,
      hdg: 132,
      speed: 0
    });

    expect(result.messages).toEqual([
      buildDepartureToMessage(flight, map.id),
      buildHoldShortCommand(flight.id, map.id, RUNWAY.id),
      buildReadbackMessage(buildHoldShortCommand(flight.id, map.id, RUNWAY.id))
    ]);
  });

  test('plane', () => {
    const map = createMap(RUNWAY);
    const ts = buildSimulator(DefaultSession, { map, level, jetProb: 0 });

    const result = ts.createFlight();

    expect(result.session).toMatchObject({
      noFlights: 1
    });

    const flight = _.values(result.session.flights)[0];
    expect(flight).toMatchObject({
      type: FlightType.Airplane,
      alt: 0,
      toAlt: 0,
      speed: 0,
      to: RUNWAY.id,
      hdg: RUNWAY.hdg,
      lat: RUNWAY.lat,
      lon: RUNWAY.lon
    });
    expect(result.messages).toEqual([
      buildDepartureToMessage(flight, map.id),
      buildHoldShortCommand(flight.id, map.id, RUNWAY.id),
      buildReadbackMessage(buildHoldShortCommand(flight.id, map.id, RUNWAY.id))
    ]);
  });

  test('flying jet', () => {
    const map = createMap(ENTRY);
    const ts = buildSimulator(DefaultSession, { map, level, jetProb: 1 });

    const result = ts.createFlight();
    expect(result.session).toMatchObject({
      noFlights: 1,
      entries: { ENT: 10 }
    });

    const flight = _.values(result.session.flights)[0];
    expect(flight).toMatchObject({
      type: FlightType.Jet,
      alt: 28000,
      toAlt: 28000,
      from: ENTRY.id,
      to: ENTRY.id,
      lat: ENTRY.lat,
      lon: ENTRY.lon,
      hdg: ENTRY.hdg,
      speed: 373
    });
    expect(result.messages).toEqual([
      buildEnterLeaveMessage(flight, map.id),
      buildRogerMessage(map.id, flight.id)
    ]);
  });

  test('flying plane', () => {
    const map = createMap(ENTRY);
    const ts = buildSimulator(DefaultSession, { map, level, jetProb: 0 });

    const result = ts.createFlight();

    expect(result.session).toMatchObject({
      noFlights: 1,
      entries: { ENT: 10 }
    });
    const flight = _.values(result.session.flights)[0];
    expect(flight).toMatchObject({
      type: FlightType.Airplane,
      alt: 28000,
      toAlt: 28000,
      to: ENTRY.id,
      from: ENTRY.id,
      lat: ENTRY.lat,
      lon: ENTRY.lon,
      hdg: ENTRY.hdg,
      speed: 236
    });
    expect(result.messages).toEqual([
      buildEnterLeaveMessage(flight, map.id),
      buildRogerMessage(map.id, flight.id)
    ]);
  });
});

describe('Traffic simulation should processForNewFlight ', () => {
  const session = buildSession({ t: 30 });
  const map = createMap(RUNWAY);

  test('true', () => {
    const result = buildSimulator(session, { map, level, jetProb: 1 })
      .processForNewFlight().session;

    expect(result).toMatchObject({
      noFlights: 1
    });

    expect(_.values(result.flights)).toHaveLength(1);
    expect(result.entries).toEqual({});
  });

  test('with capping', () => {
    const level: Level = {
      id: 'test',
      name: '',
      maxPlane: 1,
      flightFreq: 10e3
    };
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .to(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff)
      .build();
    const session1 = createSession(A1);

    const result = buildSimulator(session1, { map, level, jetProb: 1 })
      .processForNewFlight().session;

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
      .status(FlightStatus.WaitingForTakeoff).flight;

    const session1 = createSession(A1);

    const map = { nodes: { RUNWAY } };
    const result = buildSimulator(session1, { map, level, jetProb: 1 })
      .processForNewFlight().session;

    expect(result).toMatchObject({
      noFlights: 2,
      flights: {
        A1: {}
      }
    });
    const id = _(result.flights).keys().find(x => x !== 'A1') || '';
    expect(result.flights[id]).toBeHdg(132);
    expect(result.flights[id]).toBeAlt(0);
    expect(result.flights[id]).toBeToAlt(0);
    expect(result.flights[id]).toBeStatus(FlightStatus.WaitingForTakeoff);
    expect(result.flights[id]).toBePos(RUNWAY);
    expect(result.flights[id]).toBeFrom(RUNWAY.id);
    expect(result.entries).toEqual({})
  });

  test('false', () => {
    const level: Level = {
      id: '',
      name: '',
      maxPlane: 1,
      flightFreq: 0
    };

    const result = buildSimulator(DefaultSession,
      { map, level, jetProb: 1 })
      .processForNewFlight().session;

    expect(result).toMatchObject({
      noFlights: 0
    });
  });
});

describe('Traffic simulation should filterForOutOfArea', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    test(`outOfArea hdg: ${hdg}`, () => {
      const A1 = flightBuilder()
        .hdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .to(RUNWAY.id)
        .status(FlightStatus.Flying)
        .radial(DefaultMap.center, 100, hdg).flight;
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterForOutOfArea();

      expect(result.session).toMatchObject({
        noFlights: 1,
        noExitOk: 0,
        noExitKo: 1
      });
      expect(result.session.flights).toEqual({});
      expect(result.messages).toEqual([
        buildOutOfAreaMessage(A1.id, DefaultMap.id),
        buildRogerMessage(DefaultMap.id, A1.id)
      ]);
    });
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
      .status(FlightStatus.Landed).flight

    const session = createSession(A1);

    const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
      .filterForLanded();

    expect(result.session).toMatchObject({
      noFlights: 1,
      noLandedOk: 1,
      noLandedKo: 0
    });
    expect(result.session.flights).toEqual({});
    expect(result.session.entries).toEqual({});
    expect(result.messages).toEqual([
      buildRunwayVacated(A1, DefaultMap.id),
      buildGoodDayMessage(DefaultMap.id, A1.id)
    ]);
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
      .status(FlightStatus.Landed).flight

    const session = createSession(A1);

    const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
      .filterForLanded();

    expect(result.session).toMatchObject({
      noFlights: 1,
      noLandedOk: 0,
      noLandedKo: 1
    });
    expect(result.session.flights).toEqual({});
    expect(result.session.entries).toEqual({});
    expect(result.messages).toEqual([
      buildWrongRunwayVacated(A1, DefaultMap.id),
      buildGoodDayMessage(DefaultMap.id, A1.id)
    ]);
  });
});

describe('Traffic simulation should processFlights ', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    test(`flying hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(DefaultMap.center, 2, hdg + 180)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT }).processFlights();
      const session1 = result.session;

      const ds = distance(A1.speed, DT);
      expect(session1.flights.A1).toBeHdg(hdg);
      expect(session1.flights.A1).toBeSpeedAtAlt();
      expect(session1.flights.A1).toBeAlt(28000);
      expect(session1.flights.A1).toBeToAlt(28000);
      expect(session1.flights.A1).toBeStatus(FlightStatus.Flying);
      expect(session1.flights.A1).toBeRadial(A1, ds, hdg);
      expect(result.messages).toHaveLength(0);
    });
  });

  multipleTest(() => {
    const hdg = rndHdg();
    test(`fl:280, to fl 300 hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdg)
        .alt(28000)
        .toAlt(30000)
        .status(FlightStatus.Flying).flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT }).processFlights();
      const session1 = result.session;

      const ds = distance(A1.speed, DT);
      expect(session1.flights.A1).toBeHdg(hdg);
      expect(session1.flights.A1).toBeSpeedAtAlt();
      expect(session1.flights.A1).toBeClimbedFrom(A1.alt, DT);
      expect(session1.flights.A1).toBeToAlt(30000);
      expect(session1.flights.A1).toBeStatus(FlightStatus.Flying);
      expect(session1.flights.A1).toBeRadial(A1, ds, hdg);
      expect(result.messages).toHaveLength(0);
    });
  });

  multipleTest(() => {
    const hdg = rndHdg();
    test(`fl:299, to fl 300 hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdg)
        .alt(29900)
        .toAlt(30000)
        .status(FlightStatus.Flying).flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT }).processFlights();
      const session1 = result.session;

      const ds = distance(A1.speed, DT);
      expect(session1.flights.A1).toBeHdg(hdg);
      expect(session1.flights.A1).toBeSpeedAtAlt();
      expect(session1.flights.A1).toBeAlt(30000);
      expect(session1.flights.A1).toBeToAlt(30000);
      expect(session1.flights.A1).toBeStatus(FlightStatus.Flying);
      expect(session1.flights.A1).toBeRadial(A1, ds, hdg);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(A1.id, DefaultMap.id, '300'),
        buildRogerMessage(DefaultMap.id, A1.id)
      ]);
    });
  });

  multipleTest(() => {
    const hdg = rndHdg();
    test(`fl:241, to fl 240 hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdg)
        .alt(24100)
        .toAlt(24000)
        .status(FlightStatus.Flying).flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT }).processFlights();
      const session1 = result.session;

      const ds = distance(A1.speed, DT);
      expect(session1.flights.A1).toBeHdg(hdg);
      expect(session1.flights.A1).toBeSpeedAtAlt();
      expect(session1.flights.A1).toBeAlt(24000);
      expect(session1.flights.A1).toBeToAlt(24000);
      expect(session1.flights.A1).toBeStatus(FlightStatus.Flying);
      expect(session1.flights.A1).toBeRadial(A1, ds, hdg);
      expect(result.messages).toEqual([
        buildPassingFlightLevelMessage(A1.id, DefaultMap.id, '240'),
        buildRogerMessage(DefaultMap.id, A1.id)
      ]);
    });
  });
});

describe('Traffic simulation should processCommand for change flight level', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    test(`flying hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .pos(RUNWAY)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const cmd = buildClimbCommand(A1.id, DefaultMap.id, '320');
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level })
        .processCommand(cmd);

      const flight = result.session.flights.A1;
      expect(flight).toBePos(A1);
      expect(flight).toBeHdg(A1.hdg);
      expect(flight).toBeAlt(28000);
      expect(flight).toBeSpeedAtAlt();
      expect(flight).toBeToAlt(32000);
      expect(flight).toBeTurnTo(undefined);
      expect(flight).toBeStatus(FlightStatus.Flying);
      expect(result.messages).toEqual([
        buildReadbackMessage(cmd)
      ])
    });
  });

  test('taking off', () => {
    const A1 = flightBuilder()
      .pos(RUNWAY)
      .hdg(RUNWAY.hdg)
      .speed(0)
      .alt(0)
      .toAlt(0)
      .from(RUNWAY.id)
      .status(FlightStatus.WaitingForTakeoff).flight;
    const session = createSession(A1);
    const cmd = buildTakeoffCommand(A1.id, DefaultMap.id, RUNWAY.id, '320');

    const result = buildSimulator(session, { map: DefaultMap, level })
      .processCommand(cmd);

    const flight = result.session.flights.A1;
    expect(result.messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
    expect(flight).toBeHdg(RUNWAY.hdg);
    expect(flight).toBeAlt(0);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeToAlt(32000);
    expect(flight).toBeTurnTo(undefined);
    expect(flight).toBeStatus(FlightStatus.Flying);
    expect(flight).toBePos(RUNWAY);
  });

  test('landing', () => {
    const A1 = flightBuilder()
      .approachRunway(RUNWAY, 10).flight;
    const session = createSession(A1);
    const cmd = buildClimbCommand(A1.id, DefaultMap.id, '320');

    const result = buildSimulator(session, { map: DefaultMap, level })
      .processCommand(cmd);

    expect(result.messages).toEqual([
      buildReadbackMessage(cmd)
    ]);
    const flight = result.session.flights.A1;
    expect(flight).toBePos(A1);
    expect(flight).toBeHdg(A1.hdg);
    expect(flight).toBeAlt(A1.alt);
    expect(flight).toBeSpeedAtAlt();
    expect(flight).toBeToAlt(32000);
    expect(flight).toBeTurnTo(undefined);
    expect(flight).toBeStatus(FlightStatus.Flying);
  });
});

describe('Traffic simulation should processCommand for turn heading', () => {
  multipleTest(() => {
    const hdg = rndHdg();
    test(`to ENTRY at BEACON hdg:${hdg}`, () => {
      const A1 = flightBuilder()
        .radial(BEACON, 40, hdg + 180)
        .hdg(hdg)
        .alt(28000)
        .toAlt(28000)
        .status(FlightStatus.Flying).flight;

      const session = createSession(A1);
      const cmd = buildFlyToCommand(A1.id, DefaultMap.id, ENTRY.id, BEACON.id);

      const result = buildSimulator(session, { map: DefaultMap, level })
        .processCommand(cmd);

      expect(result.messages).toEqual([
        buildReadbackMessage(cmd)
      ]);

      const flight = result.session.flights.A1;
      expect(flight).toBeHdg(hdg);
      expect(flight).toBeAt(BEACON.id);
      expect(flight).toBeTurnTo(ENTRY.id);
      expect(flight).toBeStatus(FlightStatus.Turning);
      expect(flight).toBePos(A1);
    });
  });
});

describe('Traffic simulation should processExited', () => {
  multipleTest(() => {
    const dhdg = rndInt(0, 89);
    const hdg = mapDao.normHdg(ENTRY.hdg + dhdg - 180);

    test(`exit ok ${hdg}`, () => {
      const d0 = 0.1;
      const A1 = flightBuilder()
        .radial(ENTRY, d0, hdg + 180)
        .hdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .to(ENTRY.id)
        .exit(ENTRY.id)
        .status(FlightStatus.Exited)
        .flight
      const session = createSession(A1);
      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterForExited();

      expect(result.messages).toEqual([
        buildLeavingMessage(A1, DefaultMap.id),
        buildClearedToLeaveMessage(DefaultMap.id, A1.id, A1.to)
      ]);
      expect(result.session).toMatchObject({
        noExitOk: 1,
        noExitKo: 0
      });
      expect(result.session.flights).toEqual({});
    });
  });

  multipleTest(() => {
    const dhdg = rndInt(0, 89);
    const hdg = mapDao.normHdg(ENTRY.hdg + dhdg - 180);
    test(`exit ko altitude ${hdg}`, () => {
      const d0 = 0.1;
      const A1 = flightBuilder()
        .radial(ENTRY, d0, hdg + 180)
        .hdg(hdg)
        .alt(32000)
        .toAlt(32000)
        .to(ENTRY.id)
        .exit(ENTRY.id)
        .status(FlightStatus.Exited)
        .flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterForExited();

      expect(result.messages).toEqual([
        buildLeavingMissingDepartureMessage(A1, DefaultMap.id),
        buildClearedToLeaveMessage(DefaultMap.id, A1.id, A1.exit as string),
      ]);

      expect(result.session).toMatchObject({
        noExitOk: 0,
        noExitKo: 1
      });

      expect(result.session.flights).toEqual({});
    });
  });

  multipleTest(() => {
    const dhdg = rndInt(0, 89);
    const hdg = mapDao.normHdg(ENTRY.hdg + dhdg - 180);
    test(`exit ko exit ${hdg}`, () => {
      const d0 = 0.1;
      const A1 = flightBuilder()
        .radial(ENTRY, d0, hdg + 180)
        .hdg(hdg)
        .alt(36000)
        .toAlt(36000)
        .to(RUNWAY.id)
        .exit(ENTRY.id)
        .status(FlightStatus.Exited)
        .flight
      const session = createSession(A1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterForExited();

      expect(result.messages).toEqual([
        buildLeavingMissingDepartureMessage(A1, DefaultMap.id),
        buildClearedToLeaveMessage(DefaultMap.id, A1.id, A1.exit as string),
      ]);
      expect(result.session).toMatchObject({
        noExitOk: 0,
        noExitKo: 1
      });

      expect(result.session.flights).toEqual({});
    });
  });
});

describe('Traffic simulation should detect collision ', () => {
  multipleTest(() => {
    const d = rndInt(0, 40) / 10;
    const r = rndHdg();
    const hdga = rndHdg();
    const hdgb = rndHdg();
    const a1Alt = rndInt(1000, 35000);
    const b1Alt = a1Alt + rndInt(0, 1001);

    test(`collisions ${sprintf('%.3f', d)} nms R${r}, ${a1Alt} ft, ${b1Alt} ft`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdga)
        .alt(a1Alt)
        .toAlt(a1Alt)
        .status(FlightStatus.Flying).flight;
      const B1 = flightBuilder()
        .id('B1')
        .radial(DefaultMap.center, d, r)
        .hdg(hdgb)
        .alt(b1Alt)
        .toAlt(b1Alt)
        .status(FlightStatus.Flying).flight;
      const session = createSession(A1, B1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterCollision();

      expect(result.messages).toEqual([
        buildCollisionMessage(A1.id, DefaultMap.id),
        buildCollisionMessage(B1.id, DefaultMap.id)
      ]);
      expect(result.session).toMatchObject({ noCollision: 2 });
      expect(result.session.flights).toEqual({});
    });
  });

  multipleTest(() => {
    const r = rndHdg();
    const hdga = rndHdg();
    const hdgb = rndHdg();
    const a1Alt = rndInt(1000, 35000);
    const b1Alt = a1Alt + rndInt(0, 1001);

    test(`no collisions 4.01 nms R${r}, ${a1Alt} ft, ${b1Alt} ft`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdga)
        .alt(a1Alt)
        .toAlt(a1Alt)
        .status(FlightStatus.Flying).flight;
      const B1 = flightBuilder()
        .id('B1')
        .radial(DefaultMap.center, 4.01, r)
        .hdg(hdgb)
        .alt(b1Alt)
        .toAlt(b1Alt)
        .status(FlightStatus.Flying).flight;
      const session = createSession(A1, B1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterCollision();

      expect(result.messages).toHaveLength(0);
      expect(result.session).toMatchObject({
        noCollision: 0
      });
      expect(result.session.flights).toEqual(session.flights);
    });
  });

  multipleTest(() => {
    const d = rndInt(0, 40) / 10;
    const r = rndHdg();
    const hdga = rndHdg();
    const hdgb = rndHdg();
    const a1Alt = rndInt(1000, 35000);

    test(`no collisions ${sprintf('%.3f', d)} nms R${r}, ${a1Alt} ft, ${a1Alt + 1001} ft`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdga)
        .alt(a1Alt)
        .toAlt(a1Alt)
        .status(FlightStatus.Flying).flight;
      const B1 = flightBuilder()
        .id('B1')
        .radial(DefaultMap.center, 4.01, r)
        .hdg(hdgb)
        .alt(a1Alt + 1001)
        .toAlt(a1Alt + 1001)
        .status(FlightStatus.Flying).flight;
      const session = createSession(A1, B1);

      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterCollision();

      expect(result.messages).toHaveLength(0);
      expect(result.session).toMatchObject({
        noCollision: 0
      });
      expect(result.session.flights).toEqual(session.flights);
    });
  });

  multipleTest(() => {
    const d = rndInt(0, 40) / 10;
    const r = rndHdg();
    const hdga = rndHdg();
    const hdgb = rndHdg();

    test(`no collisions at rwy ${sprintf('%.3f', d)} nms R${r}, 0ft, 100 ft`, () => {
      const A1 = flightBuilder()
        .pos(DefaultMap.center)
        .hdg(hdga)
        .alt(0)
        .toAlt(0)
        .status(FlightStatus.WaitingForTakeoff).flight;
      const B1 = flightBuilder()
        .id('B1')
        .radial(DefaultMap.center, d, r)
        .hdg(hdgb)
        .alt(100)
        .toAlt(100)
        .status(FlightStatus.Flying).flight;
      const session = createSession(A1, B1);
      const result = buildSimulator(session, { map: DefaultMap, level, dt: DT })
        .filterCollision().session;

      expect(result).toMatchObject({
        noCollision: 0
      });
      expect(result.flights).toEqual(session.flights);
    });
  });
});
