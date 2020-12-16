export interface Level {
    readonly id: string;
    readonly name: string;
    readonly maxPlane: number;
    readonly flightFreq: number;
}

export interface LevelList {
    readonly levels: Level[];
}
