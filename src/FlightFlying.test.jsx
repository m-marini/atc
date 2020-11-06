import { NODE_TYPES, TRAFFIC_SIM_DEFAULTS } from './modules/TrafficSimulator';
import _ from 'lodash';
import { mapDao } from './modules/MapDao';
import { Flight, FLIGHT_STATES } from './modules/Flight';
import { flightBuilder, distance, speedByAlt, multipleTest, turnedHdg, rndHdg, rndInt, rndMidFL, rndFL } from './TestUtil';
import { EVENT_TYPES } from './modules/Events';

const DT = 10; // sec

const RUNWAY = {
  id: 'RUNWAY',
  type: NODE_TYPES.RUNWAY,
  lat: 45,
  lon: 11,
  hdg: 132
};

const ENTRY = {
  id: 'ENTRY',
  type: NODE_TYPES.ENTRY,
  lat: 46,
  lon: 10,
  hdg: 132
};

const BEACON = {
  id: 'BEACON',
  type: NODE_TYPES.BEACON,
  lat: 44,
  lon: 9
};

const map = {
  id: 'LRX',
  name: 'Lamarx',
  nodes: { RUNWAY, BEACON, ENTRY },
  center: {
    lat: 45,
    lon: 10
  }
};


function props(props = {}, withMessages) {
  if (!withMessages) {
    return _.defaults({}, props, {
      dt: DT,
      map: map
    }, TRAFFIC_SIM_DEFAULTS);
  } else {
    return _.defaults({}, props, {
      dt: DT,
      map: map,
      sendMessage: msg => { console.log(msg); }
    }, TRAFFIC_SIM_DEFAULTS);
  }
}

multipleTest('Flight should process time when large turning to BEACON', () => {
  const hdg = rndHdg();
  const maxa = DT * 3;
  const da = mapDao.normAngle(180 - rndInt(-maxa, maxa + 1));
  const r = mapDao.normHdg(hdg + da + 180);
  const d = rndInt(5, 10);

  test(`D${d} R${r} hdg ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, r)
      .hdg(hdg)
      .at(BEACON.id)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const hdg1 = turnedHdg(hdg, r + 180, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
  });
});

multipleTest('Flight should process time when passing BEACON during large turn', () => {
  const hdg = Math.floor(Math.random() * 360 + 1);
  const maxa = DT * 3;
  const da = mapDao.normAngle(180 - rndInt(-maxa, maxa + 1));
  const r = mapDao.normHdg(hdg + da + 180);
  const d = rndInt(1, 4) / 10;

  test(`D${d} R${r} hdg ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, r)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .at(BEACON.id)
      .status(FLIGHT_STATES.FLYING_TO).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const hdg1 = turnedHdg(hdg, r + 180, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(undefined);
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg1);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

multipleTest('Flight should process time when flying', () => {
  const hdg = rndHdg();
  test(`hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .alt(28000)
      .toAlt(28000)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    expect(result).toBeHdg(hdg);
    expect(result).toBeAlt(28000);
    expect(result).toBeToAlt(28000);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeRadial(A1, distance(A1.speed, DT), hdg);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
  });
});

multipleTest('Flight should process time when flying descending', () => {
  const hdg = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(500, 4000);
  test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const d = distance(A1.speed, DT);
    expect(result).toBeDescentFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, d, hdg);
  });
});

multipleTest('Flight should process time when flying climbing', () => {
  const hdg = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(500, 4000);

  test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .status(FLIGHT_STATES.FLYING).flight;

    const result = new Flight(A1, props())
      .processTime().flight;

    const d = distance(A1.speed, DT);
    expect(result).toBeClimbedFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(result).toBeRadial(A1, d, hdg);
  });
});

multipleTest('Flight should process time when flying climbing and passing FL', () => {
  const hdg = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(1, 100);

  test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
    const hdg = 210;
    const d0 = 10;
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .status(FLIGHT_STATES.FLYING).flight;
    const events = [];
    const result = new Flight(A1, props({
      onEvent: ev => events.push(ev)
    }))
      .processTime().flight;

    const d = distance(A1.speed, DT);
    expect(result).toBeRadial(A1, d, hdg);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(events).toEqual([{
      type: EVENT_TYPES.PASSING,
      flight: result,
      map
    }])
  });
});

multipleTest('Flight should process time when flying descending and passing FL', () => {
  const hdg = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(1, 100);

  test(`${alt}' to ${toAlt}', hdg: ${hdg}`, () => {
    const hdg = 210;
    const d0 = 10;
    const A1 = flightBuilder()
      .at(map.center)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .status(FLIGHT_STATES.FLYING).flight;
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const d = distance(A1.speed, DT);
    expect(result).toBeRadial(A1, d, hdg);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeStatus(FLIGHT_STATES.FLYING);
    expect(events).toEqual([{
      type: EVENT_TYPES.PASSING,
      flight: result,
      map
    }])
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON faraway', () => {
  const hdg = rndHdg();
  const toHdg = rndHdg();
  const radial = mapDao.normHdg(toHdg + 180);
  const alt = rndFL();
  const d = rndInt(5, 70);

  test(`D${d} R${radial}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedHdg(hdg, toHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([])
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON faraway climbing', () => {
  const hdg = rndHdg();
  const toHdg = rndHdg();
  const radial = mapDao.normHdg(toHdg + 180);
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(500, 4000);
  const d = rndInt(5, 70);

  test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedHdg(hdg, toHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeClimbedFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([])
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON faraway descending', () => {
  const hdg = rndHdg();
  const toHdg = rndHdg();
  const radial = mapDao.normHdg(toHdg + 180);
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(500, 4000);
  const d = rndInt(5, 70);

  test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedHdg(hdg, toHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeDescentFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([])
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON faraway climbing and passing FL', () => {
  const hdg = rndHdg();
  const toHdg = rndHdg();
  const radial = mapDao.normHdg(toHdg + 180);
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(1, 100);
  const d = rndInt(5, 70);

  test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedHdg(hdg, toHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([{
      type: EVENT_TYPES.PASSING,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON faraway descending and passing FL', () => {
  const hdg = rndHdg();
  const toHdg = rndHdg();
  const radial = mapDao.normHdg(toHdg + 180);
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(1, 100);
  const d = rndInt(5, 70);

  test(`${alt}' to ${toAlt}' D${d} R${radial}, hdg: ${hdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const ds = distance(A1.speed, DT);
    const hdg1 = turnedHdg(hdg, toHdg, DT);
    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(BEACON.id);
    expect(result).toBeTurnTo(ENTRY.id);
    expect(result).toBeStatus(FLIGHT_STATES.TURNING);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([{
      type: EVENT_TYPES.PASSING,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON passing BEACON', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const alt = rndFL();
  const d = rndInt(1, 5) / 10;
  const toHdg = mapDao.hdg(ENTRY, BEACON);

  test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(alt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const toHdg = mapDao.hdg(BEACON, A1);
    const hdg1 = turnedHdg(hdg, toHdg, DT);

    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(alt);
    expect(result).toBeToAlt(alt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([{
      type: EVENT_TYPES.FLYING_TO,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON passing BEACON climbing', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(500, 4000);
  const d = rndInt(1, 5) / 10;
  const toHdg = mapDao.hdg(ENTRY, BEACON);

  test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const toHdg = mapDao.hdg(BEACON, A1);
    const hdg1 = turnedHdg(hdg, toHdg, DT);

    expect(result).toBeHdg(hdg1);
    expect(result).toBeClimbedFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([{
      type: EVENT_TYPES.FLYING_TO,
      flight: result,
      map
    }]);
  });
});


multipleTest('Flight should process time when turning to ENTRY via BEACON passing BEACON descending', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(500, 4000);
  const d = rndInt(1, 5) / 10;
  const toHdg = mapDao.hdg(ENTRY, BEACON);

  test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const toHdg = mapDao.hdg(BEACON, A1);
    const hdg1 = turnedHdg(hdg, toHdg, DT);

    expect(result).toBeHdg(hdg1);
    expect(result).toBeDescentFrom(alt, DT);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events).toEqual([{
      type: EVENT_TYPES.FLYING_TO,
      flight: result,
      map
    }]);
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON passing BEACON descending and passing FL', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt + rndInt(1, 100);
  const d = rndInt(1, 5) / 10;
  const toHdg = mapDao.hdg(ENTRY, BEACON);

  test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const toHdg = mapDao.hdg(BEACON, A1);
    const hdg1 = turnedHdg(hdg, toHdg, DT);

    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events.length).toBe(2);
    expect(events[0]).toMatchObject({
      type: EVENT_TYPES.PASSING,
      map
    });
    expect(events[1]).toMatchObject({
      type: EVENT_TYPES.FLYING_TO,
      flight: result,
      map
    });
  });
});

multipleTest('Flight should process time when turning to ENTRY via BEACON passing BEACON climbing and passing FL', () => {
  const hdg = rndHdg();
  const radial = rndHdg();
  const toAlt = rndMidFL();
  const alt = toAlt - rndInt(1, 100);
  const d = rndInt(1, 5) / 10;
  const toHdg = mapDao.hdg(ENTRY, BEACON);

  test(`D${d} R${radial}, hdg: ${hdg} ${alt}' to hdg ${toHdg}`, () => {
    const A1 = flightBuilder()
      .radial(BEACON, d, radial)
      .hdg(hdg)
      .alt(alt)
      .toAlt(toAlt)
      .turnTo(ENTRY.id)
      .at(BEACON.id)
      .status(FLIGHT_STATES.TURNING).flight;

    const ds = distance(A1.speed, DT);
    const events = [];
    const result = new Flight(A1, props({ onEvent: ev => events.push(ev) }))
      .processTime().flight;

    const toHdg = mapDao.hdg(BEACON, A1);
    const hdg1 = turnedHdg(hdg, toHdg, DT);

    expect(result).toBeHdg(hdg1);
    expect(result).toBeAlt(toAlt);
    expect(result).toBeToAlt(toAlt);
    expect(result).toBeSpeedAtAlt();
    expect(result).toBeAt(ENTRY.id);
    expect(result).toBeTurnTo(undefined);
    expect(result).toBeStatus(FLIGHT_STATES.FLYING_TO);
    expect(result).toBeRadial(A1, ds, hdg1);
    expect(events.length).toBe(2);
    expect(events[0]).toMatchObject({
      type: EVENT_TYPES.PASSING,
      map
    });
    expect(events[1]).toMatchObject({
      type: EVENT_TYPES.FLYING_TO,
      flight: result,
      map
    });
  });
});
