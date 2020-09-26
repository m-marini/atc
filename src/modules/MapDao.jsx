
import { ajax } from 'rxjs/ajax';
import { map, tap } from 'rxjs/operators';
import _ from 'lodash';
import { AsyncSubject } from 'rxjs';

const url = process.env.REACT_APP_BASENAME + '/data/maps.json';
const NMS_PER_DEG = 60;
const RADS_PER_DEG = Math.PI / 180;
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
            map(maps =>
                _(maps.maps)
                    .filter(map => map.id === id)
                    .first()
            ));
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
    distance(from, to) {
        const v0 = this.versor(from);
        const v1 = this.versor(to);
        const c = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
        return Math.acos(c) * NMS_PER_RAD;
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
     * @param {*} locations locations {lat, long}
     * @param {*} center center {lat, long}
     */
    coords(locations, center) {
        const nodes = _.map(locations, l => {
            return {
                node: l,
                coords: this.xy(l, center)
            };
        });
        return { nodes };
    }
}

export const mapDao = new MapDao();