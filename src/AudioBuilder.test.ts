import _ from 'lodash';
import { Flight } from './modules/Flight';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import {
  buildClimbCommand, buildDepartureLeaveMessage, buildDepartureToMessage,
  buildDescendCommand, buildEnterLeaveMessage, buildEnterToMessage, buildFlyingToMessage, buildFlyToCommand,
  buildHoldCommand, buildLandCommand, buildMaintainCommand, buildPassingFlightLevelMessage,
  buildReadbackMessage, buildTakeoffCommand, buildWrongRunwayVacated, buildRunwayVacated,
  buildMissingApproachMessage, buildMissingRunwayMessage, buildLeavingMessage,
  buildLeavingMissingDepartureMessage,
  buildOutOfAreaMessage,
  buildCollisionMessage,
  buildAtGroundMessage,
  buildTooDistanthMessage,
  buildTooHighMessage,
  buildATCNotFoundMessage,
  buildBeaconNotFoundMessage,
  buildInvalidFlightLevelMessage,
  buildNotAtGroundMessage,
  buildInvalidRunwayMessage,
  buildFlightNotFoundMessage,
  buildRunwayNotFoundMessage,
  buildClearedToMessage,
  buildClearedToLeaveMessage,
  buildGoodDayMessage,
  buildRogerMessage,
  buildHoldShortCommand
} from './modules/Message';
import { AudioBuilder } from './modules/MessageConverters';
import { Session } from './modules/Session';
import { flightBuilder } from './TestUtil';

const TO: BasicMapNode = {
  id: 'TO',
  type: MapNodeType.Beacon,
  alignment: MapNodeAlignment.N,
  lat: 45,
  lon: 10
};

const AT: BasicMapNode = {
  id: 'AT',
  type: MapNodeType.Beacon,
  alignment: MapNodeAlignment.N,
  lat: 45.5,
  lon: 10
};

const TT: BasicMapNode = {
  id: 'TT',
  type: MapNodeType.Beacon,
  alignment: MapNodeAlignment.N,
  lat: 44.5,
  lon: 10
};

const R36C: HeadingMapNode = {
  id: '36C',
  type: MapNodeType.Runway,
  alignment: MapNodeAlignment.N,
  lat: 44.75,
  lon: 10,
  hdg: 357
};

const R09L: HeadingMapNode = {
  id: '09L',
  type: MapNodeType.Runway,
  alignment: MapNodeAlignment.N,
  lat: 45.25,
  lon: 10,
  hdg: 92
};

function buildMap(): AreaMap {
  const nodes = _([TO, AT, TT, R36C, R09L])
    .map(n => [n.id, n])
    .fromPairs()
    .value() as Record<string, MapNode>;

  return {
    id: 'LON',
    name: 'London ATC',
    descr: 'London ATC (London)',
    center: {
      lat: 45,
      lon: 10
    },
    nodes,
    routes: []
  };
}

const map = buildMap();

function buildSession(...flights: Flight[]): Session {
  const fm: Record<string, Flight> = _(flights).map(f => [f.id, f]).fromPairs().value();
  return {
    id: '',
    version: '',
    level: '',
    map: map.id,
    t: 0,
    noFlights: 0,
    noLandedKo: 0,
    noLandedOk: 0,
    noExitKo: 0,
    noExitOk: 0,
    noCollision: 0,
    flights: fm,
    entries: {},
    atcVoice: '0'
  };
}


describe('AudioBuilder should generate report messages', () => {
  test('departure message to rwy', () => {
    const flight = flightBuilder()
      .to(R09L.id)
      .from(R36C.id)
      .flight;
    const cmd = buildDepartureToMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one holding short runway three six center ready for departure to runway zero niner left'
    );
  });

  test('departure message to leave', () => {
    const flight = flightBuilder()
      .to(TO.id)
      .from(R36C.id)
      .flight;

    const cmd = buildDepartureLeaveMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one holding short runway three six center ready for departure via tango oscar'
    );
  });

  test('enter vor to rwy', () => {
    const flight = flightBuilder()
      .to(R09L.id)
      .from(AT.id)
      .flight;
    const cmd = buildEnterToMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one enter control zone via alpha tango to runway zero niner left'
    );
  });

  test('enter vor to vor', () => {
    const flight = flightBuilder()
      .to('TO')
      .from('AT')
      .flight;
    const cmd = buildEnterLeaveMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one enter control zone via alpha tango leave tango oscar'
    );
  });

  test('passing', () => {
    const flight = flightBuilder()
      .flight;
    const cmd = buildPassingFlightLevelMessage(flight.id, map.id, '040');
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one passing flight level zero four zero'
    );
  });

  test('flying to', () => {
    const flight = flightBuilder()
      .at(AT.id)
      .flight;
    const session = buildSession(flight);
    const cmd = buildFlyingToMessage(flight, map.id);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one flying to alpha tango'
    );
  });

  test('right land', () => {
    const flight = flightBuilder()
      .rwy(R36C.id)
      .to(R36C.id)
      .flight;
    const cmd = buildRunwayVacated(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one runway three six center vacated'
    );
  });

  test('wrong land', () => {
    const flight = flightBuilder()
      .rwy(R36C.id)
      .to(R09L.id)
      .flight;
    const cmd = buildWrongRunwayVacated(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one runway three six center vacated wrong arrival'
    );
  });

  test('go around missing approach', () => {
    const flight = flightBuilder().flight;
    const cmd = buildMissingApproachMessage(flight.id, map.id, '040');
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one going around missing approach'
    );
  });

  test('go around missing runway', () => {
    const flight = flightBuilder().flight;
    const cmd = buildMissingRunwayMessage(flight.id, map.id, '040');
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one going around missing runway'
    );
  });

  test('right leave', () => {
    const flight = flightBuilder()
      .exit(TO.id)
      .to(TO.id)
      .flight;
    const cmd = buildLeavingMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one leaving controlled zone via tango oscar'
    );
  });

  test('wrong leave', () => {
    const flight = flightBuilder()
      .exit(TO.id)
      .to(AT.id)
      .flight;
    const cmd = buildLeavingMissingDepartureMessage(flight, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one leaving controlled zone via tango oscar missing departure'
    );
  });

  test('out of area', () => {
    const flight = flightBuilder().flight;
    const cmd = buildOutOfAreaMessage(flight.id, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one leaving controlled zone missing departure'
    );
  });

  test('collision', () => {
    const flight = flightBuilder().flight;
    const cmd = buildCollisionMessage(flight.id, map.id);
    const session = buildSession(flight);
    const builder = new AudioBuilder(cmd, map, session);

    const result = builder.build();

    expect(result).toEqual(
      '1 London ATC alpha one mayday mayday mayday collision'
    );
  });
});

describe('AudioBuilder should generate command messages', () => {
  test('climb', () => {
    const flight = flightBuilder().flight;
    const cmd = buildClimbCommand(flight.id, map.id, '360');
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC climb to flight level three six zero'
    );

    expect(result2).toEqual(
      '1 climbing to flight level three six zero alpha one'
    );
  });

  test('descend', () => {
    const cmd = buildDescendCommand('A1', map.id, '240');
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC descend to flight level two four zero'
    );
    expect(result2).toEqual(
      '1 descending to flight level two four zero alpha one'
    );
  });

  test('maintain fl', () => {
    const cmd = buildMaintainCommand('A1', map.id, '240');
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC maintain flight level two four zero'
    );
    expect(result2).toEqual(
      '1 maintaining flight level two four zero alpha one'
    );
  });

  test('clear to take off', () => {
    const cmd = buildTakeoffCommand('A1', map.id, '36C', '240');
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC runway three six center cleared to takeoff climb to flight level two four zero',
    );
    expect(result2).toEqual(
      '1 runway three six center cleared to takeoff climbing to flight level two four zero alpha one',
    );
  });

  test('fly to', () => {
    const cmd = buildFlyToCommand('A1', map.id, TO.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC fly to tango oscar',
    );
    expect(result2).toEqual(
      '1 flying to tango oscar alpha one',
    );
  });

  test('fly to via', () => {
    const cmd = buildFlyToCommand('A1', map.id, TO.id, AT.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC fly to tango oscar via alpha tango',
    );
    expect(result2).toEqual(
      '1 flying to tango oscar via alpha tango alpha one',
    );
  });

  test('cleared to land', () => {
    const cmd = buildLandCommand('A1', map.id, R36C.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC cleared to land runway three six center',
    );
    expect(result2).toEqual(
      '1 cleared to land runway three six center alpha one',
    );
  });

  test('hold', () => {
    const cmd = buildHoldCommand('A1', map.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC hold at current position',
    );
    expect(result2).toEqual(
      '1 holding at current position alpha one',
    );
  });

  test('hold at', () => {
    const cmd = buildHoldCommand('A1', map.id, AT.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC hold at alpha tango',
    );
    expect(result2).toEqual(
      '1 holding at alpha tango alpha one',
    );
  });

  test('hold short', () => {
    const cmd = buildHoldShortCommand('A1', map.id, R36C.id);
    const flight = flightBuilder().flight;
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);
    const readback = buildReadbackMessage(cmd);
    const builder2 = new AudioBuilder(readback, map, session);

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual(
      '0 alpha one London ATC hold short runway three six center'
    );
    expect(result2).toEqual(
      '1 holding short runway three six center alpha one'
    );
  });
});

describe('AudioBuilder should generate negative messages', () => {
  test('holding short', () => {
    const flight = flightBuilder().flight;
    const cmd = buildAtGroundMessage(flight.id, map.id, R36C.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative holding short runway three six center'
    );
  });

  test('unable to land distance', () => {
    const flight = flightBuilder().flight;
    const cmd = buildTooDistanthMessage(flight.id, map.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative wrong distance'
    );
  });

  test('unable to land altitude', () => {
    const flight = flightBuilder().flight;
    const cmd = buildTooHighMessage(flight.id, map.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative wrong flight level'
    );
  });

  test('atc not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildATCNotFoundMessage(flight.id, 'PAR');
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 papa alpha romeo alpha one negative ATC not in area'
    );
  });

  test('beacon not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildBeaconNotFoundMessage(flight.id, map.id, 'BHO');
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative bravo hotel oscar not in area'
    );
  });

  test('flight not at ground not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildNotAtGroundMessage(flight.id, map.id, R36C.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative not holding short runway three six center'
    );
  });

  test('invalid flight level', () => {
    const flight = flightBuilder().flight;
    const cmd = buildInvalidFlightLevelMessage(flight.id, map.id, '044');
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative invalid flight level zero four four'
    );
  });

  test('invalid runway', () => {
    const flight = flightBuilder().flight;
    const cmd = buildInvalidRunwayMessage(flight.id, map.id, R36C.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative invalid runway three six center'
    );
  });

  test('runway not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildRunwayNotFoundMessage(flight.id, map.id, R36C.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '1 London ATC alpha one negative runway three six center not in area'
    );
  });
});

describe('AudioBuilder should generate confirm messages', () => {
  test('cleared to', () => {
    const flight = flightBuilder().flight;
    const cmd = buildClearedToMessage(map.id, flight.id, TO.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '0 alpha one London ATC cleared to tango oscar'
    );
  });

  test('cleared to leave', () => {
    const flight = flightBuilder().flight;
    const cmd = buildClearedToLeaveMessage(map.id, flight.id, TO.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '0 alpha one London ATC cleared to leave via tango oscar'
    );
  });

  test('good day', () => {
    const flight = flightBuilder().flight;
    const cmd = buildGoodDayMessage(map.id, flight.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '0 alpha one London ATC good day'
    );
  });

  test('roger', () => {
    const flight = flightBuilder().flight;
    const cmd = buildRogerMessage(map.id, flight.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '0 alpha one London ATC roger'
    );
  });
});

describe('AudioBuilder should generate error messages', () => {
  test('unknown flight', () => {
    const flight = flightBuilder().flight;
    const cmd = buildFlightNotFoundMessage(map.id, flight.id);
    const session = buildSession(flight);
    const builder1 = new AudioBuilder(cmd, map, session);

    const result1 = builder1.build();

    expect(result1).toEqual(
      '0 operator flight alpha one not in area'
    );
  });
});
