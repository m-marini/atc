
import _ from 'lodash';
import { mapDao } from './MapDao';

/**
 * RadarMap computes the pixel position of nodes or locations in the map
 */
class RadarMap {

    /**
     * Creates the radar map
     * @param {*} props the props {nodeMap, map, width=800, height=800, borders=30}
     */
    constructor(props) {
        this.props = _.defaults({}, props, {
            width: 800,
            height: 800,
            borders: 30
        });
        const { nodeMap, width, height, borders } = this.props;
        const xRange = Math.max(nodeMap.xmax, -nodeMap.xmin);
        const yRange = Math.max(nodeMap.ymax, -nodeMap.ymin);
        const xscale = (width - borders * 2) / xRange / 2;
        const yscale = (height - borders * 2) / yRange / 2;
        this.scale = Math.min(xscale, yscale);
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
        const x = coords[0] * this.scale + width / 2;
        const y = -coords[1] * this.scale + height / 2;
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
}

export default RadarMap;
