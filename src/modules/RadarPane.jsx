import React, { Component } from 'react';

import _ from 'lodash';
import './RadarPane.css'
import RadarMap from './RadarMap';

const RadarConf = {
    width: 800,
    height: 600,
};

class RadarPane extends Component {

    constructor(props) {
        super(props);
        this.render = this.render.bind(this);
    }

    render() {
        const { map } = this.props;
        if (!map) {
            return (
                <svg width={RadarConf.width} height={RadarConf.height} className="radar">
                </svg>
            );
        } else {
            const radarMap = new RadarMap({
                map,
                width: RadarConf.width,
                height: RadarConf.height
            });
            return (
                <svg width={RadarConf.width} height={RadarConf.height} className="radar">
                    {
                        _.map(map.nodes, node => {
                            const pt = radarMap.nodePoint(node);
                            return (<circle key={node.node.id} cx={pt[0]} cy={pt[1]} className="beacon" />);
                        })
                    }
                </svg>
            );
        }
    }
}

export default RadarPane;
