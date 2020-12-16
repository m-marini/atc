import _ from 'lodash';
import { FlightStatus } from './modules/Flight';
import { FlightProcessor, SimulationProps } from './modules/FlightProcessor';
import { AreaMap, BasicMapNode, HeadingMapNode, MapNodeAlignment, MapNodeType } from './modules/Map';
import { mapDao } from './modules/MapDao';
import {
    buildATCNotFoundMessage, buildAtGroundMessage, buildLandCommand, buildReadbackMessage,
    buildRunwayNotFoundMessage, buildTooDistanthMessage, buildTooHighMessage
} from './modules/Message';
import { flightBuilder, multipleTest, rndFL, rndHdg, rndInt } from './TestUtil';

const DT = 10; // sec

const RUNWAY: HeadingMapNode = {
    id: '13',
    type: MapNodeType.Runway,
    alignment: MapNodeAlignment.N,
    lat: 45,
    lon: 11,
    hdg: 132
};

const OM = mapDao.radial(RUNWAY, RUNWAY.hdg + 180, 7);

const ENTRY: HeadingMapNode = {
    id: 'ENT',
    type: MapNodeType.Entry,
    alignment: MapNodeAlignment.N,
    lat: 46,
    lon: 10,
    hdg: 132
};

const BEACON: BasicMapNode = {
    id: 'BEA',
    type: MapNodeType.Beacon,
    alignment: MapNodeAlignment.N,
    lat: 44,
    lon: 9
};

const map: AreaMap = {
    id: 'LON',
    name: 'London ATC',
    descr: 'London ATC',
    nodes: { '13': RUNWAY, BEA: BEACON, ENT: ENTRY },
    center: {
        lat: 45,
        lon: 10
    },
    routes: []
};

const DefaultProps: SimulationProps = {
    map: map,
    dt: DT,                     // sec
    level: {
        id: '',
        name: '',
        maxPlane: 1,
        flightFreq: 0
    },
    jetProb: 0.5,
    safeEntryDelay: 120,        // sec
    entryAlt: 28000,            // feet
    exitAlt: 36000,             // feet
    collisionDistance: 4,       // nms
    collisionAlt: 1000,         // feet
    om: 7,                      // nms
    mm: 0.9,                    // nms (5469')
    clearToLandDistance: 30,    // nms
    exitDistance: 2,            // nms
    landingHdgRange: 2,         // DEG
    landingAngle: 3,            // DEG
    conditionDistance: 400 / 3600 * 10 * 1.5, // nms
    holdingDuration: 240,       // sec
    goAroundAlt: 4000,          // feet
    flightTempl: {
        J: {
            speed0: 140,        // nmh
            speed360: 440,      // nmh
            vspeed: 1500        // fpm
        },
        A: {
            speed0: 80,         // nmh
            speed360: 280,      // nmh
            vspeed: 700         // fpm
        }
    },
    flightVoices: []
};

function props(props: any = {}) {
    return _.assign({}, DefaultProps, props) as SimulationProps;
}

describe('Flight should process clear to land command while flying', () => {
    multipleTest(() => {
        const hdg = rndHdg();
        const d = rndInt(7, 23);
        test(`D${d} hdg: ${hdg}`, () => {
            const A1 = flightBuilder()
                .radial(OM, d, hdg + 180)
                .hdg(hdg)
                .alt(4000)
                .toAlt(4000)
                .status(FlightStatus.Flying).flight;

            const cmd = buildLandCommand(A1.id, map.id, RUNWAY.id);
            const result = new FlightProcessor(A1, props()).processCommand(cmd);

            expect(result.messages).toEqual([
                buildReadbackMessage(cmd)
            ]);

            const flight = result.flight;
            expect(flight).toBeHdg(hdg);
            expect(flight).toBeAlt(4000);
            expect(flight).toBeToAlt(4000);
            expect(flight).toBeSpeedAtAlt();
            expect(flight).toBeRunway(RUNWAY.id);
            expect(flight).toBePos(A1);
            expect(flight).toBeStatus(FlightStatus.Approaching);
        });
    });
});

describe('Flight should process clear to land command while flying faraway', () => {
    multipleTest(() => {
        const hdg = rndHdg()
        const d = rndInt(24, 50);
        test(`OM D${d}, hdg:${hdg}`, () => {
            const A1 = flightBuilder()
                .radial(OM, d, hdg + 180)
                .hdg(hdg)
                .alt(4000)
                .toAlt(4000)
                .status(FlightStatus.Flying).flight;

            const cmd = buildLandCommand(A1.id, map.id, RUNWAY.id);
            const result = new FlightProcessor(A1, props()).processCommand(cmd);

            expect(result.messages).toEqual([
                buildTooDistanthMessage(A1.id, map.id)
            ]);
            expect(result.flight).toBe(A1);
        });

    });
});

describe('Flight should process clear to land command flying to high', () => {
    multipleTest(() => {
        const hdg = Math.floor(Math.random() * 360 + 1);
        const alt = rndFL();
        test(`${alt}' hdg: ${hdg}`, () => {
            const A1 = flightBuilder()
                .pos(OM)
                .hdg(hdg)
                .alt(alt)
                .toAlt(alt)
                .status(FlightStatus.Flying).flight;

            const cmd = buildLandCommand(A1.id, map.id, RUNWAY.id);
            const result = new FlightProcessor(A1, props()).processCommand(cmd);

            expect(result.messages).toEqual([
                buildTooHighMessage(A1.id, map.id)
            ]);
            expect(result.flight).toBe(A1);
        });
    });
});

describe('Flight should process clear to land command', () => {
    const hdg = Math.floor(Math.random() * 360 + 1);
    const alt = rndFL();
    test(`wrong atc ${alt}' hdg: ${hdg}`, () => {
        const A1 = flightBuilder()
            .pos(OM)
            .hdg(hdg)
            .alt(alt)
            .toAlt(alt)
            .status(FlightStatus.Flying).flight;

        const cmd = buildLandCommand(A1.id, 'PAR', RUNWAY.id);
        const result = new FlightProcessor(A1, props()).processCommand(cmd);

        expect(result.messages).toEqual([
            buildATCNotFoundMessage(A1.id, 'PAR')
        ]);
        expect(result.flight).toBe(A1);
    });

    test(`wrong rwy ${alt}' hdg: ${hdg}`, () => {
        const A1 = flightBuilder()
            .pos(OM)
            .hdg(hdg)
            .alt(alt)
            .toAlt(alt)
            .status(FlightStatus.Flying).flight;

        const cmd = buildLandCommand(A1.id, map.id, '16');
        const result = new FlightProcessor(A1, props()).processCommand(cmd);

        expect(result.messages).toEqual([
            buildRunwayNotFoundMessage(A1.id, map.id, '16')
        ]);
        expect(result.flight).toBe(A1);
    });

    test(`at ground ${alt}' hdg: ${hdg}`, () => {
        const A1 = flightBuilder()
            .pos(RUNWAY)
            .hdg(RUNWAY.hdg)
            .alt(0)
            .toAlt(0)
            .from(RUNWAY.id)
            .status(FlightStatus.WaitingForTakeoff).flight;

        const cmd = buildLandCommand(A1.id, map.id, RUNWAY.id);
        const result = new FlightProcessor(A1, props()).processCommand(cmd);

        expect(result.messages).toEqual([
            buildAtGroundMessage(A1.id, map.id, RUNWAY.id)
        ]);
        expect(result.flight).toBe(A1);
    });
});
