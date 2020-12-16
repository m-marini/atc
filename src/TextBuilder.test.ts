import _ from 'lodash';
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
import { Style, TextBuilder } from './modules/MessageConverters';
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

describe('TextBuilder should generate report messages', () => {
  test('departure message to rwy', () => {
    const flight = flightBuilder()
      .to(R09L.id)
      .from(R36C.id)
      .flight;
    const cmd = buildDepartureToMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, holding short runway 36C ready for departure to runway 09L'
    });
  });

  test('departure message to leave', () => {
    const flight = flightBuilder()
      .to(TO.id)
      .from(R36C.id)
      .flight;

    const cmd = buildDepartureLeaveMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, holding short runway 36C ready for departure via TO'
    });
  });

  test('enter vor to rwy', () => {
    const flight = flightBuilder()
      .to(R09L.id)
      .from(AT.id)
      .flight;
    const cmd = buildEnterToMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, enter control zone via AT to runway 09L'
    });
  });

  test('enter vor to vor', () => {
    const flight = flightBuilder()
      .to('TO')
      .from('AT')
      .flight;
    const cmd = buildEnterLeaveMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, enter control zone via AT leave TO'
    });
  });

  test('passing', () => {
    const flight = flightBuilder()
      .flight;
    const cmd = buildPassingFlightLevelMessage(flight.id, map.id, '040');
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, passing FL040'
    });
  });

  test('flying to', () => {
    const flight = flightBuilder()
      .at(AT.id)
      .flight;
    const cmd = buildFlyingToMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, flying to AT'
    });
  });

  test('right land', () => {
    const flight = flightBuilder()
      .rwy(R36C.id)
      .to(R36C.id)
      .flight;
    const cmd = buildRunwayVacated(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, runway 36C vacated'
    });
  });

  test('wrong land', () => {
    const flight = flightBuilder()
      .rwy(R36C.id)
      .to(R09L.id)
      .flight;
    const cmd = buildWrongRunwayVacated(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, runway 36C vacated, wrong arrival'
    });
  });

  test('go around missing approach', () => {
    const flight = flightBuilder().flight;
    const cmd = buildMissingApproachMessage(flight.id, map.id, '040');
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, going around missing approach'
    });
  });

  test('go around missing runway', () => {
    const flight = flightBuilder().flight;
    const cmd = buildMissingRunwayMessage(flight.id, map.id, '040');
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, going around missing runway'
    });
  });

  test('right leave', () => {
    const flight = flightBuilder()
      .exit(TO.id)
      .to(TO.id)
      .flight;
    const cmd = buildLeavingMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, leaving controlled zone via TO'
    });
  });

  test('wrong leave', () => {
    const flight = flightBuilder()
      .exit(TO.id)
      .to(AT.id)
      .flight;
    const cmd = buildLeavingMissingDepartureMessage(flight, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, leaving controlled zone via TO, missing departure'
    });
  });

  test('out of area', () => {
    const flight = flightBuilder().flight;
    const cmd = buildOutOfAreaMessage(flight.id, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, leaving controlled zone, missing departure'
    });
  });

  test('collision', () => {
    const flight = flightBuilder().flight;
    const cmd = buildCollisionMessage(flight.id, map.id);
    const builder = new TextBuilder(cmd, map, {});

    const result = builder.build();

    expect(result).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, mayday, mayday, mayday, collision'
    });
  });
});

describe('TextBuilder should generate command messages', () => {
  test('climb', () => {
    const cmd = buildClimbCommand('A1', map.id, '360');
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, climb to FL360'
    });

    expect(result2).toEqual({
      style: Style.Flight,
      text: 'climbing to FL360, A1'
    });

  });

  test('descend', () => {
    const cmd = buildDescendCommand('A1', map.id, '240');
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, descend to FL240'
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'descending to FL240, A1'
    });
  });

  test('maintain fl', () => {
    const cmd = buildMaintainCommand('A1', map.id, '240');
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, maintain FL240'
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'maintaining FL240, A1'
    });
  });

  test('clear to take off', () => {
    const cmd = buildTakeoffCommand('A1', map.id, '36C', '240');
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, runway 36C cleared to takeoff, climb to FL240',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'runway 36C cleared to takeoff, climbing to FL240, A1',
    });
  });

  test('fly to', () => {
    const cmd = buildFlyToCommand('A1', map.id, TO.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, fly to TO',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'flying to TO, A1',
    });
  });

  test('fly to via', () => {
    const cmd = buildFlyToCommand('A1', map.id, TO.id, AT.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, fly to TO via AT',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'flying to TO via AT, A1',
    });
  });

  test('cleared to land', () => {
    const cmd = buildLandCommand('A1', map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, cleared to land runway 36C',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'cleared to land runway 36C, A1',
    });
  });

  test('hold', () => {
    const cmd = buildHoldCommand('A1', map.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, hold at current position',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'holding at current position, A1',
    });
  });

  test('hold at', () => {
    const cmd = buildHoldCommand('A1', map.id, AT.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, hold at AT',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'holding at AT, A1',
    });
  });

  test('hold short', () => {
    const cmd = buildHoldShortCommand('A1', map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});
    const readback = buildReadbackMessage(cmd);
    const builder2 = new TextBuilder(readback, map, {});

    const result1 = builder1.build();
    const result2 = builder2.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, hold short runway 36C',
    });
    expect(result2).toEqual({
      style: Style.Flight,
      text: 'holding short runway 36C, A1',
    });
  });
});

describe('TextBuilder should generate negative messages', () => {
  test('holding short', () => {
    const flight = flightBuilder().flight;
    const cmd = buildAtGroundMessage(flight.id, map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, holding short runway 36C',
    });
  });

  test('unable to land distance', () => {
    const flight = flightBuilder().flight;
    const cmd = buildTooDistanthMessage(flight.id, map.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, wrong distance',
    });
  });

  test('unable to land altitude', () => {
    const flight = flightBuilder().flight;
    const cmd = buildTooHighMessage(flight.id, map.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, wrong flight level',
    });
  });

  test('atc not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildATCNotFoundMessage(flight.id, 'PAR');
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'PAR, A1, negative, ATC not in area',
    });
  });

  test('beacon not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildBeaconNotFoundMessage(flight.id, map.id, 'BHO');
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, BHO not in area',
    });
  });

  test('flight not at ground not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildNotAtGroundMessage(flight.id, map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, not holding short runway 36C',
    });
  });

  test('invalid flight level', () => {
    const flight = flightBuilder().flight;
    const cmd = buildInvalidFlightLevelMessage(flight.id, map.id, '044');
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, invalid FL044',
    });
  });

  test('invalid runway', () => {
    const flight = flightBuilder().flight;
    const cmd = buildInvalidRunwayMessage(flight.id, map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, invalid runway 36C',
    });
  });

  test('runway not found', () => {
    const flight = flightBuilder().flight;
    const cmd = buildRunwayNotFoundMessage(flight.id, map.id, R36C.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Flight,
      text: 'London ATC, A1, negative, runway 36C not in area',
    });
  });
});

describe('TextBuilder should generate confirm messages', () => {
  test('cleared to', () => {
    const flight = flightBuilder().flight;
    const cmd = buildClearedToMessage(map.id, flight.id, TO.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, cleared to TO',
    });
  });

  test('cleared to leave', () => {
    const flight = flightBuilder().flight;
    const cmd = buildClearedToLeaveMessage(map.id, flight.id, TO.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, cleared to leave via TO',
    });
  });

  test('good day', () => {
    const flight = flightBuilder().flight;
    const cmd = buildGoodDayMessage(map.id, flight.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, good day',
    });
  });

  test('roger', () => {
    const flight = flightBuilder().flight;
    const cmd = buildRogerMessage(map.id, flight.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.ATC,
      text: 'A1, London ATC, roger',
    });
  });
});

describe('TextBuilder should generate error messages', () => {
  test('unknown flight', () => {
    const flight = flightBuilder().flight;
    const cmd = buildFlightNotFoundMessage(map.id, flight.id);
    const builder1 = new TextBuilder(cmd, map, {});

    const result1 = builder1.build();

    expect(result1).toEqual({
      style: Style.Error,
      text: 'operator, flight A1 not in area',
    });
  });

});
