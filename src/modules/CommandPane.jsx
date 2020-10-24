import React, { Component } from 'react';
import { Button, ButtonGroup, Card, Col, Container, Row } from 'react-bootstrap';
import _ from 'lodash';
import { COMMAND_TYPES } from './TrafficSimulator';

const FlightSelectionStatus = "flightSelection";
const CommandSelectionStatus = "commandSelection";
const FlightLevelSelectionStatus = "flightLevelSelection";
const TurnSelectionStatus = "turnToSelection";
const TurnConditionSelectionStatus = "turnToConditionSelection";
const LandingRunwaySelectionStatus = "landingRunwaySelection";
const HoldingConditionSelectionStatus = "holdingConditionSelection";

const FlightLveles = ['040', '080', '120', '160', '200', '240', '280', '320', '360'];

function CommandSelection({ flight, onAbort, onChangeFlightLevel, onTurnHeading, onClearToLand, onHold }) {
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
                        onClick={() => { if (!!onTurnHeading) { onTurnHeading() } }}>Turn heading</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onClearToLand) { onClearToLand() } }}>Clear to land</Button>
                    <Button variant="secondary"
                        onClick={() => { if (!!onHold) { onHold() } }}>Hold</Button>
                </ButtonGroup>
            </Card.Body>
        </Card>
    );
}

function FlightSelection({ flights, onSelect }) {

    return (
        <Card bg="dark" text="white">
            <Card.Header>Select flight</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    {
                        _.map(flights, flight => {
                            return (
                                <Button key={flight.id} variant="secondary"
                                    onClick={() => { if (!!onSelect) { onSelect(flight.id) } }
                                    }>{flight.id}</Button>
                            );
                        })
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function RunwaySelection({ flight, map, onAbort, onSelect }) {
    const nodes = _(map.nodes).filter({ type: 'runway' }).sortBy('id');

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
                    {nodes.map(node => {
                        return (
                            <Button key={node.id}
                                onClick={() => { if (!!onSelect) { onSelect(node.id) } }}
                                variant="secondary" >{node.id}</Button>
                        );
                    }).value()
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function DestinationSelection({ flight, map, onAbort, onSelect }) {
    const nodes = _(map.nodes).sortBy('id');
    const numCol1 = Math.ceil((nodes.size() + 1) / 2) - 1;
    const nodes1 = nodes.take(numCol1);
    const nodes2 = nodes.drop(numCol1);

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
                                {nodes1.map(node => {
                                    return (
                                        <Button key={node.id}
                                            onClick={() => { if (!!onSelect) { onSelect(node.id) } }}
                                            variant="secondary" >{node.id}</Button>
                                    );
                                }).value()
                                }
                            </ButtonGroup>
                        </Col>
                        <Col>
                            <ButtonGroup vertical>
                                {nodes2.map(node => {
                                    return (
                                        <Button key={node.id}
                                            onClick={() => { if (!!onSelect) { onSelect(node.id) } }}
                                            variant="secondary" >{node.id}</Button>
                                    );
                                }).value()
                                }
                            </ButtonGroup>
                        </Col>
                    </Row>
                </Container>
            </Card.Body >
        </Card >
    );
}

function ConditionButtons({ map, onAbort, onSelect }) {
    const nodes = _(map.nodes).filter(node => node.type !== 'runway').sortBy('id');

    const numCol1 = Math.ceil((nodes.size() + 2) / 2) - 2;
    const nodes1 = nodes.take(numCol1);
    const nodes2 = nodes.drop(numCol1);

    return (
        <Container fluid>
            <Row>
                <Col>
                    <ButtonGroup vertical>
                        <Button
                            onClick={() => { if (!!onAbort) { onAbort() } }}
                            variant="warning">Abort</Button>
                        <Button
                            onClick={() => { if (!!onSelect) { onSelect('immediate') } }}
                            variant="primary">Now</Button>
                        {nodes1.map(node => {
                            return (
                                <Button key={node.id}
                                    onClick={() => { if (!!onSelect) { onSelect(node.id) } }}
                                    variant="secondary" >{node.id}</Button>
                            );
                        }).value()
                        }
                    </ButtonGroup>
                </Col>
                <Col>
                    <ButtonGroup vertical>
                        {nodes2.map(node => {
                            return (
                                <Button key={node.id}
                                    onClick={() => { if (!!onSelect) { onSelect(node.id) } }}
                                    variant="secondary" >{node.id}</Button>
                            );
                        }).value()
                        }
                    </ButtonGroup>
                </Col>
            </Row>
        </Container>
    );
}

function ConditionSelection({ flight, node, map, onAbort, onSelect }) {
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

function HoldCondition({ flight, map, onAbort, onSelect }) {
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

function FlightLevelSelection({ flight, onAbort, onSelect }) {

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
                    {
                        _(FlightLveles).orderBy(_.identity, 'desc').map(fl => {
                            return (
                                <Button key={fl} variant="secondary"
                                    className={`fl-${fl}`}
                                    onClick={() => { if (!!onSelect) { onSelect(fl) } }}> FL {fl}</Button>
                            );
                        }).value()
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

class CommandPane extends Component {

    constructor(props) {
        super(props);
        this.state = { type: FlightSelectionStatus };
        this.handleFlightSelection = this.handleFlightSelection.bind(this);
        this.handleAbort = this.handleAbort.bind(this);
        this.handleChangeFlightLevel = this.handleChangeFlightLevel.bind(this);
        this.handleFlightLevelSelect = this.handleFlightLevelSelect.bind(this);
        this.handleTurnHeading = this.handleTurnHeading.bind(this);
        this.handleTurnHeadingSelect = this.handleTurnHeadingSelect.bind(this);
        this.handleTurnConditionSelect = this.handleTurnConditionSelect.bind(this);
        this.handleClearToLand = this.handleClearToLand.bind(this);
        this.handleRunwaySelect = this.handleRunwaySelect.bind(this);
        this.handleHold = this.handleHold.bind(this);
        this.handleHoldConditionSelect = this.handleHoldConditionSelect.bind(this);
    }

    handleFlightSelection(flight) {
        this.setState({ flight, type: CommandSelectionStatus });
    }

    handleAbort() {
        this.setState({ type: FlightSelectionStatus });
    }

    handleChangeFlightLevel() {
        this.setState({ type: FlightLevelSelectionStatus });
    }

    handleFlightLevelSelect(fl) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        if (!!onCommand) {
            onCommand({
                flight,
                type: COMMAND_TYPES.CHANGE_LEVEL,
                flightLevel: fl
            });
        }
        this.setState({ type: FlightSelectionStatus });
    }

    handleTurnHeading() {
        this.setState({ type: TurnSelectionStatus });
    }

    handleTurnHeadingSelect(node) {
        this.setState({ node, type: TurnConditionSelectionStatus });
    }

    handleTurnConditionSelect(when) {
        const { flight, node } = this.state;
        const { onCommand } = this.props;
        if (!!onCommand) {
            onCommand({
                flight,
                type: COMMAND_TYPES.TURN_HEADING,
                to: node,
                when
            });
        }
        this.setState({ type: FlightSelectionStatus });
    }

    handleClearToLand() {
        this.setState({ type: LandingRunwaySelectionStatus });
    }

    handleRunwaySelect(node) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        if (!!onCommand) {
            onCommand({
                flight,
                type: COMMAND_TYPES.CLEAR_TO_LAND,
                to: node
            });
        }
        this.setState({ type: FlightSelectionStatus });
    }

    handleHold() {
        this.setState({ type: HoldingConditionSelectionStatus });
    }

    handleHoldConditionSelect(when) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        if (!!onCommand) {
            onCommand({
                flight,
                type: COMMAND_TYPES.HOLD,
                when
            });
        }
        this.setState({ type: FlightSelectionStatus });
    }

    render() {
        const { session, map } = this.props;
        const { flights } = session;
        const { type, flight, node } = this.state;
        switch (type) {
            case CommandSelectionStatus:
                return (<CommandSelection onAbort={this.handleAbort}
                    onChangeFlightLevel={this.handleChangeFlightLevel}
                    onTurnHeading={this.handleTurnHeading}
                    onClearToLand={this.handleClearToLand}
                    onHold={this.handleHold}
                    flight={flight} />);
            case FlightLevelSelectionStatus:
                return (<FlightLevelSelection
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleFlightLevelSelect} />);
            case TurnConditionSelectionStatus:
                return (<ConditionSelection map={map}
                    flight={flight}
                    node={node}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnConditionSelect} />);
            case TurnSelectionStatus:
                return (<DestinationSelection map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnHeadingSelect} />);
            case LandingRunwaySelectionStatus:
                return (<RunwaySelection map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleRunwaySelect} />);
            case HoldingConditionSelectionStatus:
                return (<HoldCondition map={map}
                    flight={flight}
                    onAbort={this.handleAbort}
                    onSelect={this.handleHoldConditionSelect} />);
            default:
                return (<FlightSelection flights={flights} onSelect={this.handleFlightSelection} />);
        }
    }
}

export default CommandPane;
