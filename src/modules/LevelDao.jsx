
import { AsyncSubject } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, tap } from 'rxjs/operators';
import _ from 'lodash';

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

    level(id) {
        return this.levels().pipe(
            map(data => _.find(data.levels, { id: id }))
        );
    }
}

export const levelDao = new LevelDao();