import _ from 'lodash';
import { AreaMap, FlightMap, GeoLocation, MapRoute, RadarNode } from './Map';
import { mapDao } from './MapDao';

export interface RadarMapProps {
    readonly map: AreaMap;
    readonly nodeMap: FlightMap;
    readonly width: number;
    readonly height: number;
    readonly borders: number;
    readonly offsetX: number;
    readonly offsetY: number
    readonly scale?: number;
}

interface Rect {
    readonly topLeft: number[];
    readonly bottomRight: number[];
}

/**
 * RadarMap computes the pixel position of nodes or locations in the map
 */
class RadarMap {
    private _props: RadarMapProps;

    /**
     * Creates the radar map
     * @param {*} props the props
     */
    constructor(props: RadarMapProps) {
        const { nodeMap, width, height, borders, offsetX = 0, offsetY = 0 } = props;
        if (props.scale === undefined) {
            const xRange = Math.max(nodeMap.xmax, -nodeMap.xmin);
            const yRange = Math.max(nodeMap.ymax, -nodeMap.ymin);
            const xscale = (width - borders * 2) / xRange / 2;
            const yscale = (height - borders * 2) / yRange / 2;
            const scale1 = Math.min(xscale, yscale);
            this._props = _.assign({}, props, { scale: scale1, offsetX, offsetY });
        } else {
            this._props = _.assign({}, props, { offsetX, offsetY });
        }
    }

    /** */
    get props(): RadarMapProps { return this._props; }

    /** */
    get gridSize(): number {
        const { width, height, borders } = this.props;
        const mapSize = (Math.min(width, height) - borders * 2) / this.scale;
        const gs10 = mapSize / 5;
        const logGs = Math.round(Math.log10(gs10));
        const gs = Math.pow(10, logGs);
        return gs;
    }

    /** */
    get rect(): Rect {
        const { nodeMap } = this.props;
        const xRange = Math.max(nodeMap.xmax, -nodeMap.xmin);
        const yRange = Math.max(nodeMap.ymax, -nodeMap.ymin);
        return {
            topLeft: [-xRange, -yRange],
            bottomRight: [xRange, yRange]
        };
    }

    /**
     * Returns the width of map in px
     */
    get witdh(): number { return this.props.width; }

    /**
     * Returns the height of map in px
     */
    get height(): number { return this.props.height; }

    /**
     * Returns the node map
     */
    get nodeMap(): FlightMap { return this.props.nodeMap; }

    /**
     * Returns the map
     */
    get map(): AreaMap { return this.props.map; }

    /**
     * Returns the nodes
     */
    get nodes(): Record<string, RadarNode> { return this.nodeMap.nodes; }

    /** */
    get scale(): number { return this.props.scale || 1; }

    /** */
    get offsetX(): number { return this.props.offsetX; }

    /** */
    get offsetY(): number { return this.props.offsetY; }

    /**
     * Return a node
     * @param id the node id 
     */
    node(id: string): RadarNode {
        return this.nodes[id];
    }

    /**
     * Returns the pix coordinates of node [x, y]
     * @param coords the coordinates in nms
     */
    pointByNm(coords: number[]): number[] {
        const { width, height } = this.props;
        const x = (coords[0] - this.offsetX) * this.scale + width / 2;
        const y = -(coords[1] - this.offsetY) * this.scale + height / 2;
        return [x, y];
    }

    /**
     * Returns the pix coordinate of node [x, y]
     * @param node the node
     */
    pointByNode(node: RadarNode): number[] {
        return this.pointByNm(node.coords);
    }

    /**
     * Returns the pix coordinate of node [x, y]
     * @param id the node id
     */
    pointByNodeId(id: string): number[] {
        return this.pointByNode(this.node(id));
    }

    /**
     * Returnds the route paths  [[fromx, toy], [tox, toy]]
     * @param route the route
     */
    routePath(route: MapRoute): number[][] {
        const from = this.pointByNodeId(route.edges[0]);
        const to = this.pointByNodeId(route.edges[1]);
        return [from, to];
    }

    /**
     * return the pix coordinate [x, y]
     * @param location the location {lat, lon}
     */
    pointByGeo(location: GeoLocation): number[] {
        return this.pointByNm(mapDao.xy(location, this.map.center));
    }

    /**
     * 
     * @param dx 
     * @param dy 
     */
    moveByNm(dx: number, dy: number): RadarMap {
        return new RadarMap(_.defaults({
            offsetX: this.offsetX + dx,
            offsetY: this.offsetY + dy
        }, this.props));
    }

    /**
     * 
     * @param dx 
     * @param dy 
     */
    moveByPts(dx: number, dy: number): RadarMap {
        const dxnms = -dx / this.scale;
        const dynms = dy / this.scale;
        return this.moveByNm(dxnms, dynms);
    }
}

export default RadarMap;
