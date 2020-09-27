
import _ from 'lodash';
import { mapDao } from './MapDao';

class RadarMap {

    constructor(props) {
        this.props = _.defaults({}, props, {
            width: 800,
            height: 400,
            borders: 30
        });
        const { nodeMap, width, height, borders } = this.props;
        const xRange = Math.max(nodeMap.xmax, -nodeMap.xmin);
        const yRange = Math.max(nodeMap.ymax, -nodeMap.ymin);
        const xscale = (width - borders * 2) / xRange / 2;
        const yscale = (height - borders * 2) / yRange / 2;
        this.scale = Math.min(xscale, yscale);
    }

    get witdh() { return this.props.width; }

    get height() { return this.props.height; }

    get nodeMap() { return this.props.nodeMap; }

    get map() { return this.props.map; }

    get nodes() { return this.nodeMap.nodes; }

    node(id) {
        return _(this.nodes).find(node => node.node.id === id);
    }

    pointByNm(coords) {
        const { width, height } = this.props;
        const x = coords[0] * this.scale + width / 2;
        const y = -coords[1] * this.scale + height / 2;
        return [x, y];
    }

    pointByNode(node) {
        return this.pointByNm(node.coords);
    }

    pointByNodeId(id) {
        return this.pointByNode(this.node(id));
    }

    routePath(route) {
        const from = this.pointByNodeId(route.edges[0]);
        const to = this.pointByNodeId(route.edges[1]);
        return [from, to];
    }

    pointByGeo(location) {
        return this.pointByNm(mapDao.xy(location, this.map.center));
    }
}

export default RadarMap;
