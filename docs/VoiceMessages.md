# Voice synth

[TOC]

## Events

https://mediawiki.ivao.aero/index.php?title=Phraseology

### Entering

#### ENTER

Flight: "(atc) (flight) holding short runway (rwy) ready for departure to (rwy id)"
ATC:    "(flight) (atc) hold short runway (rwy)"
Flight: "holding short runway (rwy) (flight)"

Flight: "(atc) (flight) holding short runway (rwy) ready for departure via (id)"
ATC:    "(flight) (atc) hold short runway (rwy)"
Flight: "holding short runway (rwy) (flight)"

Flight: "(atc) (flight) enter control zone via (id) at flight level (fl) heading (hdg) to runway (rwy)"
ATC:    "(flight) (atc) maintain flight level (fl) heading (hdg)"
Flight: "maintaining flight level (fl) heading (hdg) (flight)"

Flight: "(atc) (flight) enter control zone via (id) at flight level (fl) heading (hdg) leave via (id)"
ATC:    "(flight) (atc) maintain flight level (fl) heading (hdg)"
Flight: "maintaining flight level (fl) heading (hdg) (flight)"

### Changing flight level

#### CLIMB

ATC:    "(flight) (atc) climb to flight level (fl)"
Flight: "climbing to flight level (fl) (flight)"

#### DESCEND

ATC:    "(flight) (atc) descend to flight level (fl)"
Flight: "descending to flight level (fl) (flight)"

#### MAINTAIN

ATC:    "(flight) (atc) maintain flight level"
Flight: "maintaining flight level (fl) (flight)"

#### CLEARED_TO_TAKE_OFF

ATC:    "(flight) (atc) runway (rwy) cleared to take off climb to flight level (fl)"
Flight: "runway (rwy) cleared to take off climbing to flight level (fl) (flight)"

#### PASSING

Flight: "(atc) (flight) passing flight level (fl)"
ATC:    "(flight) (atc) maintain flight level (fl)"
Flight: "maintaining flight level (fl) (flight)"

### Turning

#### FLY_TO

ATC:    "(flight) (atc) fly to (id)"
Flight: "flying to (id) (flight)"

#### FLY_TO_VIA

ATC:    "(flight) (atc) fly to (id) via (id)"
Flight: "flying to (id) via(id) (flight)"

#### FLYING_TO

Flight: "(atc) (flight) flying to (id)"
ATC:    "(flight) (atc) cleared to (id)"

#### UNABLE_TO_FLY_TO

ATC:    "(flight) (atc) fly to (id)"
Flight: "(atc) (flight) negative holding short runway (rwy)"
ATC:    "(flight) (atc) roger"

#### UNABLE_TO_FLY_TO_VIA

ATC:    "(flight) (atc) fly to (id) via (id)"
Flight: "(atc) (flight) negative holding short runway (rwy)"
ATC:    "(flight) (atc) roger"

### Landing

#### CLEAR_TO_LAND

ATC:    "(flight) (atc) cleared to land runway (rwy)"
Flight: "cleared to land runway (rwy) (flight)"

#### UNABLE_TO_LAND_GROUND

ATC:    "(flight) (atc) cleared to land runway (rwy)"
Flight: "(atc) (flight) negative holding short runway (rwy)"
ATC:    "(flight) (atc) roger"

#### UNABLE_TO_LAND_DISTANCE

ATC:    "(flight) (atc) cleared to land runway (rwy)"
Flight: "(atc) (flight) negative wrong distance"
ATC:    "(flight) (atc) roger"

#### UNABLE_TO_LAND_ALTITUDE

ATC:    "(flight) (atc) cleared to land runway (rwy)"
Flight: "(atc) (flight) negative wrong flight level"
ATC:    "(flight) (atc) roger"

#### ATC_GO_AROUND

ATC:    "(flight) (atc) pull up and go around climb to flight level (fl)"
Flight: "(flight) pulling up and going around climbing to flight level (fl) (flight)"

#### RIGHT_LAND

ATC:    "(flight) (atc) runway (rwy)) vacated`
Flight: "(atc) (flight) leaving frequency"
ATC:    "(flight) (atc) good day"

#### WRONG_LAND

ATC:    "(flight) (atc) runway (rwy)) vacated`
Flight: "(atc) (flight) wrong arrival runway leaving frequency"
ATC:    "(flight) (atc) good day"

#### GO_AROUND_APPROACH

Flight: "(atc) (flight) going around missing approach"
ATC:    "(flight) (atc) climb to flight level (fl)"
Flight: "climbing to flight level (fl) (flight)"

#### GO_AROUND_RUNWAY

Flight: "(atc) (flight) going around, missing runway"
ATC:    "(flight) (atc) climb to flight level (fl)"
Flight: "climbing to flight level (fl) (flight)"

### Holding

#### HOLD

ATC:    "(flight) (atc) hold at current position"
Flight: "holding at current position (flight)"

#### HOLD_AT

ATC:    "(flight) (atc) hold at (id)"
Flight: "holding at (id) (flight)"

#### UNABLE_TO_HOLD

ATC:    "(flight) (atc) hold at current position"
Flight: "(atc) (flight) negative holding short runway (rwy)"
ATC:    "(flight) (atc) roger"

#### UNABLE_TO_HOLD_AT

ATC:    "(flight) (atc) hold at (id)"
Flight: "(atc) (flight) negative holding short runway (rwy)"
ATC:    "(flight) (atc) roger"

### Leaving

#### RIGHT_LEAVE

Flight: "(atc) (flight) leaving controlled zone via (id) at flight level (fl)"
ATC:    "(flight) (atc) cleared to (id) departure"

#### WRONG_LEAVE

Flight: "(atc) (flight) leaving controlled zone via (id) at flight level (fl) missing departure"
ATC:    "(flight) (atc) roger"

#### OUT_OF_AREA

Flight: "(atc) (flight) leaving controlled zone heading (hdg) at flight level (fl) missing departure"
ATC:    "(flight) (atc) roger"

### Error

#### COLLISION

Flight: "(atc) (flight) mayday mayday mayday collision"

#### UNKWOWN_FLIGHT

ATC:    "operator (atc) flight (flight) not in area"
