import { mapDao } from './modules/MapDao';
import maps from '../public/data/maps.json';
import _ from 'lodash';
import { multipleTest, rndFloat } from './TestUtil';
import { AreaMapSet, HeadingMapNode, MapNodeAlignment, MapNodeType, MapRouteType, validateAreaMapSet } from './modules/Map';
import { ValidatorResult } from 'jsonschema';

function createTestHdgMapEntry(mapId: string) {
  const map = (maps as unknown as AreaMapSet).maps[mapId];
  _(map.nodes)
    .values()
    .filter({ type: MapNodeType.Entry })
    .forEach(from => {
      const route = _(map.routes).find(node => {
        return node.type === MapRouteType.Entry && (
          node.edges[0] === from.id
          || node.edges[1] === from.id);
      });
      if (route) {
        const toId = route.edges[0] === from.id
          ? route.edges[1]
          : route.edges[0];
        const to = map.nodes[toId];
        test(`${from.id} -> ${to.id}`, () => {
          const hdg = mapDao.hdg(to, from);
          expect(hdg).toBe((from as HeadingMapNode).hdg);
        });
      }
    });
}

describe('validate AreaMap', () => {
  test('valid json', () => {
    const obj: any = {
      maps: {
        aa: {
          id: 'aa',
          name: 'aaa',
          descr: 'a',
          type: 'entry',
          center: {
            lat: 0,
            lon: 0
          },
          nodes: {
            A: {
              id: 'A',
              type: 'entry',
              alignment: 'N',
              lat: 0,
              lon: 0,
              hdg: 0
            }
          },
          routes: [
            {
              type: 'entry',
              edges: ['A', 'B']
            }
          ]
        }
      }
    };
    
    try {
      const result = validateAreaMapSet(obj);
      expect(result).toEqual(obj);
    } catch (err) {
      console.error(err);
      throw err;
    }
  });

  test('wrong', () => {
    const obj: any = {};
    expect(() => {
      return validateAreaMapSet(obj)
    }).toThrow('requires property "maps"');
  });
});

test('MM', () => {
  const rwy = maps.maps['MUN'].nodes['26'];
  const om = mapDao.radial(rwy, rwy.hdg + 180, 7);
  console.log(JSON.stringify(om, undefined, 2));
});

describe('MapDao MUN entries', () => {
  createTestHdgMapEntry('MUN');
});

describe('MapDao FFM entries', () => {
  createTestHdgMapEntry('FFM');
});

describe('MapDao LON entries', () => {
  createTestHdgMapEntry('LON');
});

describe('MapDao LIN entries', () => {
  createTestHdgMapEntry('LIN');
});

describe('MapDao PAR entries', () => {
  createTestHdgMapEntry('PAR');
});

describe('MapDao should generate heading', () => {
  const center = { lat: 45, lon: 10 };
  test('hdg 360', () => {
    const result = mapDao.hdg({ lat: 46, lon: 10 }, center);
    expect(result).toBe(360);
  });

  test('hdg 90', () => {
    const result = mapDao.hdg({ lat: 45, lon: 11 }, center);
    expect(result).toBe(90);
  });

  test('hdg 180', () => {
    const result = mapDao.hdg({ lat: 44, lon: 10 }, center);
    expect(result).toBe(180);
  });

  test('hdg 270', () => {
    const result = mapDao.hdg({ lat: 45, lon: 9 }, center);
    expect(result).toBe(270);
  });

  test('hdg 45', () => {
    const result = mapDao.hdg({ lat: 45.1, lon: 10 + 0.1 * Math.SQRT2 }, center);
    expect(result).toBe(45);
  });

  test('hdg 225', () => {
    const result = mapDao.hdg({ lat: 44.9, lon: 10 - 0.1 * Math.SQRT2 }, center);
    expect(result).toBe(225);
  });
});

describe('MapDao should generate xy coordinates', () => {
  test('xy 0, 0', () => {
    const result = mapDao.xy({ lat: 0, lon: 0 }, { lat: 0, lon: 0 });
    expect(result).toEqual([0, 0]);
  });

  test('xy 1, 0', () => {
    const result = mapDao.xy({ lat: 1, lon: 0 }, { lat: 0, lon: 0 });
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(60);
  });

  test('xy 0, 1', () => {
    const result = mapDao.xy({ lat: 0, lon: 1 }, { lat: 0, lon: 0 });
    expect(result[0]).toBeCloseTo(60);
    expect(result[1]).toBeCloseTo(0);
  });

  test('xy 60, 1', () => {
    const result = mapDao.xy({ lat: 60, lon: 1 }, { lat: 60, lon: 0 });
    expect(result[0]).toBeCloseTo(30);
    expect(result[1]).toBeCloseTo(0);
  });

  test('xy -179, 60', () => {
    const result = mapDao.xy({ lat: 60, lon: -179 }, { lat: 60, lon: 179 });
    expect(result[0]).toBeCloseTo(60);
    expect(result[1]).toBeCloseTo(0);
  });

  test('xy 179, 60', () => {
    const result = mapDao.xy({ lat: 60, lon: 179 }, { lat: 60, lon: -179 });
    expect(result[0]).toBeCloseTo(-60);
    expect(result[1]).toBeCloseTo(0);
  });
});

// describe('MapDao should generate center', () => {
//   test('center (-2, -3), (3, 5)', () => {
//     const result = mapDao.center([
//       { lat: -2, lon: -3 },
//       { lat: 3, lon: 5 }
//     ]);
//     expect(result.lat).toBeCloseTo(0.5);
//     expect(result.lon).toBeCloseTo(1);
//   });

//   test('center (3, -179), (5, 178)', () => {
//     const result = mapDao.center([
//       { lat: 3, lon: -179 },
//       { lat: 5, lon: 178 }
//     ]);
//     expect(result.lat).toBeCloseTo(4);
//     expect(result.lon).toBeCloseTo(179.5);
//   });

//   test('center (3, -178), (5, 179)', () => {
//     const result = mapDao.center([
//       { lat: 3, lon: -178 },
//       { lat: 5, lon: 179 }
//     ]);
//     expect(result.lat).toBeCloseTo(4);
//     expect(result.lon).toBeCloseTo(-179.5);
//   });
// });

describe('MapDao should generate coords', () => {

  test('coords (0, -1), (0, 1)', () => {
    const result = mapDao.coords({
      A: { lat: 0, lon: -1, id: 'A', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N },
      B: { lat: 0, lon: 1, id: 'B', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N }
    },
      { lat: 0, lon: 0 });
    expect(result).toMatchObject({
      nodes: {
        A: {
          node: { lat: 0, lon: -1 },
          coords: [-60, 0]
        },
        B: {
          node: { lat: 0, lon: 1 },
          coords: [60, 0]
        }
      },
      xmin: -60,
      xmax: 60,
      ymin: 0,
      ymax: 0
    });
    expect(result.range).toBeCloseTo(60);
  });

  test('coords (10, 2), (12, 2)', () => {
    const result = mapDao.coords({
      A: { lat: 10, lon: 2, id: 'A', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N },
      B: { lat: 12, lon: 2, id: 'B', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N }
    },
      { lat: 11, lon: 2 });
    expect(result).toMatchObject({
      nodes: {
        A: {
          node: { lat: 10, lon: 2 },
          coords: [0, -60]
        },
        B: {
          node: { lat: 12, lon: 2 },
          coords: [0, 60]
        }
      },
      xmin: 0,
      xmax: 0,
      ymin: -60,
      ymax: 60
    });
    expect(result.range).toBeCloseTo(60);
  });

  test('coords (60, -1), (62, 1)', () => {
    const result = mapDao.coords({
      A: { lat: 60, lon: -1, id: 'A', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N },
      B: { lat: 62, lon: 1, id: 'B', type: MapNodeType.Beacon, alignment: MapNodeAlignment.N }
    },
      { lat: 61, lon: 0 });
    expect(result).toMatchObject({
      nodes: {
        A: {
          node: { lat: 60, lon: -1 }
        },
        B: {
          node: { lat: 62, lon: 1 }
        }
      },
      xmax: 60 * Math.cos(62 * Math.PI / 180),
      ymin: -60,
      ymax: 60
    });
    expect(result.nodes.A.coords[0]).toBeCloseTo(-30);
    expect(result.nodes.A.coords[1]).toBeCloseTo(-60);
    expect(result.nodes.B.coords[0]).toBeCloseTo(60 * Math.cos(62 * Math.PI / 180));
    expect(result.nodes.B.coords[1]).toBeCloseTo(60);
    expect(result.xmin).toBeCloseTo(-30);
    expect(result.range).toBeCloseTo(66.87813424112949);
  });
});

describe('MapDao should compute distance between same point', () => {
  multipleTest(() => {
    const lat = rndFloat(-80, 80);
    const lon = rndFloat(-180, 180);
    test(`lat: ${lat}, lon=${lon}`, () => {
      const p = { lat, lon };
      expect(mapDao.distance(p, p)).toBeCloseTo(0);
    });
  });
});

describe('MapDao should compute distance along meridian', () => {
  multipleTest(() => {
    const lat0 = rndFloat(-80, 80);
    const lon = rndFloat(-180, 180);
    const dl = rndFloat(0, 200)
    const lat1 = lat0 + dl / 60;
    test(`lat0: ${lat0}, lat1: ${lat1}, lon:${lon}`, () => {
      const p0 = { lat: lat0, lon };
      const p1 = { lat: lat1, lon };

      const result0 = mapDao.distance(p0, p1);
      expect(result0).toBeCloseTo(dl);

      const result1 = mapDao.distance(p1, p0);
      expect(result1).toBeCloseTo(dl);
    });
  });
});

describe('MapDao should compute distance along parallel', () => {
  multipleTest(() => {
    const lat = rndFloat(-80, 80);
    const lon0 = rndFloat(-180, 180);
    const dl = rndFloat(0, 2);
    const l = lon0 + dl;
    const lon1 = l >= 180 ? l - 360 : l;
    test(`lat: ${lat}, lon0: ${lon0}, lon1:${lon1}`, () => {
      const p0 = { lat, lon: lon0 };
      const p1 = { lat, lon: lon1 };
      const exp = dl * 60 * Math.cos(lat * Math.PI / 180);

      const result0 = mapDao.distance(p0, p1);
      expect(result0).toBeCloseTo(exp);

      const result1 = mapDao.distance(p1, p0);
      expect(result1).toBeCloseTo(exp);
    });
  });
});

describe('MapDao should generate route info', () => {

  const NODE = {
    lat: 45,
    lon: 10
  };

  test('path to', () => {

    const PLANE = {
      lat: 45 - 20 / 60,
      lon: 10,
      hdg: 45
    };

    const result = mapDao.route(PLANE, NODE);

    expect(result).toMatchObject({
      hdg: 360,
      angle: -45,
      to: true,
      from: false
    });
    expect(result.d).toBeCloseTo(20);
  });

  test('path to direct', () => {

    const PLANE = {
      lat: 45 - 20 / 60,
      lon: 10,
      hdg: 360
    };

    const result = mapDao.route(PLANE, NODE);

    expect(result).toMatchObject({
      hdg: 360,
      angle: 0,
      to: true,
      from: false
    });
    expect(result.d).toBeCloseTo(20);
  });

  test('path from', () => {

    const PLANE = {
      lat: 45 - 20 / 60,
      lon: 10,
      hdg: 120
    };

    const result = mapDao.route(PLANE, NODE);

    expect(result).toMatchObject({
      hdg: 360,
      angle: -120,
      to: false,
      from: true
    });
    expect(result.d).toBeCloseTo(20);
  });

  test('path from oppostite', () => {

    const PLANE = {
      lat: 45 - 20 / 60,
      lon: 10,
      hdg: 180
    };

    const result = mapDao.route(PLANE, NODE);

    expect(result).toMatchObject({
      hdg: 360,
      angle: -180,
      to: false,
      from: true
    });
    expect(result.d).toBeCloseTo(20);
  });

  test('path in', () => {
    const result = mapDao.route(NODE, NODE);

    expect(result).toMatchObject({
      d: 0,
      to: false,
      from: false
    });
  });
});
