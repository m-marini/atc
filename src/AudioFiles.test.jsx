import { mapDao } from './modules/MapDao';
import _ from 'lodash';
import maps from '../public/data/maps.json';
import { MESSAGES, toMp3 } from './modules/Audio';
import { map } from 'rxjs/operators';
import fs from 'fs';

function createFileList() {
  // numbers
  const nums = _.range(0, 10).map(n => n.toString());
  const alphas = _.range(0, 26).map(n => String.fromCharCode(97 + n));
  const nodes = _(maps.maps).flatMap(map => {
    return _(map.nodes).values().map('id').value();
  }).value();
  const tags = _(MESSAGES).keys().value();
  return _(_.concat(nums, alphas, nodes, tags))
    .map(f => f.toLowerCase())
    .uniq()
    .value();
}

describe('Check for audio files', () => {
  test('list missing george files', () => {
    const names = createFileList();
    const files = names.map(tag => `./public/audio/george/${tag}.mp3`);
    const missing = files.filter(f => {
      return !fs.existsSync(f);
    })
    .sort();
    fs.writeFileSync('george-missing.txt', missing.join('\n'));
    expect(missing).toHaveLength(0);
  })

  test('list missing john files', () => {
    const names = createFileList();
    const files = names.map(tag => `./public/audio/john/${tag}.mp3`);
    const missing = files.filter(f => {
      return !fs.existsSync(f);
    })
    .sort();
    fs.writeFileSync('john-missing.txt', missing.join('\n'));
    expect(missing).toHaveLength(0);
  })
});
