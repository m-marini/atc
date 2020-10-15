
const MESSAGE_TYPES = {
    ATC: 'atc',
    FLIGHT: 'flight',
    READBACK: 'readback',
    EMERGENCY: 'emergency'
};

class MessageUtils {
    constructor(props) {
        this.props = props;
    }

    sendMessage(build) {
        const { sendMessage } = this.props;
        if (!!sendMessage) {
            sendMessage(build());
        }
    }

    atcMessage(flight, msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.ATC,
                msg: `${flight.id}, ${this.props.map.name} ATC, ${msg}`
            }
        });
    }

    flightMessage(flight, msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.FLIGHT,
                msg: `${this.props.map.name} ATC, ${flight.id}, ${msg}`
            }
        });
    }

    readbackMessage(flight, msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.READBACK,
                msg: `${msg}, ${flight.id}`
            }
        });
    }

    atcEmergency(flight, msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.EMERGENCY,
                msg: `${flight.id}, ${this.props.map.name} ATC, ${msg}`
            }
        });
    }

    flightEmergency(flight, msg) {
        this.sendMessage(() => {
            return {
                type: MESSAGE_TYPES.EMERGENCY,
                msg: `${this.props.map.name} ATC, ${flight.id}, ${msg}`
            }
        });
    }
}

export { MessageUtils, MESSAGE_TYPES };