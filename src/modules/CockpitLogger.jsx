import _ from 'lodash';

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
        this._log = _(this.log).concat(msg).takeRight(maxMessage).value();
        return this;
    }
}

function cockpitLogger() {
    return new CockpitLogger();
}

export { cockpitLogger };