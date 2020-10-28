import React from 'react';
import _ from 'lodash';
import { toast } from 'react-toastify';
import { MESSAGE_TYPES } from './Events';

const DEFAULT_CONF = {
    maxMessage: 10
};

/**
 * 
 */
class CockpitLogger {

    constructor(props = {}) {
        this._log = [];
        this.props = _.defaults({}, props, DEFAULT_CONF);
        _.bindAll(this, ['sendMessage']);
    }

    /**
     * 
     */
    get log() {
        return this._log;
    }

    /**
     * 
     * @param {*} msg 
     */
    sendMessage(msg) {
        const { maxMessage } = this.props;
        switch (msg.type) {
            case MESSAGE_TYPES.ATC:
                toast.dark(
                    <div className="bg-light text-success border-success border rounded p-2">
                        {msg.msg}
                    </div>
                );
                break;
            default:
                toast.dark(
                    <div className="bg-light text-dark border-light border rounded p-2">
                        {msg.msg}
                    </div>
                );
                break;
        }

        this._log = _(this.log).concat(msg).takeRight(maxMessage).value();
        return this;
    }
}

/**
 * 
 */
function cockpitLogger() {
    return new CockpitLogger();
}

export { cockpitLogger };