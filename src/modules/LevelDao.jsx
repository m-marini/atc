
import { AsyncSubject } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { tap } from 'rxjs/operators';

const url = process.env.REACT_APP_BASENAME + '/data/levels.json';

class LevelDao {
    constructor() {
        this._subj = new AsyncSubject();
        ajax.getJSON(url).pipe(
            tap(undefined, error => {
                console.error(error);
            })).subscribe(this._subj);
    }

    levels() {
        return this._subj;
    }
}

export const levelDao = new LevelDao();