import { of } from "rxjs";
import { filter, map } from "rxjs/operators";
import { v4 as uuidv4 } from 'uuid';

const KEY = 'atc.session';

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

    putSession(session) {
        localStorage.setItem(KEY, JSON.stringify(session));
        return session;
    }

    create(levelId, mapId) {
        const session = {
            id: uuidv4(),
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