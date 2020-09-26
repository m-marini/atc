
import _ from 'lodash';

class RadarMap {

    constructor(props) {
        this.props = _.defaults({}, props, {
            width: 800,
            height: 400,
            borders: 20
        });
        const { map, width, height, borders } = this.props;
        const xRange = Math.max(map.xmax, -map.xmin);
        const yRange = Math.max(map.ymax, -map.ymin);
        const xscale = (width - borders * 2) / xRange / 2;
        const yscale = (height - borders * 2) / yRange / 2;
        this.scale = Math.min(xscale, yscale);
    }

    get witdh() { return this.props.width; }

    get height() { return this.props.height; }

    get map() { return this.props.map; }

    get nodes() { return this.map.nodes; }

    nodePoint(node) {
        const { width, height } = this.props;
        const x = node.coords[0] * this.scale + width / 2;
        const y = -node.coords[1] * this.scale + height / 2;
        return [x, y];
    }
}

export default RadarMap;
