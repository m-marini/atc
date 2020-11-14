import _ from 'lodash';
import { ATC_VOICE, FLIGHT_VOICE, say, sayFL, spell, toMp3, sayId } from './modules/Audio';

describe('Say id', () => {
  test('09R', () => {
    const result = sayId('09R');
    expect(result).toBe('runway zero niner right');
  });

  test('12C', () => {
    const result = sayId('12C');
    expect(result).toBe('runway one two center');
  });

  test('34C', () => {
    const result = sayId('34L');
    expect(result).toBe('runway three four left');
  });

  test('15', () => {
    const result = sayId('15');
    expect(result).toBe('runway one five');
  });

  test('VIL', () => {
    const result = sayId('VIL');
    expect(result).toBe('victor india lima');
  });
});


describe('Spell', () => {
  test('abcdefghijklmnopqrstuvwxyz0123456789', () => {
    const result = spell('abcdefghijklmnopqrstuvwxyz0123456789');
    expect(result).toBe('alpha bravo charlie delta echo fox trot golf hotel india juliet kilo lima mike november oscar papa quebeck romeo sierra tango uniform victor whiskey x-ray yenkee zulu zero one two three four five six seven eight niner');
  });
});

describe('Say FL', () => {
  test('27000', () => {
    const result = sayFL(27000);
    expect(result).toBe('flight level two seven zero');
  });

  test('27050', () => {
    const result = sayFL(27050);
    expect(result).toBe('flight level two seven one');
  });
});
