import React, { Component } from 'react';

import _ from 'lodash';
import RadarMap from './RadarMap';
import { sprintf } from 'sprintf-js';
import { FLIGHT_STATES } from './Flight';

const RadarConf = {
    width: 850,
    height: 850,
};

const ImageConf = {
    width: 15,
    height: 14
};

const PlaneConf = {
    text1: { x: 2, y: -24 },
    text2: { x: 2, y: -12 },
    bar: { x1: 0, x2: 0, y1: -8, y2: -34 }
};

const FlightLevels = ['040', '080', '120', '160', '200', '240', '280', '320', '360'];

function textPos(pt, props) {
    const { alignment = 'E', width = 20, height = 8, radius = 6 } = props;
    var x = pt[0];
    var y = pt[1];
    switch (alignment) {
        case 'W':
        case 'NW':
        case 'SW':
            x -= radius + width;
            break;
        case 'E':
        case 'NE':
        case 'SE':
            x += radius;
            break;
        default:
            x -= width / 2;
    }
    switch (alignment) {
        case 'N':
        case 'NE':
        case 'NW':
            y -= radius;
            break;
        case 'S':
        case 'SE':
        case 'SW':
            y += radius + height;
            break;
        default:
            y += height / 2;
    }
    return [x, y];
}


function flightLevel(altitude) {
    return FlightLevels[Math.max(0, Math.floor((altitude - 2000) / 4000))];
}

function Node({ node, radarMap }) {
    const pt = radarMap.pointByNode(node);
    const textPt = textPos(pt, { alignment: node.node.alignment });
    const nodeClass = node.node.type;
    const textClass = node.node.type;
    return (<g>
        <circle cx={pt[0]} cy={pt[1]} className={nodeClass} />
        <text x={textPt[0]} y={textPt[1]} className={textClass}>{node.node.id}</text>
    </g>);
}

function rotate(a, x, y) {
    return sprintf('rotate(%f,%f,%f)', a, x, y);
}

function translate(x, y) {
    return sprintf('translate(%g,%g)', x, y);
}

function Flight({ flight, radarMap }) {
    if (flight.status === FLIGHT_STATES.WAITING_FOR_TAKEOFF) {
        return (<g />);
    } else {
        const pt = radarMap.pointByGeo(flight);
        const fl = flightLevel(flight.alt);
        const trans = translate(pt[0] - ImageConf.width / 2, pt[1] - ImageConf.height / 2)
            + rotate(flight.hdg, ImageConf.width / 2, ImageConf.height / 2);
        const url = `${process.env.REACT_APP_BASENAME}/images/${flight.type === 'J' ? 'jet' : 'plane'
            }-${fl}.png`;
        const txt1 = sprintf("%s %s", flight.id, flight.type);
        const txt2 = sprintf('%03d %02d', Math.round(flight.alt / 100), Math.round(flight.speed / 10));
        const x1 = pt[0] + PlaneConf.text1.x;
        const x2 = pt[0] + PlaneConf.text2.x;
        const y1 = pt[1] + PlaneConf.text1.y;
        const y2 = pt[1] + PlaneConf.text2.y;
        const x3 = pt[0] + PlaneConf.bar.x1;
        const x4 = pt[0] + PlaneConf.bar.x2;
        const y3 = pt[1] + PlaneConf.bar.y1;
        const y4 = pt[1] + PlaneConf.bar.y2;
        const txtClassName = 'fl-' + fl;
        return (
            <g>
                <image href={url}
                    x={0} y={0}
                    width={ImageConf.width} height={ImageConf.height}
                    transform={trans} />
                <line x1={x3} y1={y3} x2={x4} y2={y4} className={txtClassName} />
                <text x={x1} y={y1} className={txtClassName}>{txt1}</text>
                <text x={x2} y={y2} className={txtClassName}>{txt2}</text>
            </g>);
    }
}

function Route({ route, radarMap }) {
    const pts = radarMap.routePath(route);
    const cl = route.type;
    return (<line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} className={cl} />);
}

class RadarPane extends Component {

    constructor(props) {
        super(props);
        this.render = this.render.bind(this);
        _.bindAll(this, ['handleDown', 'handleMove', 'handleUp']);
    }

    handleDown(ev) {
        this.setState({
            offsetX: ev.clientX,
            offsetY: ev.clientY
        })
    }

    handleUp(ev) {
        console.log(ev.offsetX, ev.offsetY, ev);
    }

    handleMove(ev) {
        console.log(ev.button);
    }
    handleMove1(ev) {
        if (ev.button === 0) {
            const { offsetX, offsetY } = this.state;
            const { clientX, clientY } = ev;
            const dx = clientX - offsetX;
            const dy = clientY - offsetY;
            console.log(dx, dy);
        }
    }

    render() {
        const { map, nodeMap, session } = this.props;
        if (!nodeMap || !map || !session) {
            return (<svg width={RadarConf.width} height={RadarConf.height} className="radar" />);
        } else {
            const radarMap = new RadarMap({
                map,
                nodeMap,
                width: RadarConf.width,
                height: RadarConf.height
            });
            const flights = (session || { flights: {} }).flights;
            return (
                <svg width={RadarConf.width} height={RadarConf.height}
                    onMouseMove={this.handleMove}
                    onMouseDown={this.handleDown}
                    onMouseUp={this.handleUp}
                    className="radar">
                    {
                        _.map(map.routes, (route, i) => {
                            return (<Route key={i} radarMap={radarMap} route={route} />);
                        })
                    }
                    {
                        _(nodeMap.nodes).values().map(node => {
                            return (
                                <Node key={node.node.id} radarMap={radarMap} node={node} />
                            );
                        }).value()
                    }
                    {
                        _(flights).values().orderBy('alt', 'asc').map(flight => {
                            return (
                                <Flight key={flight.id} radarMap={radarMap} flight={flight} />
                            );
                        }).value()
                    })

                    }
                </svg>
            );
        }
    }
}
/*
*/
export default RadarPane;
