import _ from 'lodash';
import { ATC_VOICE, FLIGHT_VOICE, say, sayFL, spell, sayAtcSign, toMp3 } from './modules/Audio';

describe('Say words', () => {

  test('atc words', () => {
    const result = toMp3('atc a b');
    expect(result).toEqual([
      '/atc/audio/atc/a.mp3',
      '/atc/audio/atc/b.mp3'
    ]);
  });

  test('flight words', () => {
    const result = toMp3('flight a b');
    expect(result).toEqual([
      '/atc/audio/flight/a.mp3',
      '/atc/audio/flight/b.mp3'
    ]);
  });

  test('atc words', () => {
    const result = toMp3('atc ab');
    expect(result).toEqual([
      '/atc/audio/atc/ab.mp3',
    ]);
  });

});

describe('Spell', () => {

  test('ab1', () => {
    const result = spell('ab1');
    expect(result).toBe('a b 1');
  });

  test('AB1', () => {
    const result = spell('AB1');
    expect(result).toEqual('a b 1');
  });

  test('AA1', () => {
    const result = spell('AA1');
    expect(result).toEqual('a pause a 1');
  });
});

describe('Say FL', () => {
  test('27000', () => {
    const result = sayFL(27000);
    expect(result).toBe('fl280');
  });

  test('27050', () => {
    const result = sayFL(27050);
    expect(result).toBe('fl280');
  });
});
