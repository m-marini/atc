import { mapDao } from './modules/MapDao';
import maps from '../public/data/maps.json';
import _ from 'lodash';
import { multipleTest, multipleTestWithData } from './TestUtil';

describe('Multiple test', () => {
  multipleTest('Test', i => {
    test(`${i}`, () => {
      expect(i).toBe(i);
    });
  });
});

describe('Multiple data test', () => {
  multipleTestWithData('test', [
    'a', 'b', 'c'
  ], data => {
    test(data, () => {
      expect(data).toBe(data);
    });
  });
});