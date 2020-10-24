import _ from 'lodash';
import { toMessage } from './modules/Audio';

describe('toMessage', () => {
  test('a pause 1', () => {
    const result = toMessage('atc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'A1'
    })
  });

  test('lonatc', () => {
    const result = toMessage('atc LONatc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'London ATC A1'
    })
  });

  test('lonatc', () => {
    const result = toMessage('atc LONatc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'London ATC A1'
    })
  });

  test('linatc', () => {
    const result = toMessage('atc LINatc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Milan ATC A1'
    })
  });

  test('paratc', () => {
    const result = toMessage('atc PARatc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Paris ATC A1'
    })
  });

  test('ffmatc', () => {
    const result = toMessage('atc FFMatc a pause 1');
    expect(result).toEqual({
      type: 'atc',
      msg: 'Frankfurt ATC A1'
    })
  });

  test('fl320', () => {
    const result = toMessage('atc fl320');
    expect(result).toEqual({
      type: 'atc',
      msg: 'FL320'
    })
  });

  test('36R', () => {
    const result = toMessage('atc 36R');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36R'
    })
  });

  test('36L', () => {
    const result = toMessage('atc 36L');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36L'
    })
  });

  test('36C', () => {
    const result = toMessage('atc 36C');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36C'
    })
  });

  test('36', () => {
    const result = toMessage('atc 36');
    expect(result).toEqual({
      type: 'atc',
      msg: 'runway 36'
    })
  });

  test('heading 258', () => {
    const result = toMessage('atc heading 2 pause 5 pause 8');
    expect(result).toEqual({
      type: 'atc',
      msg: 'hdg 258'
    })
  });

  test('negative', () => {
    const result = toMessage('atc negative');
    expect(result).toEqual({
      type: 'atc',
      msg: 'negative'
    })
  });

  test('via', () => {
    const result = toMessage('atc via');
    expect(result).toEqual({
      type: 'atc',
      msg: 'via'
    })
  });

  test('clearedtoland', () => {
    const result = toMessage('atc clearedtoland');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to land'
    })
  });

  test('clearedto', () => {
    const result = toMessage('atc clearedto');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to'
    })
  });

  test('clearedto', () => {
    const result = toMessage('atc clearedto');
    expect(result).toEqual({
      type: 'atc',
      msg: 'cleared to'
    })
  });

  test('right land', () => {
    const result = toMessage('george pause a pause 1 LONatc 36C vacated');
    expect(result).toEqual({
      type: 'george',
      msg: 'A1 London ATC runway 36C vacated'
    })
  });
});