
import { ajax } from 'rxjs/ajax';
import { filter, flatMap, map, tap } from 'rxjs/operators';
import _ from 'lodash';
import { AsyncSubject, from, Observable } from 'rxjs';
import { AreaMap, AreaMapSet, GeoLocation, MapNode, validateAreaMapSet } from './Map';
import { homepage } from '../../package.json';

const url = `/${homepage}/data/maps.json`;
const NMS_PER_DEG = 60;
const RADS_PER_DEG = Math.PI / 180;
const DEGS_PER_RAD = 180 / Math.PI;
const NMS_PER_RAD = NMS_PER_DEG / RADS_PER_DEG;

export interface LocatedVector extends GeoLocation {
    readonly hdg: number;
}

export interface RouteInfo {
    readonly hdg: number;
    readonly d: number;
    readonly angle: number;
    readonly from: boolean;
    readonly to: boolean;
}

/** */
class MapDao {
    private _subj: AsyncSubject<AreaMapSet>;

    /** */
    constructor() {
        this._subj = new AsyncSubject();
        ajax.getJSON<any>(url).pipe(
            map(body => validateAreaMapSet(body)),
            tap(undefined,
                error => {
                    console.error(error);
                })).subscribe(this._subj);
    }

    /** */
    getMaps(): Observable<AreaMapSet> {
        return this._subj;
    }

    /**
     * 
     * @param id 
     */
    getMap(id: string): Observable<AreaMap> {
        return this.getMaps().pipe(
            flatMap(mapSet => from(_.values(mapSet.maps))),
            filter(map => map.id === id)
        );
    }

    /**
     * Returns the versor of location double[3]
     * 
     * @param location {lat lon}
     */
    versor({ lat, lon }: GeoLocation): number[] {
        const latRad = lat * RADS_PER_DEG;
        const lonRad = lon * RADS_PER_DEG;
        const z = Math.sin(latRad);
        const c = Math.cos(latRad);
        const x = c * Math.sin(lonRad);
        const y = c * Math.cos(lonRad);
        return [x, y, z];
    }

    /**
     * Returns the distance in nm
     * 
     * @param from source location {lat, lon}
     * @param to  destination location {lat, lon}
     */
    distance(to: GeoLocation, from: GeoLocation): number {
        const v0 = this.versor(from);
        const v1 = this.versor(to);
        const c = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        const result = Math.acos(Math.min(Math.max(-1, c), 1)) * NMS_PER_RAD;
        return result;
    }

    /**
     * Returns the longitude difference in range (-180, 180)
     * @param {*} loc the location
     * @param {*} origin the origin
     */
    private dLon(loc: GeoLocation, origin: GeoLocation): number {
        var dLon = (loc.lon - origin.lon);
        if (dLon >= 180)
            dLon -= 360;
        if (dLon < -180)
            dLon += 360;
        return dLon;
    }

    /**
     * Returns the xy coordinates in nm {x, y}
     * @param {*} loc the location
     * @param {*} origin the origin
     */
    xy(loc: GeoLocation, origin: GeoLocation): number[] {
        const x = this.dLon(loc, origin) * NMS_PER_DEG * Math.cos(loc.lat * RADS_PER_DEG);
        const y = (loc.lat - origin.lat) * NMS_PER_DEG;
        return [x, y];
    }

    /**
     * 
     * @param {*} to 
     * @param {*} from 
     */
    private hdgSingle(to: GeoLocation, from: GeoLocation): number {
        const nms = this.xy(to, from);
        const deg = Math.atan2(nms[0], nms[1]) * DEGS_PER_RAD;
        return deg;
    }

    /**
     * 
     * @param to 
     * @param from 
     */
    hdg(to: GeoLocation, from: GeoLocation): number {
        const hft = this.normAngle(this.hdgSingle(to, from));
        const htf = this.normAngle(this.hdgSingle(from, to) + 180);
        const hdg = this.normHdg(Math.round(hft + this.normAngle((htf - hft) / 2)));
        return hdg;
    }

    /**
     * 
     * @param hdg 
     */
    normHdg(hdg: number): number {
        return hdg > 360 ? hdg - 360 : hdg <= 0 ? hdg + 360 : hdg;
    }

    /**
     * 
     * @param a 
     */
    normAngle(a: number): number {
        return a >= 180 ? a - 360 : a < -180 ? a + 360 : a;
    }

    /**
     * Returns the route info to fly to a location {d, hdg, angle, from, to}
     * 
     * @param from the origin location or flight
     * @param to the target location
     * @param hdg the from direction
     */
    route(from: LocatedVector | GeoLocation, to: GeoLocation, hdg?: number): RouteInfo {
        if (hdg === undefined) {
            hdg = (from as LocatedVector).hdg;
        }
        const hdgTo = this.hdg(to, from);
        const d = this.distance(from, to);
        const angle = this.normAngle(Math.round(hdgTo - hdg));
        const toFlag = angle < 90 && angle > -90;
        const fromFlag = angle > 90 || angle < -90;
        return { hdg: hdgTo, d, angle, from: fromFlag, to: toFlag };
    }

    /**
     * 
     * @param location 
     * @param hdg 
     * @param ds 
     */
    radial(location: GeoLocation, hdg: number, ds: number): GeoLocation {
        const { lat, lon } = location;
        const hdgRad = hdg * RADS_PER_DEG;
        const dlat = ds * Math.cos(hdgRad) / NMS_PER_DEG;
        const dlon = ds * Math.sin(hdgRad) / Math.cos(lat * RADS_PER_DEG) / NMS_PER_DEG;
        const newLat = lat + dlat;
        const newLon = lon + dlon;
        return { lat: newLat, lon: newLon };
    }

    /**
     * Returns the coordinates in nm {center:{lat, lon}, nodes:[{node:any, coords:[double]}]}
     * @param {*} nodes locations {id:{lat, long}, ...}
     * @param {*} center center {lat, long}
     */
    coords(nodes: Record<string, MapNode>, center: GeoLocation) {
        const _nodes = _(nodes)
            .mapValues(node => {
                return {
                    node: node,
                    coords: this.xy(node, center)
                };
            })
        const x = _nodes.map(node => node.coords[0]);
        const y = _nodes.map(node => node.coords[1]);

        const range = _(nodes).values().map(node =>
            this.distance(center, node)
        ).max() || 0;
        const result = {
            nodes: _nodes.value(),
            xmin: x.min() || 0,
            xmax: x.max() || 0,
            ymin: y.min() || 0,
            ymax: y.max() || 0,
            range
        };
        return result;
    }
}

export const mapDao = new MapDao();
