import React from 'react';
import _ from 'lodash';
import { Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { MESSAGE_TYPES } from './MessagesUtils';

const DEFAULT_CONF = {
    maxMessage: 10
};


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
     */
    sendMessage(msg) {
        const { maxMessage } = this.props;
        switch (msg.type) {
            case MESSAGE_TYPES.ATC:
                toast.dark((<Alert variant="success">{msg.msg}</Alert>));
                break;
            case MESSAGE_TYPES.EMERGENCY:
                toast.error((<Alert variant="danger">{msg.msg}</Alert>));
                break;
            case MESSAGE_TYPES.FLIGHT:
                toast.dark((<Alert variant="warning">{msg.msg}</Alert>));
                break;
            default:
                toast.dark((<Alert variant="dark">{msg.msg}</Alert>));
                break;
        }

        this._log = _(this.log).concat(msg).takeRight(maxMessage).value();
        return this;
    }
}

function cockpitLogger() {
    return new CockpitLogger();
}

export { cockpitLogger };