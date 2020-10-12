import _, { round } from 'lodash';
import { mapDao } from './modules/MapDao';
import { FLIGHT_STATES, FLIGHT_TYPES } from './modules/Flight';


function climb(alt, dt) {
  return Math.round(alt + 1500 * dt / 60);
}

function descend(alt, dt) {
  return Math.round(alt - 1500 * dt / 60);
}

function distance(speed, dt) {
  return speed * dt / 3600;
}

function approachAlt(d) {
  return Math.round(d * Math.tan(3 * Math.PI / 180) * 1852 / 0.3048);
}

function speedByAlt(alt) {
  return Math.round((440 - 140) / 36000 * alt + 140);
}

function flightBuilder(flight) {
  return new FlightBuilder(flight);
}

function outerMarker(rwy) {
  return mapDao.radial(rwy, rwy.hdg + 180, 7);
}

function toBeAlt(received, alt, eps = 0) {
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

function toBeClimbedFrom(received, alt, dt, eps = 0) {
  return toBeAlt(received, climb(alt, dt), eps);
}

function toBeDescentFrom(received, alt, dt, eps = 0) {
  return toBeAlt(received, descend(alt, dt), eps);
}

function toBeToAlt(received, alt) {
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

function toBePos(received, loc, eps = 0.01) {
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

function toBeRadial(received, loc, distance, radial, eps = 0.01) {
  const target = mapDao.radial(loc, radial, distance);
  return toBePos(received, target, eps);
}

function toBeSpeed(received, speed) {
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

function toBeSpeedAtAlt(received) {
  return toBeSpeed(received, speedByAlt(received.alt));
}

function toBeApproachAlt(received, runway, eps = 0) {
  const d = mapDao.distance(outerMarker(runway), received) + 7;
  return toBeAlt(received, approachAlt(d), eps);
}

function toBeLandingAlt(received, runway, eps = 0) {
  const d = mapDao.distance(runway, received);
  return toBeAlt(received, approachAlt(d), eps);
}

function toBeOm(received, rwy, eps = 0.01) {
  if (rwy === undefined) {
    const pass = received.om === undefined;
    if (pass) {
      return {
        message: () =>
          `Expected not {\n  om: undefined\n}\nReceived: {\n  om: undefined\n}`,
        pass: pass
      };
    } else {
      return {
        message: () =>
          `Expected {\n  om: undefined\n}\nReceived: {\n  om:\n    lat: ${received.om.lat},\n    lon: ${received.om.lon}\n  }\n}`,
        pass: pass
      }
    }
  } else {
    const om = outerMarker(rwy);
    const hdg = mapDao.hdg(received.om, om);
    const d = mapDao.distance(received.om, om);
    const pass = d <= eps;
    if (pass) {
      return {
        message: () =>
          `Expected not {\n  om:\n    lat: ${om.lat},\n    lon: ${om.lon}\n  }\n}\nReceived: {\n  om:\n    lat: ${received.om.lat},\n    lon: ${received.om.lon}\n  }\n}\nDistance: ${d}\nHeading: ${hdg}`,
        pass: pass
      };
    } else {
      return {
        message: () =>
          `Expected {\n  om:\n    lat: ${om.lat},\n    lon: ${om.lon}\n  }\n}\nReceived: {\n  om:\n    lat: ${received.om.lat},\n    lon: ${received.om.lon}\n  }\n}\nDistance: ${d}\nHeading: ${hdg}`,
        pass: pass
      }
    }
  }
}

function toBeFix(received, fix, eps = 0.01) {
  if (fix === undefined) {
    const pass = received.fix === undefined;
    if (pass) {
      return {
        message: () =>
          `Expected not {\n  fix: undefined\n}\nReceived: {\n  fix: undefined\n}`,
        pass: pass
      };
    } else {
      return {
        message: () =>
          `Expected {\n  fix: undefined\n}\nReceived: {\n  fix:\n    lat: ${received.om.lat},\n    lon: ${received.om.lon}\n  }\n}`,
        pass: pass
      }
    }
  } else {
    const hdg = mapDao.hdg(received.fix, fix);
    const d = mapDao.distance(received.fix, fix);
    const pass = d <= eps;
    if (pass) {
      return {
        message: () =>
          `Expected not {\n  fix:\n    lat: ${om.lat},\n    lon: ${om.lon}\n  }\n}\nReceived: {\n  fix:\n    lat: ${received.fix.lat},\n    lon: ${received.fix.lon}\n  }\n}\nDistance: ${d}\nHeading: ${hdg}`,
        pass: pass
      };
    } else {
      return {
        message: () =>
          `Expected {\n  fix:\n    lat: ${fix.lat},\n    lon: ${fix.lon}\n  }\n}\nReceived: {\n  fix:\n    lat: ${received.fix.lat},\n    lon: ${received.fix.lon}\n  }\n}\nDistance: ${d}\nHeading: ${hdg}`,
        pass: pass
      }
    }
  }
}

function toBeHdg(received, hdg) {
  const pass = received.hdg === hdg;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  hdg: ${hdg}\n}\nReceived: {\n  hdg: ${received.hdg}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  hdg: ${hdg}\n}\nReceived: {\n  hdg: ${received.hdg}\n}`,
      pass: pass
    };
  }
}

function toBeStatus(received, status) {
  const pass = received.status === status;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  status: ${status}\n}\nReceived:\n{\n  status: ${received.status}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  status: ${status}\n}\nReceived:\n{\n  status: ${received.status}\n}`,
      pass: pass
    };
  }
}

function toBeTo(received, to) {
  const pass = received.to === to;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  to: ${to}\n}\nReceived:\n{\n  to: ${received.to}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  to: ${to}\n}\nReceived:\n{\n  to: ${received.to}\n}`,
      pass: pass
    };
  }
}

function toBeAt(received, at) {
  const pass = received.at === at;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  at: ${at}\n}\nReceived:\n{\n  at: ${received.at}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  at: ${at}\n}\nReceived:\n{\n  at: ${received.at}\n}`,
      pass: pass
    };
  }
}

function toBeExit(received, exit) {
  const pass = received.exit === exit;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  exit: ${exit}\n}\nReceived:\n{\n  exit: ${received.exit}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  exit: ${exit}\n}\nReceived:\n{\n  exit: ${received.exit}\n}`,
      pass: pass
    };
  }
}

function toBeFrom(received, from) {
  const pass = received.from === from;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  from: ${from}\n}\nReceived:\n{\n  from: ${received.from}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  from: ${from}\n}\nReceived:\n{\n  from: ${received.from}\n}`,
      pass: pass
    };
  }
}

function toBeTurnTo(received, turnTo) {
  const pass = received.turnTo === turnTo;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  turnTo: ${turnTo}\n}\nReceived:\n{\n  turnTo: ${received.turnTo}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  turnTo: ${turnTo}\n}\nReceived:\n{\n  turnTo: ${received.turnTo}\n}`,
      pass: pass
    };
  }
}

function toBeRunway(received, runway) {
  const pass = received.rwy === runway;
  if (pass) {
    return {
      message: () =>
        `Expected not {\n  rwy: ${runway}\n}\nReceived:\n{\n  rwy: ${received.rwy}\n}`,
      pass: pass
    };
  } else {
    return {
      message: () =>
        `Expected {\n  rwy: ${runway}\n}\nReceived:\n{\n  rwy: ${received.rwy}\n}`,
      pass: pass
    };
  }
}

expect.extend({
  toBeAlt, toBePos, toBeRadial, toBeStatus, toBeSpeed, toBeTurnTo,
  toBeHdg, toBeSpeedAtAlt, toBeApproachAlt, toBeToAlt, toBeAt, toBeRunway,
  toBeDescentFrom, toBeClimbedFrom, toBeOm, toBeLandingAlt, toBeFrom,
  toBeExit, toBeFix
});

class FlightBuilder {
  constructor(flight = {
    id: 'A1',
    type: FLIGHT_TYPES.JET,
    speed: 0,
    lat: 0,
    lon: 0,
    hdg: 360,
    alt: 0,
    toAlt: 0,
    status: FLIGHT_STATES.FLYING
  }) {
    this.flight = flight;
  }

  id(id) {
    return new FlightBuilder(_.defaults({ id }, this.flight));
  }

  pos({ lat, lon }) {
    return new FlightBuilder(_.defaults({ lat, lon }, this.flight));
  }

  fix({ lat, lon }) {
    return new FlightBuilder(_.defaults({ fix: { lat, lon } }, this.flight));
  }

  radial(loc, distance, radial) {
    return this.pos(mapDao.radial(loc, radial, distance));
  }

  alt(alt) {
    return new FlightBuilder(_.defaults({ alt }, this.flight)).speed(speedByAlt(alt));
  }

  from(from) {
    return new FlightBuilder(_.defaults({ from }, this.flight));
  }

  to(to) {
    return new FlightBuilder(_.defaults({ to }, this.flight));
  }

  om(rwy) {
    const om = outerMarker(rwy);
    return new FlightBuilder(_.defaults({ om }, this.flight));
  }

  at(at) {
    return new FlightBuilder(_.defaults({ at }, this.flight));
  }

  rwy(rwy) {
    return new FlightBuilder(_.defaults({ rwy }, this.flight));
  }

  speed(speed) {
    return new FlightBuilder(_.defaults({ speed }, this.flight));
  }

  hdg(hdg) {
    return new FlightBuilder(_.defaults({ hdg }, this.flight));
  }

  turnTo(turnTo) {
    return new FlightBuilder(_.defaults({ turnTo }, this.flight));
  }

  toAlt(toAlt) {
    return new FlightBuilder(_.defaults({ toAlt }, this.flight));
  }

  status(status) {
    return new FlightBuilder(_.defaults({ status }, this.flight));
  }

  approachAlt(distance) {
    return this.alt(approachAlt(distance));
  }

  approachRadial(loc, distance, radial) {
    return this.radial(loc, distance, radial)
      .approachAlt(distance)
      .status(FLIGHT_STATES.LANDING);
  }

  approachRunway(runway, distance) {
    return this.approachRadial(runway, distance, runway.hdg + 180)
      .rwy(runway.id)
      .hdg(runway.hdg);
  }
}

export {
  distance, climb, descend, outerMarker, flightBuilder
};