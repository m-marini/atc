
import { AsyncSubject, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, tap } from 'rxjs/operators';
import _ from 'lodash';
import { Level, LevelList } from './Level';
import { homepage } from '../../package.json';

const url = `/${homepage}/data/levels.json`;

class LevelDao {
    private _subj: AsyncSubject<LevelList>;

    /** */
    constructor() {
        this._subj = new AsyncSubject();
        ajax.getJSON<LevelList>(url).pipe(
            tap(undefined, error => {
                console.error(error);
            })).subscribe(this._subj);
    }

    /** */
    levels(): Observable<LevelList> {
        return this._subj;
    }

    /**
     * 
     * @param id 
     */
    level(id: string): Observable<Level | undefined> {
        return this.levels().pipe(
            map(list => _.find(list.levels, { id: id }))
        );
    }
}

export const levelDao = new LevelDao();
