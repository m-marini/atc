import { of } from "rxjs";
import { filter, map } from "rxjs/operators";
import { v4 as uuidv4 } from 'uuid';

const KEY = 'atc.session';
const CURRENT_VERSION = '1.0';

class SessionDao {

    get session() {
        return of(localStorage.getItem(KEY)).pipe(
            map(JSON.parse));
    }

    getSession(id) {
        return this.session.pipe(
            filter(sess => sess.id === id)
        );
    }

    getSessions() {
        return this.session.pipe(
            map(session => {
                return [session];
            })
        );
    }

    putSession(session) {
        localStorage.setItem(KEY, JSON.stringify(session));
        return session;
    }

    create(levelId, mapId) {
        const session = {
            id: uuidv4(),
            version: CURRENT_VERSION,
            level: levelId,
            map: mapId,
            t: 0,
            entries: {},
            flights: {},
            noFlights: 0,
            noLandedOk: 0,
            noLandedKo: 0,
            noExitOk: 0,
            noExitKo: 0,
            noCollision: 0
        };
        return this.putSession(session);
    }
}

export const sessionDao = new SessionDao();