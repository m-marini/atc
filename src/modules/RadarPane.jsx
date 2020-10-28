import React, { Component } from 'react';

import _ from 'lodash';
import RadarMap from './RadarMap';
import { sprintf } from 'sprintf-js';
import { FLIGHT_STATES } from './Flight';

const ZOOM_SCALE = Math.log(10) / 4 / 57;
const GRID_MARKER_HEIGHT = 4;

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

/**
 * 
 * @param {*} pt 
 * @param {*} props 
 */
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

/**
 * 
 * @param {*} altitude 
 */
function flightLevel(altitude) {
    return FlightLevels[Math.max(0, Math.floor((altitude - 2000) / 4000))];
}

/**
 * 
 * @param {*} param0 
 */
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

/**
 * 
 * @param {*} a 
 * @param {*} x 
 * @param {*} y 
 */
function rotate(a, x, y) {
    return sprintf('rotate(%f,%f,%f)', a, x, y);
}

/**
 * 
 * @param {*} x 
 * @param {*} y 
 */
function translate(x, y) {
    return sprintf('translate(%g,%g)', x, y);
}

/**
 * 
 * @param {*} param0 
 */
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

/**
 *    x0   x1   x2
 * y1  |   |
 * y0  |---|    legend
 * y2  |   |
 * 
 * @param {*} param0 
 */
function GridMarker({ radarMap }) {
    const { borders } = radarMap.props;
    const gridSize = radarMap.gridSize;
    const x0 = borders / 2;
    const x1 = x0 + gridSize * radarMap.scale;
    const x2 = x1 + 10;
    const y0 = borders / 2;
    const y1 = borders / 2 - GRID_MARKER_HEIGHT;
    const y2 = borders / 2 + GRID_MARKER_HEIGHT;
    const gridMarkerText = sprintf("%g nms", gridSize);
    return (<g className="gridmarker">
        <line x1={x0} y1={y0} x2={x1} y2={y0} />
        <line x1={x0} y1={y1} x2={x0} y2={y2} />
        <line x1={x1} y1={y1} x2={x1} y2={y2} />
        <text x={x2} y={y0}>{gridMarkerText}</text>
    </g>
    );
}

/**
 * 
 * @param {*} param0 
 */
function Grid({ radarMap }) {
    const { topLeft, bottomRight } = radarMap.rect;
    const gridSize = radarMap.gridSize;
    const gxmin = Math.floor(topLeft[0] / gridSize);
    const gxmax = Math.ceil(bottomRight[0] / gridSize);
    const gymin = Math.floor(topLeft[1] / gridSize);
    const gymax = Math.ceil(bottomRight[1] / gridSize);
    const xidx = _.range(gxmin, gxmax + 1);
    const yidx = _.range(gymin, gymax + 1);
    const { borders, width, height } = radarMap.props;
    const x0 = borders;
    const x1 = width - borders;
    const y0 = borders;
    const y1 = height - borders;
    return (
        <g className="gridmap">
            {xidx.map(i => {
                const upnms = [i * gridSize, gymin * gridSize];
                const dwnnms = [i * gridSize, gymax * gridSize];
                const pts = [
                    radarMap.pointByNm(upnms),
                    radarMap.pointByNm(dwnnms)
                ];
                return (
                    <line key={`v${i}`}
                        x1={pts[0][0]} y1={y0}
                        x2={pts[1][0]} y2={y1} />
                );
            })}
            {yidx.map(i => {
                const lnms = [gxmin * gridSize, i * gridSize];
                const rpnms = [gxmax * gridSize, i * gridSize];
                const pts = [
                    radarMap.pointByNm(lnms),
                    radarMap.pointByNm(rpnms)
                ];
                return (
                    <line key={`h${i}`}
                        x1={x0} y1={pts[0][1]}
                        x2={x1} y2={pts[1][1]} />
                );
            })}
        </g>
    );
}

/**
 * 
 * @param {*} param0 
 */
function Route({ route, radarMap }) {
    const pts = radarMap.routePath(route);
    const cl = route.type;
    return (<line x1={pts[0][0]} y1={pts[0][1]} x2={pts[1][0]} y2={pts[1][1]} className={cl} />);
}

class RadarPane extends Component {

    /**
     * 
     * @param {*} props 
     */
    constructor(props) {
        super(props);
        const { map, nodeMap, session } = this.props;
        const scale = (!!nodeMap && !!map && !!session)
            ? new RadarMap({
                map,
                nodeMap,
                width: RadarConf.width,
                height: RadarConf.height
            }).scale
            : 1;

        this.state = {
            dragging: false,
            offsetX: 0,
            offsetY: 0,
            scale
        };
        _.bindAll(this, ['handleDown', 'handleMove', 'handleUp', 'handleWheel', 'render']);
    }

    /**
     *
     * @param {*} ev
     */
    handleDown(ev) {
        switch (ev.button) {
            case 0:
                // Drag map
                ev.preventDefault();
                this.setState({
                    dragging: true,
                    pivotX: ev.clientX,
                    pivotY: ev.clientY,
                    clientX: ev.clientX,
                    clientY: ev.clientY
                });
                break;
            case 1: {
                // fit the map to the viewport
                ev.preventDefault();
                const { map, nodeMap, session } = this.props;
                const scale = (!!nodeMap && !!map && !!session)
                    ? new RadarMap({
                        map,
                        nodeMap,
                        width: RadarConf.width,
                        height: RadarConf.height
                    }).scale
                    : 1;
                this.setState({
                    dragging: false,
                    offsetX: 0,
                    offsetY: 0,
                    scale
                });
            }
                break;
            default:
        }
    }

    /**
     *
     * @param {*} ev
     */
    handleUp(ev) {
        ev.preventDefault();
        const rm = this.radarMap;
        this.setState({
            dragging: false,
            offsetX: rm.offsetX,
            offsetY: rm.offsetY
        });
    }

    /**
     *
     * @param {*} ev
     */
    handleLeave(ev) {
        ev.preventDefault();
        this.setState({
            dragging: false
        });
    }

    /**
     * 
     * @param {*} ev 
     */
    handleWheel(ev) {
        if (ev.shiftKey) {
            // ev.preventDefault();
            const { deltaY } = ev;
            const factor = Math.exp(-deltaY * ZOOM_SCALE);
            const scale = this.radarMap.scale * factor;
            this.setState({ scale });
        }
    }

    /**
     *
     * @param {*} ev
     */
    handleMove(ev) {
        const { dragging } = this.state;
        if (dragging) {
            ev.preventDefault();
            const { clientX, clientY } = ev;
            this.setState({ clientX, clientY });
        }
    }

    /**
     * 
     */
    get radarMap() {
        const { map, nodeMap } = this.props;
        const { dragging, clientX, clientY, pivotX, pivotY, offsetX, offsetY, scale } = this.state;
        if (dragging) {
            return new RadarMap({
                map,
                nodeMap,
                width: RadarConf.width,
                height: RadarConf.height,
                offsetX,
                offsetY,
                scale
            }).moveByPts(clientX - pivotX, clientY - pivotY);
        } else {
            return new RadarMap({
                map,
                nodeMap,
                width: RadarConf.width,
                height: RadarConf.height,
                offsetX,
                offsetY,
                scale
            });
        }
    }

    /**
     * 
     */
    render() {
        const { map, nodeMap, session } = this.props;
        if (!nodeMap || !map || !session) {
            return (<svg width={RadarConf.width} height={RadarConf.height} className="radar" />);
        } else {
            const radarMap = this.radarMap;
            const flights = (session || { flights: {} }).flights;
            return (
                <svg width={RadarConf.width} height={RadarConf.height}
                    onMouseMove={this.handleMove}
                    onMouseDown={this.handleDown}
                    onMouseUp={this.handleUp}
                    onMouseLeave={this.handleUp}
                    onWheel={this.handleWheel}
                    className="radar">
                    <Grid radarMap={radarMap} />
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
                    <GridMarker radarMap={radarMap} />
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

export default RadarPane;
