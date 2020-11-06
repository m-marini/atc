import _ from 'lodash';
import { AudioBuilder, toMessage } from './modules/Audio';
import { EVENT_TYPES } from './modules/Events';
import { FLIGHT_STATES } from './modules/Flight';
import { COMMAND_TYPES } from './modules/TrafficSimulator';
import { flightBuilder } from './TestUtil';

function buildMap() {
  return {
    id: 'LON',
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
    },
    voice: 'george'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 holdingshort 36C readyfordepartureto 09L',
      'george pause a 1 LONatc holdshort 36C',
      'john pause holdingshort 36C pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 holdingshort 36C readyfordeparturevia TO',
      'george pause a 1 LONatc holdshort 36C',
      'john pause holdingshort 36C pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 enter AT at fl280 heading 3 6 0 to 09L',
      'george pause a 1 LONatc maintain fl280 heading 3 6 0',
      'john pause maintaining fl280 heading 3 6 0 pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 enter AT at fl280 heading 3 6 0 leavevia TO',
      'george pause a 1 LONatc maintain fl280 heading 3 6 0',
      'john pause maintaining fl280 heading 3 6 0 pause1 a 1'
    ]);
  });

  test('climb', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(36000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.CLIMB_TO, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc climbto fl360',
      'john pause climbing fl360 pause1 a 1'
    ]);
  });

  test('descend', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(24000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.DESCEND_TO, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc descendto fl240',
      'john pause descending fl240 pause1 a 1'
    ]);
  });

  test('maintain fl', () => {
    const flight = flightBuilder()
      .alt(28000)
      .toAlt(36000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.MAINTAIN_FLIGHT_LEVEL, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc maintain fl360',
      'john pause maintaining fl360 pause1 a 1'
    ]);
  });

  test('clear to take off', () => {
    const flight = flightBuilder()
      .toAlt(4000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.CLEARED_TO_TAKE_OFF, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc 36C clearedtotakeoff fl040',
      'john pause 36C clearedtotakeoffclimbing fl040 pause1 a 1'
    ]);
  });

  test('passing', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .to('09L')
      .from('36C')
      .status(FLIGHT_STATES.FLYING)
      .flight;
    const ev = event(EVENT_TYPES.PASSING, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 passing fl040',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc flyto AT',
      'john pause flyingto AT pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc flyto TT via AT',
      'john pause flyingto TT via AT pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 flyingto AT',
      'george pause a 1 LONatc clearedto AT'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc flyto AT',
      'john pause LONatc a 1 negholdingshort 36C',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc flyto TT via AT',
      'john pause LONatc a 1 negholdingshort 36C',
      'george pause a 1 LONatc roger'
    ]);
  });

  test('cleared to land', () => {
    const flight = flightBuilder()
      .alt(4000)
      .toAlt(4000)
      .rwy('36C')
      .status(FLIGHT_STATES.APPROACHING)
      .flight;
    const ev = event(EVENT_TYPES.CLEARED_TO_LAND, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc clearedtoland 36C',
      'john pause clearedtoland 36C pause1 a 1'
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
      rwy: '09L'
    });
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc clearedtoland 09L',
      'john pause LONatc a 1 negholdingshort 36C',
      'george pause a 1 LONatc roger'
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
      rwy: '09L'
    });
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc clearedtoland 09L',
      'john pause LONatc a 1 negdistance',
      'george pause a 1 LONatc roger'
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
      rwy: '09L'
    });
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc clearedtoland 09L',
      'john pause LONatc a 1 negfl',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc goaround fl040',
      'john pause goingaround fl040 pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc 36C vacated',
      'john pause LONatc a 1 leavingfrequency',
      'george pause a 1 LONatc goodday'
    ]);
  });

  test('wrong land', () => {
    const flight = flightBuilder()
      .alt(0)
      .toAlt(0)
      .rwy('36C')
      .to('09L')
      .status(FLIGHT_STATES.LANDED)
      .flight;
    const ev = event(EVENT_TYPES.WRONG_LAND, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc 36C vacated',
      'john pause LONatc a 1 wrongrunway',
      'george pause a 1 LONatc goodday'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 goingaroundapr',
      'george pause a 1 LONatc climbto fl040',
      'john pause climbing fl040 pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 goingaroundrwy',
      'george pause a 1 LONatc climbto fl040',
      'john pause climbing fl040 pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc holdpos',
      'john pause holdingpos pause1 a 1'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc holdat AT',
      'john pause holdingat AT pause1 a 1'
    ]);
  });

  test('unable to hold', () => {
    const flight = flightBuilder()
      .from('36C')
      .status(FLIGHT_STATES.WAITING_FOR_TAKEOFF)
      .flight;
    const ev = event(EVENT_TYPES.UNABLE_TO_HOLD, flight);
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc holdpos',
      'john pause LONatc a 1 negholdingshort 36C',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause a 1 LONatc holdat AT',
      'john pause LONatc a 1 negholdingshort 36C',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 leavingvia TO at fl360',
      'george pause a 1 LONatc clearedto TO departure'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 leavingvia TO at fl320 missingdep',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 leaving fl320 heading 3 2 5 missingdep',
      'george pause a 1 LONatc roger'
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
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'john pause LONatc a 1 collision'
    ]);
  });

  test('unknown flight', () => {
    const ev = event(EVENT_TYPES.UNKWOWN_FLIGHT, undefined, undefined, {
      flight: 'A1'
    });
    const result = new AudioBuilder(ev).toAudio();
    expect(result.clips).toEqual([
      'george pause operator a 1 notinarea'
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
    expect(result.clips).toEqual(['voice a b']);
  });

  test('$alt', () => {
    const result = new AudioBuilder(EVENT).say('$alt');
    expect(result.clips).toEqual(['fl280']);
  });

  test('$hdg', () => {
    const result = new AudioBuilder(EVENT).say('$hdg');
    expect(result.clips).toEqual(['heading 3 6 0']);
  });

  test('$toAlt', () => {
    const result = new AudioBuilder(EVENT).say('$toAlt');
    expect(result.clips).toEqual(['fl360']);
  });

  test('$to', () => {
    const result = new AudioBuilder(EVENT).say('$to');
    expect(result.clips).toEqual(['TO']);
  });

  test('$at', () => {
    const result = new AudioBuilder(EVENT).say('$at');
    expect(result.clips).toEqual(['AT']);
  });

  test('$from', () => {
    const result = new AudioBuilder(EVENT).say('$from');
    expect(result.clips).toEqual(['36C']);
  });

  test('$rwy', () => {
    const result = new AudioBuilder(EVENT).say('$rwy');
    expect(result.clips).toEqual(['09L']);
  });

  test('$turnTo', () => {
    const result = new AudioBuilder(EVENT).say('$turnTo');
    expect(result.clips).toEqual(['TT']);
  });

  test('$flightId', () => {
    const result = new AudioBuilder(EVENT).say('$flightId');
    expect(result.clips).toEqual(['a 1']);
  });

  test('$atc', () => {
    const result = new AudioBuilder(EVENT).say('$atc');
    expect(result.clips).toEqual(['LONatc']);
  });
});

describe('audio', () => {
  const flight = flightBuilder().flight;
  const EVENT = event(EVENT_TYPES.ENTER, flight);

  test('atc', () => {
    const result = new AudioBuilder(EVENT).atcAudio('$hdg');
    expect(result.clips).toEqual(['george pause a 1 LONatc heading 3 6 0']);
  });

  test('flight', () => {
    const result = new AudioBuilder(EVENT).flightAudio('$hdg');
    expect(result.clips).toEqual(['john pause LONatc a 1 heading 3 6 0']);
  });

  test('readback', () => {
    const result = new AudioBuilder(EVENT).readbackAudio('$hdg');
    expect(result.clips).toEqual(['john pause heading 3 6 0 pause1 a 1']);
  });
});
