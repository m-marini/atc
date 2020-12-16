import _ from 'lodash';
import { Flight, FlightStatus, FlightType } from './modules/Flight';
import { GeoLocation, HeadingMapNode, MapNode } from './modules/Map';
import { mapDao } from './modules/MapDao';

export function turnedHdg(fromHdg: number, toHdg: number, dt: number): number {
  const a = mapDao.normAngle(toHdg - fromHdg);
  const maxAngle = 3 * dt;
  const da = Math.sign(a) * Math.min(Math.abs(a), maxAngle);
  const hdg = mapDao.normHdg(fromHdg + da);
  return hdg;
}

export function turnedRight(fromHdg: number, toHdg: number, dt: number): number {
  const a = mapDao.normHdg(toHdg - fromHdg);
  const maxAngle = 3 * dt;
  const da = Math.min(a, maxAngle);
  const hdg = mapDao.normHdg(fromHdg + da);
  return hdg;
}

function climb(alt: number, dt: number): number {
  return Math.round(alt + 1500 * dt / 60);
}

function descend(alt: number, dt: number): number {
  return Math.round(alt - 1500 * dt / 60);
}

export function distance(speed: number, dt: number): number {
  return speed * dt / 3600;
}

export function landingAlt(d: number): number {
  return Math.round(d * Math.tan(3 * Math.PI / 180) * 1852 / 0.3048);
}

export function speedByAlt(alt: number): number {
  return Math.round((440 - 140) / 36000 * alt + 140);
}

export function flightBuilder(flight?: Flight): FlightBuilder {
  return new FlightBuilder(flight);
}

function outerMarker(rwy: HeadingMapNode): GeoLocation {
  return mapDao.radial(rwy, rwy.hdg + 180, 7);
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeHdg(expected: number): CustomMatcherResult;
      toBeAlt(expected: number, eps?: number): CustomMatcherResult;
      toBeSpeed(expected: number): CustomMatcherResult;
      toBeToAlt(expected: number): CustomMatcherResult;
      toBeSpeedAtAlt(): CustomMatcherResult;
      toBeExit(expected: string | undefined): CustomMatcherResult;
      toBeRadial(point: GeoLocation, distance: number, hdg: number, eps?: number): CustomMatcherResult;
      toBeStatus(expected: FlightStatus): CustomMatcherResult;
      toBePos(expected: GeoLocation, eps?: number): CustomMatcherResult;
      toBeAt(expected: string | undefined): jest.CustomMatcherResult;
      toBeHoldHdg(expected: number | undefined): jest.CustomMatcherResult;
      toBeTurnTo(expected: string | undefined): jest.CustomMatcherResult;
      toBeFrom(expected: string | undefined): jest.CustomMatcherResult;
      toBeFix(expected: GeoLocation): CustomMatcherResult;
      toBeRunway(expected: string | undefined): jest.CustomMatcherResult;
      toBeDescentFrom(alt: number, dt: number, eps?: number): jest.CustomMatcherResult;
      toBeClimbedFrom(alt: number, dt: number, eps?: number): jest.CustomMatcherResult;
      toBeLoopTimer(expected: number | undefined): jest.CustomMatcherResult;
      toBeRight(expected: boolean | undefined): jest.CustomMatcherResult;
    }
  }
}

expect.extend({
  toBeHdg,
  toBeAlt,
  toBeToAlt,
  toBeSpeed,
  toBeSpeedAtAlt,
  toBeLandingAlt,
  toBeExit,
  toBeStatus,
  toBeRadial,
  toBePos,
  toBeAt,
  toBeTurnTo,
  toBeHoldHdg,
  toBeFix,
  toBeRunway,
  toBeDescentFrom,
  toBeClimbedFrom,
  toBeLoopTimer,
  toBeRight,
  toBeFrom
});

function toBeHdg(received: Flight, hdg: number): jest.CustomMatcherResult {
  const pass = received.hdg === hdg;
  return (pass)
    ? {
      message: () =>
        `Expected not {\n  hdg: ${hdg}\n}\nReceived: {\n  hdg: ${received.hdg}\n}`,
      pass: pass
    }
    : {
      message: () =>
        `Expected {\n  hdg: ${hdg}\n}\nReceived: {\n  hdg: ${received.hdg}\n}`,
      pass: pass
    };
}

function toBeAlt(received: Flight, alt: number, eps: number = 0): jest.CustomMatcherResult {
  const diff = Math.abs(received.alt - alt);
  const pass = diff <= eps;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  alt: ${alt}\n}\nReceived: {\n  alt: ${received.alt}\n}\nDifference: ${diff}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  alt: ${alt}\n}\nReceived: {\n  alt: ${received.alt}\n}\nDifference: ${diff}`,
      pass: pass
    };
  }
}

function toBeClimbedFrom(received: Flight, alt: number, dt: number, eps: number = 0): jest.CustomMatcherResult {
  return toBeAlt(received, climb(alt, dt), eps);
}

function toBeDescentFrom(received: Flight, alt: number, dt: number, eps: number = 0): jest.CustomMatcherResult {
  return toBeAlt(received, descend(alt, dt), eps);
}

function toBeToAlt(received: Flight, alt: number): jest.CustomMatcherResult {
  const diff = Math.abs(received.toAlt - alt);
  const pass = diff === 0;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  toAlt: ${alt}\n}\nReceived: {\n  toAlt: ${received.toAlt}\n}\nDifference: ${diff}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  toAlt: ${alt}\n}\nReceived: {\n  toAlt: ${received.toAlt}\n}\nDifference: ${diff}`,
      pass: pass
    };
  }
}

function toBeRight(received: Flight, right: boolean): jest.CustomMatcherResult {
  const pass = received.right === right;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  right: ${right}\n}\nReceived: {\n  right: ${received.right}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  right: ${right}\n}\nReceived: {\n  right: ${received.right}\n}`,
      pass: pass
    };
  }
}

function toBePos(received: Flight, loc: GeoLocation, eps: number = 0.01): jest.CustomMatcherResult {
  const hdg = mapDao.hdg(received, loc);
  const d = mapDao.distance(received, loc);
  const pass = d <= eps;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  lat: ${loc.lat},\n  lon: ${loc.lon}\n}\nReceived: {\n  lat: ${received.lat},\n  lon: ${received.lon}\n}\nDistance: ${d}\nHeading: ${hdg}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  lat: ${loc.lat},\n  lon: ${loc.lon}\n}\nReceived: {\n  lat: ${received.lat},\n  lon: ${received.lon}\n}\nDistance: ${d}\nHeading: ${hdg}`,
      pass: pass
    }
  }
}

function toBeRadial(received: Flight, loc: GeoLocation, distance: number, radial: number, eps: number = 0.01): jest.CustomMatcherResult {
  const target = mapDao.radial(loc, radial, distance);
  return toBePos(received, target, eps);
}

function toBeSpeed(received: Flight, speed: number): jest.CustomMatcherResult {
  const pass = received.speed === speed;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  speed: ${speed}\n}\nReceived: {\n  speed: ${received.speed}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  speed: ${speed}\n}\nReceived: {\n  speed: ${received.speed}\n}`,
      pass: pass
    };
  }
}

function toBeSpeedAtAlt(received: Flight): jest.CustomMatcherResult {
  return toBeSpeed(received, speedByAlt(received.alt));
}

function toBeApproachAlt(received: Flight, runway: HeadingMapNode, eps: number = 0): jest.CustomMatcherResult {
  const d = mapDao.distance(outerMarker(runway), received) + 7;
  return toBeAlt(received, landingAlt(d), eps);
}

function toBeLandingAlt(received: Flight, runway: MapNode, eps: number = 0): jest.CustomMatcherResult {
  const d = mapDao.distance(runway, received);
  return toBeAlt(received, landingAlt(d), eps);
}

function toBeFix(received: Flight, expected: GeoLocation | undefined, eps: number = 0.01): jest.CustomMatcherResult {
  const { fix } = received;
  if (expected && fix) {
    const pass = fix.lat === expected.lat && fix.lon === expected.lon;
    return {
      message: pass
        ? () => `
Expected not {
  fix:{
    lat: ${expected.lat}
    lon: ${expected.lon}
  }
}
Received {
  fix:{
    lat: ${fix.lat}
    lon: ${fix.lon}
  }
}`
        : () => `
Expected {
  fix:{
    lat: ${expected.lat}
    lon: ${expected.lon}
  }
}
Received {
  fix:{
    lat: ${fix.lat}
    lon: ${fix.lon}
  }
}`,
      pass
    };
  }
  if (!expected && fix) {
    return {
      message: () => `
Expected {
  fix: undefined
}
Received {
  fix:{
    lat: ${fix.lat}
    lon: ${fix.lon}
  }
}`,
      pass: false
    };
  }
  if (expected && !fix) {
    return {
      message: () => `
Expected {
  fix:{
    lat: ${expected.lat}
    lon: ${expected.lon}
  }
}
Received {
  fix: undefined
}`,
      pass: false
    };
  }
  return {
    message: () => `
Expected not {
  fix: undefined
}
Received {
  fix: undefined
}`,
    pass: true
  };
}

function toBeLoopTimer(received: Flight, loopTimer: number): jest.CustomMatcherResult {
  const pass = received.loopTimer === loopTimer;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  loopTimer: ${loopTimer} \n } \nReceived: { \n  loopTimer: ${received.loopTimer} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected n  loopTimer: ${loopTimer} \n}\nReceived: { \n  loopTimer: ${received.loopTimer} \n } `,
      pass: pass
    };
  }
}

function toBeHoldHdg(received: Flight, holdHdg: number): jest.CustomMatcherResult {
  const pass = received.holdHdg === holdHdg;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  holdHdg: ${holdHdg} \n } \nReceived: { \n  holdHdg: ${received.holdHdg} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  holdHdg: ${holdHdg} \n } \nReceived: { \n  holdHdg: ${received.holdHdg} \n } `,
      pass: pass
    };
  }
}

function toBeStatus(received: Flight, status: FlightStatus): jest.CustomMatcherResult {
  const pass = received.status === status;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  status: ${status} \n } \nReceived: \n{ \n  status: ${received.status} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  status: ${status} \n } \nReceived: \n{ \n  status: ${received.status} \n } `,
      pass: pass
    };
  }
}

function toBeAt(received: Flight, at: string | undefined): jest.CustomMatcherResult {
  const pass = received.at === at;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  at: ${at} \n } \nReceived: \n{ \n  at: ${received.at} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  at: ${at} \n } \nReceived: \n{ \n  at: ${received.at} \n } `,
      pass: pass
    };
  }
}

function toBeExit(received: Flight, exit: string | undefined): jest.CustomMatcherResult {
  const pass = received.exit === exit;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  exit: ${exit} \n } \nReceived: \n{ \n  exit: ${received.exit} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  exit: ${exit} \n } \nReceived: \n{ \n  exit: ${received.exit} \n } `,
      pass: pass
    };
  }
}

function toBeFrom(received: Flight, from: string): jest.CustomMatcherResult {
  const pass = received.from === from;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  from: ${from} \n } \nReceived: \n{ \n  from: ${received.from} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  from: ${from} \n } \nReceived: \n{ \n  from: ${received.from} \n } `,
      pass: pass
    };
  }
}

function toBeTurnTo(received: Flight, turnTo: string | undefined): jest.CustomMatcherResult {
  const pass = received.turnTo === turnTo;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  turnTo: ${turnTo} \n } \nReceived: \n{ \n  turnTo: ${received.turnTo} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  turnTo: ${turnTo} \n } \nReceived: \n{ \n  turnTo: ${received.turnTo} \n } `,
      pass: pass
    };
  }
}

function toBeRunway(received: Flight, runway: string | undefined): jest.CustomMatcherResult {
  const pass = received.rwy === runway;
  if (pass) {
    return {
      message: () =>
        `Expected not { \n  rwy: ${runway} \n } \nReceived: \n{ \n  rwy: ${received.rwy} \n } `,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected { \n  rwy: ${runway} \n } \nReceived: \n{ \n  rwy: ${received.rwy} \n } `,
      pass: pass
    };
  }
}

class FlightBuilder {
  private _flight: Flight;

  constructor(flight: Flight = {
    id: 'A1',
    type: FlightType.Jet,
    speed: 0,
    lat: 0,
    lon: 0,
    hdg: 360,
    alt: 0,
    toAlt: 0,
    to: '',
    from: '',
    status: FlightStatus.Flying,
    voice: '1'
  }) {
    this._flight = flight;
  }

  get flight() { return this._flight; }

  build(): Flight {
    return this.flight;
  }

  id(id: string) {
    return new FlightBuilder(_.defaults({ id }, this.flight) as Flight);
  }

  pos({ lat, lon }: GeoLocation) {
    return new FlightBuilder(_.defaults({ lat, lon }, this.flight) as Flight);
  }

  fix({ lat, lon }: GeoLocation) {
    return new FlightBuilder(_.defaults({ fix: { lat, lon } }, this.flight) as Flight);
  }

  radial(loc: GeoLocation, distance: number, radial: number) {
    return this.pos(mapDao.radial(loc, radial, distance));
  }

  alt(alt: number) {
    return new FlightBuilder(_.defaults({ alt }, this.flight) as Flight).speed(speedByAlt(alt));
  }

  from(from: string) {
    return new FlightBuilder(_.defaults({ from }, this.flight) as Flight);
  }

  to(to: string) {
    return new FlightBuilder(_.defaults({ to }, this.flight) as Flight);
  }

  exit(exit: string) {
    return new FlightBuilder(_.defaults({ exit }, this.flight) as Flight);
  }
  om(rwy: HeadingMapNode) {
    const om = outerMarker(rwy);
    return new FlightBuilder(_.defaults({ om }, this.flight) as Flight);
  }

  at(at: string) {
    return new FlightBuilder(_.defaults({ at }, this.flight) as Flight);
  }

  rwy(rwy: string) {
    return new FlightBuilder(_.defaults({ rwy }, this.flight) as Flight);
  }

  speed(speed: number) {
    return new FlightBuilder(_.defaults({ speed }, this.flight) as Flight);
  }

  hdg(hdg: number) {
    return new FlightBuilder(_.defaults({ hdg }, this.flight) as Flight);
  }

  holdHdg(holdHdg: number) {
    return new FlightBuilder(_.defaults({ holdHdg }, this.flight) as Flight);
  }

  turnTo(turnTo: string) {
    return new FlightBuilder(_.defaults({ turnTo }, this.flight) as Flight);
  }

  loopTimer(loopTimer: number) {
    return new FlightBuilder(_.defaults({ loopTimer }, this.flight) as Flight);
  }

  toAlt(toAlt: number) {
    return new FlightBuilder(_.defaults({ toAlt }, this.flight) as Flight);
  }

  status(status: FlightStatus) {
    return new FlightBuilder(_.defaults({ status }, this.flight) as Flight);
  }

  right(right: boolean) {
    return new FlightBuilder(_.defaults({ right }, this.flight) as Flight);
  }

  landingAlt(distance: number) {
    return this.alt(landingAlt(distance));
  }

  approachRadial(loc: GeoLocation, distance: number, radial: number) {
    return this.radial(loc, distance, radial)
      .landingAlt(distance)
      .status(FlightStatus.Landing);
  }

  approachRunway(runway: HeadingMapNode, distance: number) {
    return this.approachRadial(runway, distance, runway.hdg + 180)
      .rwy(runway.id)
      .hdg(runway.hdg || 0);
  }
}

export function multipleTest(func: (i: number) => void, n: number = 10) {
  for (var i = 0; i < n; i++) {
    func(i);
  }
}

export function multipleTestWithData<T>(data: T[], func: (data: T) => void) {
  data.forEach(d => func(d));
}

export function digits(eps: number) {
  return -Math.log10(2 * eps);
}

export function rndFloat(from: number, to: number): number {
  return Math.random() * (to - from) + from;
}

export function rndInt(from: number, to: number): number {
  if (to === undefined) {
    to = from;
    from = 0;
  }
  return Math.floor(rndFloat(from, to));
}

export function rndHdg(): number {
  return rndInt(1, 361);
}

export function rndFL(): number {
  return rndInt(1, 10) * 4000;
}

export function rndMidFL(): number {
  return rndInt(2, 9) * 4000;
}
