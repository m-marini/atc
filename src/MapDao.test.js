import React from 'react';
import { mapDao } from './modules/MapDao';

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

test('coords (0, -1), (0, 1)', () => {
  const result = mapDao.coords([
    { lat: 0, lon: -1 },
    { lat: 0, lon: 1 },
  ],
    { lat: 0, lon: 0 }
  );
  expect(result.nodes[0].coords[0]).toBeCloseTo(-60);
  expect(result.nodes[0].coords[1]).toBeCloseTo(0);
  expect(result.nodes[1].coords[0]).toBeCloseTo(60);
  expect(result.nodes[1].coords[1]).toBeCloseTo(0);
});

test('coords (10, 2), (12, 2)', () => {
  const result = mapDao.coords([
    { lat: 10, lon: 2 },
    { lat: 12, lon: 2 }
  ],
    { lat: 11, lon: 2 });
  expect(result.nodes[0].coords[0]).toBeCloseTo(0);
  expect(result.nodes[0].coords[1]).toBeCloseTo(-60);
  expect(result.nodes[1].coords[0]).toBeCloseTo(0);
  expect(result.nodes[1].coords[1]).toBeCloseTo(60);
});

test('coords (60, -1), (62, 1)', () => {
  const result = mapDao.coords([
    { lat: 60, lon: -1 },
    { lat: 62, lon: 1 }
  ],
    { lat: 61, lon: 0 });
  expect(result.nodes[0].coords[0]).toBeCloseTo(-30);
  expect(result.nodes[0].coords[1]).toBeCloseTo(-60);
  expect(result.nodes[1].coords[0]).toBeCloseTo(28.168);
  expect(result.nodes[1].coords[1]).toBeCloseTo(60);
});

test('coords 3', () => {
  const result = mapDao.coords([
    {
      "lat": 45.4342909,
      "lon": 9.2771277
    },
    {
      "lat": 45.461201,
      "lon": 9.275320
    },
    {
      "lat": 44.964401,
      "lon": 8.970280
    }
  ], {
    lat: (44.964401 + 45.461201) / 2,
    lon: (8.970280 + 9.2771277) / 2
  });
  const range = (45.461201 - 44.964401) / 2 * 60;
  expect(result.nodes[1].coords[1]).toBeCloseTo(range);
  expect(result.nodes[2].coords[1]).toBeCloseTo(-range);
});
