
import { ajax } from 'rxjs/ajax';
import { map, tap } from 'rxjs/operators';
import _ from 'lodash';
import { AsyncSubject } from 'rxjs';

const url = process.env.REACT_APP_BASENAME + '/data/maps.json';
const NMS_PER_DEG = 60;
const RADS_PER_DEG = Math.PI / 180;
const DEGS_PER_RAD = 180 / Math.PI;
const NMS_PER_RAD = NMS_PER_DEG / RADS_PER_DEG;

class MapDao {
    constructor() {
        this._subj = new AsyncSubject();
        ajax.getJSON(url).pipe(
            tap(undefined,
                error => {
                    console.error(error);
                })).subscribe(this._subj);
    }

    maps() {
        return this._subj;
    }

    map(id) {
        return this.maps().pipe(
            map(maps => maps.maps[id])
        );
    }

    /**
     * Returns the versor of location double[3]
     * 
     * @param {*} location {lat lon}
     */
    versor({ lat, lon }) {
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
     * @param {*} from source location {lat, lon}
     * @param {*} to  destination location {lat, lon}
     */
    distance(to, from) {
        const v0 = this.versor(from);
        const v1 = this.versor(to);
        const c = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        const result = Math.acos(Math.min(Math.max(-1, c), 1)) * NMS_PER_RAD;
        return result;
    }

    /**
     * 
     * @param {*} to 
     * @param {*} from 
     */
    hdgSingle(to, from) {
        const nms = this.xy(to, from);
        const deg = Math.atan2(nms[0], nms[1]) * DEGS_PER_RAD;
        return deg;
    }

    hdg(to, from) {
        const hft = this.normAngle(this.hdgSingle(to, from));
        const htf = this.normAngle(this.hdgSingle(from, to) + 180);
        const hdg = this.normHdg(Math.round(hft + this.normAngle((htf - hft) / 2)));
        // const hdg = Math.round((hft + htf) / 2);
        return hdg;
    }

    normHdg(hdg) {
        return hdg > 360 ? hdg - 360 : hdg <= 0 ? hdg + 360 : hdg;
    }

    normAngle(a) {
        return a >= 180 ? a - 360 : a < -180 ? a + 360 : a;
    }

    /**
     * Returns the route info to fly to a location {d, hdg, angle, from, to}
     * 
     * @param {*} from the origin location or flight
     * @param {*} loc the target location
     * @param {*} loc the target location
     * 
     */
    route(from, to, hdg) {
        if (hdg === undefined) {
            hdg = from.hdg;
        }
        const hdgTo = this.hdg(to, from);
        const d = this.distance(from, to);
        const angle = this.normAngle(Math.round(hdgTo - hdg));
        const toFlag = angle < 90 && angle > -90;
        const fromFlag = angle > 90 || angle < -90;
        return { hdg: hdgTo, d, angle, from: fromFlag, to: toFlag };
    }

    /**
     * Returns the xy coordinates in nm {x, y}
     * @param {*} loc the location
     * @param {*} origin the origin
     */
    xy(loc, origin) {
        const x = this.dLon(loc, origin) * NMS_PER_DEG * Math.cos(loc.lat * RADS_PER_DEG);
        const y = (loc.lat - origin.lat) * NMS_PER_DEG;
        return [x, y];
    }

    /**
     * Returns the longitude difference in range (-180, 180)
     * @param {*} loc the location
     * @param {*} origin the origin
     */
    dLon(loc, origin) {
        var dLon = (loc.lon - origin.lon);
        if (dLon >= 180)
            dLon -= 360;
        if (dLon < -180)
            dLon += 360;
        return dLon;
    }

    /**
     * Returns the center longitude
     * @param {*} locations locations
     */
    lonCenter(locations) {
        var max = -1;
        var mid = 0;
        for (var i = 0; i < locations.length; i++) {
            for (var j = i + 1; j < locations.length; j++) {
                const dl = this.dLon(locations[i], locations[j]);
                const dla = Math.abs(dl);
                if (dla > max) {
                    max = dla;
                    mid = locations[j].lon + dl / 2;
                }
            }
        }
        return mid >= 180 ? mid - 360 :
            mid >= -180 ? mid : mid + 360;
    }

    /**
     * Returns the center location {lat, lon}
     * @param {*} locations locations
     */
    center(locations) {
        const minLat = _(locations).map('lat').min();
        const maxLat = _(locations).map('lat').max();
        return {
            lat: (maxLat + minLat) / 2,
            lon: this.lonCenter(locations)
        };
    }

    /**
     * Returns the coordinates in nm {center:{lat, lon}, nodes:[{node:any, coords:[double]}]}
     * @param {*} nodes locations {id:{lat, long}, ...}
     * @param {*} center center {lat, long}
     */
    coords(nodes, center) {
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
        ).max();
        const result = {
            nodes: _nodes.value(),
            xmin: x.min(),
            xmax: x.max(),
            ymin: y.min(),
            ymax: y.max(),
            range
        };
        return result;
    }

    radial(location, hdg, ds) {
        const { lat, lon } = location;
        const hdgRad = hdg * RADS_PER_DEG;
        const dlat = ds * Math.cos(hdgRad) / NMS_PER_DEG;
        const dlon = ds * Math.sin(hdgRad) / Math.cos(lat * RADS_PER_DEG) / NMS_PER_DEG;
        const newLat = lat + dlat;
        const newLon = lon + dlon;
        return { lat: newLat, lon: newLon };
    }
}

export const mapDao = new MapDao();