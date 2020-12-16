import _ from 'lodash';
import { validateFlight } from './modules/Flight';

describe('Validate flight', () => {
  test('valid', () => {
    const obj = {
      id: 'A',
      type: 'J',
      status: 'waiting-for-takeoff',
      lat: 0,
      lon: 0,
      hdg: 0,
      speed: 0,
      alt: 0,
      toAlt: 0,
      to: 'TO',
      from: 'A',
      voice: 'a'
    };
    try {
      const result = validateFlight(obj);
      expect(result).toBe(obj);
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
});
