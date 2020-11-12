const MESSAGE_TYPES = {
    ATC: 'atc',
    FLIGHT: 'flight',
    EMERGENCY: 'emergency',
    READBACK: 'readback'
}

const EVENT_TYPES = {
    ENTER: 'enter',
    RIGHT_LEAVE: 'rightLeave',
    RIGHT_LAND: 'rightLand',

    HOLD: 'hold',
    HOLD_AT: 'holdAt',
    CLEARED_TO_LAND: 'clearedToLand',
    FLY_TO: 'flyTo',
    FLY_TO_VIA: 'flyToVia',
    CLEARED_TO_TAKE_OFF: 'clearedToTakeOff',
    ATC_GO_AROUND: 'atcGoAround',
    CLIMB_TO: 'climbTo',
    DESCEND_TO: 'descendTo',
    MAINTAIN_FLIGHT_LEVEL: 'maintainFlightLavel',

    COLLISION: 'collision',
    GO_AROUND_APPROACH: 'goAroundApproach',
    GO_AROUND_RUNWAY: 'goAroundRunway',
    WRONG_LEAVE: 'wrongLeave',
    WRONG_LAND: 'wrongLand',
    OUT_OF_AREA: 'outOfArea',
    FLYING_TO: 'flyingTo',
    PASSING: 'passing',

    UNABLE_TO_HOLD: 'unableToHold',
    UNABLE_TO_HOLD_AT: 'unableToHoldAt',
    UNABLE_TO_LAND_GROUND: 'unableToLandGround',
    UNABLE_TO_LAND_DISTANCE: 'unableToLandDistance',
    UNABLE_TO_LAND_ALTITUDE: 'unableToLandAltitude',
    UNABLE_TO_FLY_TO: 'unableToFlyTo',
    UNABLE_TO_FLY_TO_VIA: 'unableToFlyToVia',

    UNKWOWN_FLIGHT: 'unknownFlight'
};

function buildEvent(type, flight, map, cmd) {
    return { type, flight, map, cmd }
}

export { buildEvent, EVENT_TYPES, MESSAGE_TYPES };