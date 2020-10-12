import { mapDao } from './modules/MapDao';
import maps from '../public/data/maps.json';
import _ from 'lodash';

function map(mapId, nodeId) {
  return maps.maps[mapId].nodes[nodeId];
}

function testHdgEntry(from, to) {
  const fromNode = map('LIN', from);
  const toNode = map('LIN', to);
  const hdg = mapDao.hdg(toNode, fromNode);
  expect(hdg).toBe(fromNode.hdg);
}

describe('MapDao LIN entries', () => {

  test('ABN', () => { testHdgEntry('ABN', 'GEN'); });
  test('BOA', () => { testHdgEntry('BOA', 'SRN'); });
  test('BZO', () => { testHdgEntry('BZO', 'SRN'); });
  test('DJ', () => { testHdgEntry('DJ', 'SRN'); });
  test('ELB', () => { testHdgEntry('ELB', 'GEN'); });
  test('FRZ', () => { testHdgEntry('FRZ', 'PAR'); });
  test('LSA', () => { testHdgEntry('LSA', 'TOP'); });
  test('PIS', () => { testHdgEntry('PIS', 'PAR'); });
  test('VIC', () => { testHdgEntry('VIC', 'SRN'); });
  test('ZUE', () => { testHdgEntry('ZUE', 'SRN'); });
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

describe('MapDao should generate center', () => {
  test('center (-2, -3), (3, 5)', () => {
    const result = mapDao.center([
      { lat: -2, lon: -3 },
      { lat: 3, lon: 5 }
    ]);
    expect(result.lat).toBeCloseTo(0.5);
    expect(result.lon).toBeCloseTo(1);
  });

  test('center (3, -179), (5, 178)', () => {
    const result = mapDao.center([
      { lat: 3, lon: -179 },
      { lat: 5, lon: 178 }
    ]);
    expect(result.lat).toBeCloseTo(4);
    expect(result.lon).toBeCloseTo(179.5);
  });

  test('center (3, -178), (5, 179)', () => {
    const result = mapDao.center([
      { lat: 3, lon: -178 },
      { lat: 5, lon: 179 }
    ]);
    expect(result.lat).toBeCloseTo(4);
    expect(result.lon).toBeCloseTo(-179.5);
  });
});

describe('MapDao should generate coords', () => {

  test('coords (0, -1), (0, 1)', () => {
    const result = mapDao.coords({
      A: { lat: 0, lon: -1 },
      B: { lat: 0, lon: 1 }
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
      A: { lat: 10, lon: 2 },
      B: { lat: 12, lon: 2 }
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
      A: { lat: 60, lon: -1 },
      B: { lat: 62, lon: 1 }
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
      hdg: 360,
      d: 0,
      to: false,
      from: false
    });
  });
});