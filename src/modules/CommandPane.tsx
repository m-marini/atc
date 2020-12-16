import React, { FunctionComponent, Component } from 'react';
import { Button, ButtonGroup, Card, Col, Container, Row } from 'react-bootstrap';
import _ from 'lodash';
import { Flight, FlightStatus } from './Flight';
import { AreaMap, MapNodeType } from './Map';
import { buildClimbCommand, buildDescendCommand, buildFlyToCommand, buildHoldCommand, buildLandCommand, buildMaintainCommand, buildTakeoffCommand, CommandMessage } from './Message';
import { Session } from './Session';

enum SelectionStatus {
    FlightId = "flight-id",
    Command = "command",
    FlightLevel = "flight-level",
    Turn = "turn",
    TurnCondition = "turn-condition",
    LandingRunway = "landing-runway",
    HoldingCondition = "holding-condition"
}

const FlightLveles = ['040', '080', '120', '160', '200', '240', '280', '320', '360'];

/**
 * 
 * @param param0 
 */
const CommandSelection: FunctionComponent<Readonly<Partial<{
    flight: string;
    onAbort: () => void;
    onChangeFlightLevel: () => void;
    onTurnHeading: () => void;
    onClearToLand: () => void;
    onClearToTakeoff: () => void;
    onHold: () => void;
}>>> = ({ flight, onAbort, onChangeFlightLevel, onTurnHeading, onClearToLand, onHold }) => {
    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}
            </Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button variant="warning"
                        onClick={() => { if (!!onAbort) { onAbort() } }}>Abort</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onChangeFlightLevel) { onChangeFlightLevel() } }}>Change flight level</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onTurnHeading) { onTurnHeading() } }}>Fly to</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onClearToLand) { onClearToLand() } }}>Clear to land</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onHold) { onHold() } }}>Hold</Button>
                </ButtonGroup>
            </Card.Body>
        </Card>
    );
}

/**
 * 
 * @param flights 
 * @param onSelect 
 */
const FlightSelection: FunctionComponent<Readonly<Partial<{
    flights: Record<string, Flight>;
    onSelect: (id: string) => void
}>>> = ({ flights, onSelect }) => {
    const ids = flights ? _(flights).keys().sort().value() : [];
    return (
        <Card bg="dark" text="white">
            <Card.Header>Select flight</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    {ids.map(id => (
                        <Button key={id} variant="secondary"
                            onClick={() => { if (onSelect) { onSelect(id) } }
                            }>{id}</Button>
                    ))}
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

/**
 * 
 * @param param0 
 */
const RunwaySelection: FunctionComponent<Readonly<Partial<{
    flight: string;
    map: AreaMap;
    onAbort: () => void;
    onSelect: (id: string) => void;
}>>> = ({ flight, map, onAbort, onSelect }) => {
    const runways = map ? _(map.nodes)
        .filter({ type: MapNodeType.Runway })
        .map('id')
        .sort().value() : [];

    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}<br />
                clear to land
            </Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button
                        onClick={() => { if (!!onAbort) { onAbort() } }}
                        variant="warning">Abort</Button>
                    {runways.map(id => (
                        <Button key={id}
                            onClick={() => { if (!!onSelect) { onSelect(id) } }}
                            variant="secondary" >{id}</Button>
                    ))}
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

/**
 * 
 * @param param0 
 */
const DestinationSelection: FunctionComponent<Readonly<Partial<{
    flight: string;
    map: AreaMap;
    onAbort: () => void;
    onSelect: (id: string) => void;
}>>> = ({ flight, map, onAbort, onSelect }) => {
    const nodes = map ? _(map.nodes)
        .filter(node =>
            node.type === MapNodeType.Entry
            || node.type === MapNodeType.Beacon)
        .map('id').sort().value()
        : [];
    const numCol1 = Math.ceil((nodes.length + 1) / 2) - 1;
    const nodes1 = _.take(nodes, numCol1);
    const nodes2 = _.drop(nodes, numCol1);

    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}<br />
                turn to
            </Card.Header>
            <Card.Body>
                <Container fluid>
                    <Row>
                        <Col>
                            <ButtonGroup vertical>
                                <Button
                                    onClick={() => { if (!!onAbort) { onAbort() } }}
                                    variant="warning">Abort</Button>
                                {nodes1.map(id => (
                                    <Button key={id}
                                        onClick={() => { if (!!onSelect) { onSelect(id) } }}
                                        variant="secondary" >{id}</Button>
                                ))}
                            </ButtonGroup>
                        </Col>
                        <Col>
                            <ButtonGroup vertical>
                                {nodes2.map(id => (
                                    <Button key={id}
                                        onClick={() => { if (!!onSelect) { onSelect(id) } }}
                                        variant="secondary" >{id}</Button>
                                ))}
                            </ButtonGroup>
                        </Col>
                    </Row>
                </Container>
            </Card.Body >
        </Card >
    );
}

/**
 * 
 * @param param0 
 */
const ConditionButtons: FunctionComponent<Readonly<Partial<{
    map: AreaMap;
    onAbort: () => void;
    onSelect: (id?: string) => void
}>>> = ({ map, onAbort, onSelect }) => {
    const nodes = map ? _(map.nodes)
        .filter(node =>
            node.type === MapNodeType.Entry
            || node.type === MapNodeType.Beacon)
        .map('id')
        .sort().value()
        : [];

    const numCol1 = Math.ceil((nodes.length + 2) / 2) - 2;
    const nodes1 = _.take(nodes, numCol1);
    const nodes2 = _.drop(nodes, numCol1);

    return (
        <Container fluid>
            <Row>
                <Col>
                    <ButtonGroup vertical>
                        <Button
                            onClick={() => { if (!!onAbort) { onAbort() } }}
                            variant="warning">Abort</Button>
                        <Button
                            onClick={() => { if (!!onSelect) { onSelect() } }}
                            variant="primary">Now</Button>
                        {nodes1.map(id => (
                            <Button key={id}
                                onClick={() => { if (!!onSelect) { onSelect(id) } }}
                                variant="secondary" >{id}</Button>
                        ))}
                    </ButtonGroup>
                </Col>
                <Col>
                    <ButtonGroup vertical>
                        {nodes2.map(id => (
                            <Button key={id}
                                onClick={() => { if (!!onSelect) { onSelect(id) } }}
                                variant="secondary" >{id}</Button>
                        ))}
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}


/**
 * 
 * @param param0 
 */
const ConditionSelection: FunctionComponent<Readonly<Partial<{
    flight: string;
    node: string;
    map: AreaMap;
    onAbort: () => void;
    onSelect: (id: string | undefined) => void;
}>>> = ({ flight, node, map, onAbort, onSelect }) => {
    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}<br />
                turn to {node}<br />
                at beacon
            </Card.Header>
            <Card.Body>
                <ConditionButtons
                    map={map}
                    onAbort={onAbort}
                    onSelect={onSelect} />
            </Card.Body>
        </Card >
    );
}

/**
 * 
 * @param param0 
 */
const HoldCondition: FunctionComponent<Readonly<Partial<{
    flight: string;
    map: AreaMap;
    onAbort: () => void;
    onSelect: (id: string | undefined) => void;
}>>> = ({ flight, map, onAbort, onSelect }) => {
    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}<br />
                hold on at
            </Card.Header>
            <Card.Body>
                <ConditionButtons
                    map={map}
                    onAbort={onAbort}
                    onSelect={onSelect} />
            </Card.Body>
        </Card >
    );
}

/**
 * 
 * @param param0 
 */
const FlightLevelSelection: FunctionComponent<Readonly<Partial<{
    flight: string,
    onAbort: () => void,
    onSelect: (fl: string) => void
}>>> = ({ flight, onAbort, onSelect }) => {
    const flightLevels = _(FlightLveles).orderBy(_.identity, 'desc').value();
    return (
        <Card bg="dark" text="white">
            <Card.Header>
                Flight {flight}<br />
                change flight level
                </Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button variant="warning"
                        onClick={() => { if (!!onAbort) { onAbort() } }}>Abort</Button>
                    {flightLevels.map(fl => (
                        <Button key={fl} variant="secondary"
                            className={`fl-${fl}`}
                            onClick={() => { if (!!onSelect) { onSelect(fl) } }}> FL {fl}</Button>
                    ))}
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

/**
 * 
 */
type CommandPaneProps = Readonly<Partial<{
    session: Session;
    map: AreaMap;
    onCommand: (cmd: CommandMessage) => void
}>>;

/**
 * 
 */
export class CommandPane extends Component<CommandPaneProps, Readonly<{
    type: SelectionStatus;
    flight?: string;
    node?: string;
}>> {

    /**
     * 
     * @param props 
     */
    constructor(props: CommandPaneProps) {
        super(props);
        this.state = { type: SelectionStatus.FlightId };
        _.bindAll(this, [
            'handleFlightSelection',
            'handleAbort',
            'handleChangeFlightLevel',
            'handleFlightLevelSelect',
            'handleTurnHeading',
            'handleTurnHeadingSelect',
            'handleTurnConditionSelect',
            'handleClearToLand',
            'handleRunwaySelect',
            'handleHold',
            'handleHoldConditionSelect'
        ]);
    }

    /**
     * 
     * @param flight 
     */
    handleFlightSelection(flight: string) {
        this.setState({ flight, type: SelectionStatus.Command });
    }

    /**
     * 
     */
    handleAbort() {
        this.setState({ type: SelectionStatus.FlightId });
    }

    /**
     * 
     */
    handleChangeFlightLevel() {
        this.setState({ type: SelectionStatus.FlightLevel });
    }

    /**
     * 
     * @param fl 
     */
    handleFlightLevelSelect(fl: string) {
        const toAlt = parseInt(fl) * 100;
        const { flight: flightId } = this.state;
        const { session, onCommand } = this.props;
        const mapId = this.mapId;
        if (onCommand && flightId && session && mapId) {
            const flight = session.flights[flightId];
            if (!flight) {
                onCommand(buildClimbCommand(flightId, mapId, fl));
            } else if (flight.status === FlightStatus.WaitingForTakeoff) {
                onCommand(buildTakeoffCommand(flightId, mapId, flight.from, fl));
            } else if (toAlt > flight.alt) {
                onCommand(buildClimbCommand(flightId, mapId, fl));
            } else if (toAlt < flight.alt) {
                onCommand(buildDescendCommand(flightId, mapId, fl));
            } else {
                onCommand(buildMaintainCommand(flightId, mapId, fl));
            }
        }
        this.setState({ type: SelectionStatus.FlightId });
    }

    /** */
    handleTurnHeading() {
        this.setState({ type: SelectionStatus.Turn });
    }

    /**
     * 
     * @param node 
     */
    handleTurnHeadingSelect(node: string) {
        this.setState({ node, type: SelectionStatus.TurnCondition });
    }

    get mapId() { return this.props.map ? this.props.map.id : undefined; }
    /**
     * 
     * @param when 
     */
    handleTurnConditionSelect(when?: string) {
        const { flight, node } = this.state;
        const { onCommand } = this.props;
        const mapId = this.mapId;
        if (mapId && onCommand && node && flight) {
            onCommand(
                buildFlyToCommand(flight, mapId, node, when)
            );
        }
        this.setState({ type: SelectionStatus.FlightId });
    }

    /** */
    handleClearToLand() {
        this.setState({ type: SelectionStatus.LandingRunway });
    }

    /**
     * 
     * @param node 
     */
    handleRunwaySelect(node: string) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        const mapId = this.mapId;
        if (onCommand && mapId && flight) {
            onCommand(
                buildLandCommand(flight, mapId, node)
            );
        }
        this.setState({ type: SelectionStatus.FlightId });
    }

    /** */
    handleHold() {
        this.setState({ type: SelectionStatus.HoldingCondition });
    }

    /**
     * 
     * @param when 
     */
    handleHoldConditionSelect(when?: string) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        const mapId = this.mapId;
        if (onCommand && flight && mapId) {
            onCommand(
                buildHoldCommand(flight, mapId, when)
            );
        }
        this.setState({ type: SelectionStatus.FlightId });
    }

    /**
     * 
     */
    render() {
        const { session, map } = this.props;
        const flights = session ? session.flights : undefined;
        const { type, flight, node } = this.state;
        switch (type) {
            case SelectionStatus.Command:
                return (<CommandSelection onAbort={this.handleAbort}
                    onChangeFlightLevel={this.handleChangeFlightLevel}
                    onTurnHeading={this.handleTurnHeading}
                    onClearToLand={this.handleClearToLand}
                    onHold={this.handleHold}
                    flight={flight} />);
            case SelectionStatus.FlightLevel:
                return (<FlightLevelSelection
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleFlightLevelSelect} />);
            case SelectionStatus.TurnCondition:
                return (<ConditionSelection map={map}
                    flight={flight}
                    node={node}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnConditionSelect} />);
            case SelectionStatus.Turn:
                return (<DestinationSelection map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnHeadingSelect} />);
            case SelectionStatus.LandingRunway:
                return (<RunwaySelection map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleRunwaySelect} />);
            case SelectionStatus.HoldingCondition:
                return (<HoldCondition map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleHoldConditionSelect} />);
            default:
                return (<FlightSelection flights={flights} onSelect={this.handleFlightSelection} />);
        }
    }
}
