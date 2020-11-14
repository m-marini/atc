import _ from 'lodash';
import { AudioBuilder, toMessage } from './modules/Audio';
import { EVENT_TYPES } from './modules/Events';
import { FLIGHT_STATES } from './modules/Flight';
import { COMMAND_TYPES } from './modules/TrafficSimulator';
import { flightBuilder } from './TestUtil';

function buildMap() {
  return {
    id: 'LON',
    name: 'London ATC',
    nodes: {
      TO: {
        td: 'TO',
        type: 'beacon',
      },
      AT: {
        td: 'AT',
        type: 'beacon'
      },
      TT: {
        td: 'TT',
        type: 'beacon'
      },
      '36C': {
        id: '36C',
        type: 'runway'
      },
      '09L': {
        id: '09L',
        type: 'runway'
      }
    }
  };
}

function event(type, flight, map, cmd) {
  if (!map) {
    map = buildMap();
  }
  return { type, flight, map, cmd };
}

describe('events', () => {
  test('enter rwy to rwy', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(28000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.ENTER, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one holding short runway three six center ready for departure to runway zero niner left',
      'george alpha one London ATC hold short runway three six center',
      'john holding short runway three six center alpha one'
    ]);
  });

  test('enter rwy to vor', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(28000)
      .to('TO')
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.ENTER, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one holding short runway three six center ready for departure via tango oscar',
      'george alpha one London ATC hold short runway three six center',
      'john holding short runway three six center alpha one'
    ]);
  });

  test('enter vor to rwy', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(28000)
      .to('09L')
      .from('AT')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.ENTER, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one enter control zone via alpha tango to runway zero niner left',
      'george alpha one London ATC roger'
    ]);
  });

  test('enter vor to vor', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(28000)
      .to('TO')
      .from('AT')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.ENTER, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one enter control zone via alpha tango leave via tango oscar',
      'george alpha one London ATC roger'
    ]);
  });

  test('climb', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(36000)
      .to('zero niner left')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.CLIMB_TO, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC climb to flight level three six zero',
      'john climbing to flight level three six zero alpha one'
    ]);
  });

  test('descend', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(24000)
      .to('zero niner left')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.DESCEND_TO, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC descend to flight level two four zero',
      'john descending to flight level two four zero alpha one'
    ]);
  });

  test('maintain fl', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(36000)
      .to('zero niner left')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC maintain flight level three six zero',
      'john maintaining flight level three six zero alpha one'
    ]);
  });

  test('clear to take off', () => {
    const flight = flightBuilder()
      .toAlt(4000)
      .to('zero niner left')
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.CLEARED_TO_TAKE_OFF, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC runway three six center cleared to take off climb to flight level zero four zero',
      'john runway three six center cleared to take off climbing to flight level zero four zero alpha one'
    ]);
  });

  test('passing', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .to('zero niner left')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.PASSING, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one passing flight level zero four zero',
      'george alpha one London ATC roger'
    ]);
  });

  test('fly to', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .at('AT')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.FLY_TO, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC fly to alpha tango',
      'john flying to alpha tango alpha one'
    ]);
  });

  test('fly to via', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .turnTo('TT')
      .at('AT')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.FLY_TO_VIA, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC fly to tango tango via alpha tango',
      'john flying to tango tango via alpha tango alpha one'
    ]);
  });

  test('flying to', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .turnTo('TT')
      .at('AT')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.FLYING_TO, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one flying to alpha tango',
      'george alpha one London ATC cleared to alpha tango'
    ]);
  });

  test('unable to fly to', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_FLY_TO, flight, undefined, {
      type: COMMAND_TYPES.FLY_TO,
      flight: 'A1',
      to: 'AT'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC fly to alpha tango',
      'john London ATC alpha one negative holding short runway three six center',
      'george alpha one London ATC roger'
    ]);
  });

  test('unable to fly to via', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_FLY_TO_VIA, flight, undefined, {
      type: COMMAND_TYPES.FLY_TO,
      flight: 'A1',
      to: 'TT',
      when: 'AT'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC fly to tango tango via alpha tango',
      'john London ATC alpha one negative holding short runway three six center',
      'george alpha one London ATC roger'
    ]);
  });

  test('cleared to land', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.APPROACHING)
      .flight;
    const ev = event(EVENT_TYPES.CLEARED_TO_LAND, flight, undefined, { to: '36C' });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC cleared to land runway three six center',
      'john cleared to land runway three six center alpha one'
    ]);
  });

  test('unable to land ground', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_LAND_GROUND, flight, undefined, {
      to: '09L'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC cleared to land runway zero niner left',
      'john London ATC alpha one negative holding short runway three six center',
      'george alpha one London ATC roger'
    ]);
  });

  test('unable to land distance', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_LAND_DISTANCE, flight, undefined, {
      to: '09Ll'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC cleared to land runway zero niner left',
      'john London ATC alpha one negative wrong distance',
      'george alpha one London ATC roger'
    ]);
  });

  test('unable to land altitude', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_LAND_ALTITUDE, flight, undefined, {
      to: '09L'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC cleared to land runway zero niner left',
      'john London ATC alpha one negative wrong flight level',
      'george alpha one London ATC roger'
    ]);
  });

  test('atc go around', () => {
    const flight = flightBuilder()
      .alt(1000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.APPROACHING)
      .flight;
    const ev = event(EVENT_TYPES.ATC_GO_AROUND, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC pull up and go around climb to flight level zero four zero',
      'john pulling up and going around climbing to flight level zero four zero alpha one'
    ]);
  });

  test('right land', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .rwy('36C')
      .to('36C')
      .status(FLIGHT_STATES.LANDED)
      .flight;
    const ev = event(EVENT_TYPES.RIGHT_LAND, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC runway three six center vacated',
      'john London ATC alpha one leaving frequency',
      'george alpha one London ATC good day'
    ]);
  });

  test('wrong land', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .rwy('36C')
      .to('zero niner left')
      .status(FLIGHT_STATES.LANDED)
      .flight;
    const ev = event(EVENT_TYPES.WRONG_LAND, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC runway three six center vacated',
      'john London ATC alpha one wrong arrival runway leaving frequency',
      'george alpha one London ATC good day'
    ]);
  });

  test('go around approach', () => {
    const flight = flightBuilder()
      .alt(1000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.GO_AROUND_APPROACH, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one going around missing approach',
      'george alpha one London ATC climb to flight level zero four zero',
      'john climbing to flight level zero four zero alpha one'
    ]);
  });

  test('go around runway', () => {
    const flight = flightBuilder()
      .alt(1000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.GO_AROUND_RUNWAY, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one going around missing runway',
      'george alpha one London ATC climb to flight level zero four zero',
      'john climbing to flight level zero four zero alpha one'
    ]);
  });

  test('hold', () => {
    const flight = flightBuilder()
      .alt(41000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.HOLDING_TO)
      .flight;
    const ev = event(EVENT_TYPES.HOLD, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC hold at current position',
      'john holding at current position alpha one'
    ]);
  });

  test('hold at', () => {
    const flight = flightBuilder()
      .alt(41000)
      .toAlt(4000)
      .rwy('36C')
      .at('AT')
      .status(FLIGHT_STATES.HOLDING_TO)
      .flight;
    const ev = event(EVENT_TYPES.HOLD_AT, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC hold at alpha tango',
      'john holding at alpha tango alpha one'
    ]);
  });

  test('unable to hold', () => {
    const flight = flightBuilder()
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_HOLD, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC hold at current position',
      'john London ATC alpha one negative holding short runway three six center',
      'george alpha one London ATC roger'
    ]);
  });

  test('unable to hold at', () => {
    const flight = flightBuilder()
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_HOLD_AT, flight, undefined, {
      when: 'AT'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george alpha one London ATC hold at alpha tango',
      'john London ATC alpha one negative holding short runway three six center',
      'george alpha one London ATC roger'
    ]);
  });

  test('right leave', () => {
    const flight = flightBuilder()
      .from('36C')
      .to('TO')
      .alt(36000)
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.RIGHT_LEAVE, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one leaving controlled zone via tango oscar',
      'george alpha one London ATC cleared to tango oscar departure'
    ]);
  });

  test('wrong leave', () => {
    const flight = flightBuilder()
      .from('36C')
      .exit('TO')
      .alt(30000)
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.WRONG_LEAVE, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one leaving controlled zone via tango oscar missing departure',
      'george alpha one London ATC roger'
    ]);
  });

  test('out of area', () => {
    const flight = flightBuilder()
      .from('36C')
      .at('TO')
      .hdg(325)
      .alt(30000)
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.OUT_OF_AREA, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one leaving controlled zone missing departure',
      'george alpha one London ATC roger'
    ]);
  });

  test('collision', () => {
    const flight = flightBuilder()
      .from('36C')
      .at('TO')
      .hdg(325)
      .alt(30000)
      .status(FLIGHT_STATES.FLYING_TO)
      .flight;
    const ev = event(EVENT_TYPES.COLLISION, flight);
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'john London ATC alpha one mayday mayday mayday collision'
    ]);
  });

  test('unknown flight', () => {
    const ev = event(EVENT_TYPES.UNKWOWN_FLIGHT, undefined, undefined, {
      flight: 'A1'
    });
    const result = new AudioBuilder(ev, 'george').build();
    expect(result).toEqual([
      'george operator London ATC flight alpha one not in area'
    ]);
  });

});

describe('say', () => {
  const flight = flightBuilder()
    .alt(28000)
    .toAlt(36000)
    .to('TO')
    .turnTo('TT')
    .at('AT')
    .from('36C')
    .rwy('09L')
    .flight;
  const EVENT = event(EVENT_TYPES.ENTER, flight);

  test('voice a b', () => {
    const result = new AudioBuilder(EVENT).say('voice a b');
    expect(result).toEqual('voice a b');
  });

  test('$alt', () => {
    const result = new AudioBuilder(EVENT).say('$alt');
    expect(result).toEqual('flight level two eight zero');
  });

  test('$toAlt', () => {
    const result = new AudioBuilder(EVENT).say('$toAlt');
    expect(result).toEqual('flight level three six zero');
  });

  test('$to', () => {
    const result = new AudioBuilder(EVENT).say('$to');
    expect(result).toEqual('tango oscar');
  });

  test('$at', () => {
    const result = new AudioBuilder(EVENT).say('$at');
    expect(result).toEqual('alpha tango');
  });

  test('$from', () => {
    const result = new AudioBuilder(EVENT).say('$from');
    expect(result).toEqual('runway three six center');
  });

  test('$rwy', () => {
    const result = new AudioBuilder(EVENT).say('$rwy');
    expect(result).toEqual('runway zero niner left');
  });

  test('$turnTo', () => {
    const result = new AudioBuilder(EVENT).say('$turnTo');
    expect(result).toEqual('tango tango');
  });

  test('$flightId', () => {
    const result = new AudioBuilder(EVENT).say('$flightId');
    expect(result).toEqual('alpha one');
  });

  test('$atc', () => {
    const result = new AudioBuilder(EVENT).say('$atc');
    expect(result).toEqual('London ATC');
  });
});
