
const KEY = 'atc.session';

class SessionDao {

    session(id) {
        const sess = JSON.parse(localStorage.getItem(KEY));
        return sess.id === id ? sess : undefined;
    }

    putSession(session) {
        localStorage.setItem(KEY, JSON.stringify(session));
    }
}

export const sessionDao = new SessionDao();