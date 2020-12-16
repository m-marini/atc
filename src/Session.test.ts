import _ from 'lodash';
import { validateSession } from './modules/Session';

describe('Validate session', () => {
  test('valid', () => {
    const obj = {
      id: 'A',
      version: '1.1',
      level: 'x',
      map: 'x',
      t: 0,
      noFlights: 0,
      noLandedOk: 0,
      noLandedKo: 0,
      noExitOk: 0,
      noExitKo: 0,
      noCollision: 0,
      entries: {
        A: 0
      },
      flights: {
        A: {
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
        }
      },
      atcVoice: '0'
    };
    try {
      const result = validateSession(obj);
      expect(result).toBe(obj);
    } catch (err) {
      console.error(err);
      throw err;
    }
  });
});
