import _ from 'lodash';
import { toMessage } from './modules/Audio';

describe('toMessage', () => {
  test('a pause 1', () => {
    const result = toMessage('atc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'A1'
    })
  });

  test('lonatc', () => {
    const result = toMessage('atc LONatc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'London ATC A1'
    })
  });

  test('lonatc', () => {
    const result = toMessage('atc LONatc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'London ATC A1'
    })
  });

  test('linatc', () => {
    const result = toMessage('atc LINatc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Milan ATC A1'
    })
  });

  test('paratc', () => {
    const result = toMessage('atc PARatc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Paris ATC A1'
    })
  });

  test('ffmatc', () => {
    const result = toMessage('atc FFMatc a pause 1', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Frankfurt ATC A1'
    })
  });

  test('fl320', () => {
    const result = toMessage('atc fl320', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'FL320'
    })
  });

  test('36R', () => {
    const result = toMessage('atc 36R', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36R'
    })
  });

  test('36L', () => {
    const result = toMessage('atc 36L', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36L'
    })
  });

  test('36C', () => {
    const result = toMessage('atc 36C', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36C'
    })
  });

  test('36', () => {
    const result = toMessage('atc 36', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36'
    })
  });

  test('heading 258', () => {
    const result = toMessage('atc heading 2 pause 5 pause 8', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'hdg 258'
    })
  });

  test('negative', () => {
    const result = toMessage('atc negative', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'negative'
    })
  });

  test('via', () => {
    const result = toMessage('atc via', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'via'
    })
  });

  test('clearedtoland', () => {
    const result = toMessage('atc clearedtoland', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to land'
    })
  });

  test('clearedto', () => {
    const result = toMessage('atc clearedto', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to'
    })
  });

  test('clearedto', () => {
    const result = toMessage('atc clearedto', 'atc');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to'
    })
  });

  test('right land', () => {
    const result = toMessage('george pause a pause 1 LONatc 36C vacated', 'atc');
    expect(result).toEqual({
      type: 'flight',
      msg: 'A1 London ATC runway 36C vacated'
    })
  });
});