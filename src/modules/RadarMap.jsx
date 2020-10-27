
import _ from 'lodash';
import { mapDao } from './MapDao';

/**
 * RadarMap computes the pixel position of nodes or locations in the map
 */
class RadarMap {

    /**
     * Creates the radar map
     * @param {*} props the props {nodeMap, map, width=800, height=800, borders=30, offsetX, offsetY, scale}
     */
    constructor(props) {
        const props1 = _.defaults({}, props, {
            width: 800,
            height: 800,
            borders: 30
        });
        const { nodeMap, width, height, borders, offsetX = 0, offsetY = 0 } = props1;
        if (props1.scale === undefined) {
            const xRange = Math.max(nodeMap.xmax, -nodeMap.xmin);
            const yRange = Math.max(nodeMap.ymax, -nodeMap.ymin);
            const xscale = (width - borders * 2) / xRange / 2;
            const yscale = (height - borders * 2) / yRange / 2;
            const scale1 = Math.min(xscale, yscale);
            this.props = _.defaults({ scale: scale1, offsetX, offsetY }, props1);
        } else {
            this.props = _.defaults({ offsetX, offsetY }, props1);
        }
    }

    /**
     * Returns the width of map in px
     */
    get witdh() { return this.props.width; }

    /**
     * Returns the height of map in px
     */
    get height() { return this.props.height; }

    /**
     * Returns the node map
     */
    get nodeMap() { return this.props.nodeMap; }

    /**
     * Returns the map
     */
    get map() { return this.props.map; }

    /**
     * Returns the nodes
     */
    get nodes() { return this.nodeMap.nodes; }

    /**
     * 
     */
    get scale() { return this.props.scale; }

    /**
     * 
     */
    get offsetX() { return this.props.offsetX; }

    /**
     * 
     */
    get offsetY() { return this.props.offsetY; }

    /**
     * Return a node
     * @param {*} id the node id 
     */
    node(id) {
        return this.nodes[id];
    }

    /**
     * Returns the pix coordinates of node [x, y]
     * @param {*} coords the coordinates in nms
     */
    pointByNm(coords) {
        const { width, height } = this.props;
        const x = (coords[0] - this.offsetX) * this.scale + width / 2;
        const y = -(coords[1] - this.offsetY) * this.scale + height / 2;
        return [x, y];
    }

    /**
     * Returns the pix coordinate of node [x, y]
     * @param {*} node the node
     */
    pointByNode(node) {
        return this.pointByNm(node.coords);
    }

    /**
     * Returns the pix coordinate of node [x, y]
     * @param {*} id the node id
     */
    pointByNodeId(id) {
        return this.pointByNode(this.node(id));
    }

    /**
     * Returnds the route paths  [[fromx, toy], [tox, toy]]
     * @param {*} route the route
     */
    routePath(route) {
        const from = this.pointByNodeId(route.edges[0]);
        const to = this.pointByNodeId(route.edges[1]);
        return [from, to];
    }

    /**
     * return the pix coordinate [x, y]
     * @param {*} location the location {lat, lon}
     */
    pointByGeo(location) {
        return this.pointByNm(mapDao.xy(location, this.map.center));
    }

    /**
     * 
     * @param {*} dx 
     * @param {*} dy 
     */
    moveByNm(dx, dy) {
        return new RadarMap(_.defaults({
            offsetX: this.offsetX + dx,
            offsetY: this.offsetY + dy
        }, this.props));
    }

    /**
     * 
     * @param {*} dx 
     * @param {*} dy 
     */
    moveByPts(dx, dy) {
        const dxnms = -dx / this.scale;
        const dynms = dy / this.scale;
        return this.moveByNm(dxnms, dynms);
    }
}

export default RadarMap;
