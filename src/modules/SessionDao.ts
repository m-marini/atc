import { defer, EMPTY, Observable, of } from "rxjs";
import { v4 as uuidv4 } from 'uuid';
import { Session, CURRENT_VERSION, validateSession } from "./Session";
import { filter } from "rxjs/operators";

const KEY = 'atc.session';

function session(): Session | undefined {
    const text = localStorage.getItem(KEY);
    if (text !== null) {
        try {
            return validateSession(JSON.parse(text));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

/**
 * 
 */
class SessionDao {

    /**
     * 
     * @param id 
     */
    getSession(id: string): Observable<Session> {
        const result = this.getSessions().pipe(
            filter(sess => !!sess && sess.id === id)
        );
        return result;
    }

    /** */
    getSessions(): Observable<Session> {
        return defer(() => {
            try {
                const s = session();
                return !s ? EMPTY : of(s);
            } catch (err) {
                return EMPTY;
            }
        });
    }

    /**
     * 
     * @param session 
     */
    putSession(session: Session) {
        localStorage.setItem(KEY, JSON.stringify(session));
        return session;
    }

    /**
     * 
     * @param levelId 
     * @param mapId 
     */
    create(levelId: string, mapId: string, atcVoice?: string): Session {
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
            noCollision: 0,
            atcVoice
        };
        return this.putSession(session);
    }
}

export const sessionDao = new SessionDao();
