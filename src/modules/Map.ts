import { Schema, Validator } from 'jsonschema';

export interface GeoLocation {
    readonly lat: number;
    readonly lon: number;
}

export const GeoLocationSchema: Schema = {
    type: 'object',
    properties: {
        lat: { type: 'number' },
        lon: { type: 'number' },
    },
    required: ['lat', 'lon']
};

export enum MapNodeType {
    Beacon = 'beacon',
    Entry = 'entry',
    OuterMarker = 'om',
    Runway = 'runway'
}

const MapNodeTypeSchema: Schema = {
    type: 'string',
    enum: Object.values(MapNodeType)
};

export enum MapNodeAlignment {
    N = 'N',
    NE = 'NE',
    E = 'E',
    SE = 'SE',
    S = 'S',
    SW = 'SW',
    W = 'W',
    NW = 'NW'
}

const MapNodeAlignmentSchema: Schema = {
    type: 'string',
    enum: Object.values(MapNodeAlignment)
};


export interface BasicMapNode extends GeoLocation {
    readonly id: string;
    readonly type: MapNodeType;
    readonly alignment: MapNodeAlignment;
}

const BasicMapNodeSchema: Schema = {
    allOf: [
        GeoLocationSchema,
        {
            type: "object",
            properties: {
                id: { type: 'string' },
                type: MapNodeTypeSchema,
                alignment: MapNodeAlignmentSchema
            },
            required: ['id', 'type', 'alignment']
        }
    ]
};

export interface HeadingMapNode extends BasicMapNode {
    readonly hdg: number;
}

const HeadingMapNodeSchema: Schema = {
    allOf: [
        GeoLocationSchema,
        {
            type: 'object',
            properties: { hdg: { type: 'integer' }, },
            required: ['hdg']
        }
    ]
};

export type MapNode = HeadingMapNode | BasicMapNode;

const MapNodeSchema: Schema = {
    anyOf: [
        BasicMapNodeSchema,
        HeadingMapNodeSchema,
    ]
};

export enum MapRouteType {
    Connection = 'connection',
    Entry = 'entry',
    Land = 'land',
    LandConnection = 'landConnection',
    Takeoff = 'takeoff',
}

const MapRouteTypeSchema: Schema = {
    type: 'string',
    enum: Object.values(MapRouteType)
}

export interface MapRoute {
    readonly type: MapRouteType;
    readonly edges: string[];
}

const MapRouteSchema: Schema = {
    type: 'object',
    properties: {
        type: MapRouteTypeSchema,
        edges: {
            type: 'array',
            items: [
                { type: 'string' }
            ],
            minItems: 2,
            maxItems: 2
        }
    },
    required: ['type', 'edges']
}

export interface AreaMap {
    readonly id: string;
    readonly name: string;
    readonly descr: string;
    readonly center: GeoLocation;
    readonly nodes: Record<string, MapNode>;
    readonly routes: MapRoute[];
}

const AreaMapSchema: Schema = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        descr: { type: 'string' },
        center: GeoLocationSchema,
        nodes: {
            type: 'object',
            additionalProperties: MapNodeSchema
        },
        routes: {
            type: 'array',
            items: MapRouteSchema
        }
    },
    required: ['id', 'name', 'descr', 'center', 'nodes', 'routes']
};

export interface AreaMapSet {
    readonly maps: Record<string, AreaMap>;
}
export const AreaMapSetSchema: Schema = {
    type: 'object',
    properties: {
        maps: {
            type: 'object',
            additionalProperties: AreaMapSchema
        }
    },
    required: ['maps']
};


export interface RadarNode { node: MapNode, coords: number[] }

export interface FlightMap {
    readonly nodes: Record<string, RadarNode>,
    readonly xmin: number;
    readonly xmax: number;
    readonly ymin: number;
    readonly ymax: number;
    readonly range: number;
}

export function validateAreaMapSet(obj: any): AreaMapSet {
    new Validator().validate(obj, AreaMapSetSchema, { throwError: true });
    return obj as AreaMapSet;
}

export function isRunway(node: MapNode): node is HeadingMapNode {
    return node.type === MapNodeType.Runway;
}

export function isEntryNode(node: MapNode): node is HeadingMapNode {
    return node.type === MapNodeType.Entry;
}
