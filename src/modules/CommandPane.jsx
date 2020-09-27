import React, { Component } from 'react';
import { Button, ButtonGroup, Card } from 'react-bootstrap';
import _ from 'lodash';

const FlightSelectionStatus = "flightSelection";
const CommandSelectionStatus = "commandSelection";
const FlightLevelSelectionStatus = "flightLevelSelection";
const TurnSelectionStatus = "turnToSelection";
const TurnConditionSelectionStatus = "turnToConditionSelection";
const LandingRunwaySelectionStatus = "landingRunwaySelection";
const HoldingConditionSelectionStatus = "holdingConditionSelection";

const FlightLveles = ['040', '080', '120', '160', '200', '240', '280', '320', '360'];

function CommandSelection({ onAbort, onChangeFlightLevel, onTurnHeading, onClearToLand, onHold }) {
    return (
        <Card bg="dark" text="white">
            <Card.Header>Select the command</Card.Header>
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
                        onClick={() => { if (!!onHold) { onHold() } }}>Hold in cirlce</Button>
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
                                    onClick={() => { if (!!onSelect) { onSelect(flight) } }
                                    }> Flight { flight.id}</Button>
                            );
                        })
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function RunwaySelection({ map, onAbort, onSelect }) {
    const nodes = _(map.nodes).filter({ type: 'runway' }).sortBy('id');

    return (
        <Card bg="dark" text="white">
            <Card.Header>Select destination</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button
                        onClick={() => { if (!!onAbort) { onAbort() } }}
                        variant="warning">Abort</Button>
                    {nodes.map(node => {
                        return (
                            <Button key={node.id}
                                onClick={() => { if (!!onSelect) { onSelect(node) } }}
                                variant="secondary" >{node.id}</Button>
                        );
                    }).value()
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function DestinationSelection({ map, onAbort, onSelect }) {
    const nodes = _(map.nodes).sortBy('id');

    return (
        <Card bg="dark" text="white">
            <Card.Header>Select destination</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button
                        onClick={() => { if (!!onAbort) { onAbort() } }}
                        variant="warning">Abort</Button>
                    {nodes.map(node => {
                        return (
                            <Button key={node.id}
                                onClick={() => { if (!!onSelect) { onSelect(node) } }}
                                variant="secondary" >{node.id}</Button>
                        );
                    }).value()
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function ConditionSelection({ map, onAbort, onSelect }) {
    const nodes = _(map.nodes).filter(node => node.type !== 'runway').sortBy('id');

    return (
        <Card bg="dark" text="white">
            <Card.Header>Select destination</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button
                        onClick={() => { if (!!onAbort) { onAbort() } }}
                        variant="warning">Abort</Button>
                    <Button
                        onClick={() => { if (!!onSelect) { onSelect('immediate') } }}
                        variant="primary">Immediate</Button>
                    {nodes.map(node => {
                        return (
                            <Button key={node.id}
                                onClick={() => { if (!!onSelect) { onSelect(node) } }}
                                variant="secondary" >{node.id}</Button>
                        );
                    }).value()
                    }
                </ButtonGroup>
            </Card.Body>
        </Card >
    );
}

function FlightLevelSelection({ onAbort, onSelect }) {

    return (
        <Card bg="dark" text="white">
            <Card.Header>Select flight level</Card.Header>
            <Card.Body>
                <ButtonGroup vertical>
                    <Button variant="warning"
                        onClick={() => { if (!!onAbort) { onAbort() } }}>Abort</Button>
                    {
                        _(FlightLveles).map(fl => {
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
        const cmd = {
            flight, type: 'ChangeLevel',
            flightLevel: fl
        };
        if (!!onCommand) {
            onCommand(cmd);
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
        const cmd = { flight, type: 'TurnHeading', node, when };
        if (!!onCommand) {
            onCommand(cmd);
        }
        this.setState({ type: FlightSelectionStatus });
    }

    handleClearToLand() {
        this.setState({ type: LandingRunwaySelectionStatus });
    }

    handleRunwaySelect(node) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        const cmd = { flight, type: 'ClearToLand', node };
        if (!!onCommand) {
            onCommand(cmd);
        }
        this.setState({ type: FlightSelectionStatus });
    }

    handleHold() {
        this.setState({ type: HoldingConditionSelectionStatus });
    }

    handleHoldConditionSelect(when) {
        const { flight } = this.state;
        const { onCommand } = this.props;
        const cmd = { flight, type: 'Hold', when };
        if (!!onCommand) {
            onCommand(cmd);
        }
        this.setState({ type: FlightSelectionStatus });
    }

    render() {
        const { session, map } = this.props;
        const { flights } = session;
        const { type } = this.state;
        switch (type) {
            case CommandSelectionStatus:
                return (<CommandSelection onAbort={this.handleAbort}
                    onChangeFlightLevel={this.handleChangeFlightLevel}
                    onTurnHeading={this.handleTurnHeading}
                    onClearToLand={this.handleClearToLand}
                    onHold={this.handleHold} />);
            case FlightLevelSelectionStatus:
                return (<FlightLevelSelection
                    onAbort={this.handleAbort}
                    onSelect={this.handleFlightLevelSelect} />);
            case TurnConditionSelectionStatus:
                return (<ConditionSelection map={map}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnConditionSelect} />);
            case TurnSelectionStatus:
                return (<DestinationSelection map={map}
                    onAbort={this.handleAbort}
                    onSelect={this.handleTurnHeadingSelect} />);
            case LandingRunwaySelectionStatus:
                return (<RunwaySelection map={map}
                    onAbort={this.handleAbort}
                    onSelect={this.handleRunwaySelect} />);
            case HoldingConditionSelectionStatus:
                return (<ConditionSelection map={map}
                    onAbort={this.handleAbort}
                    onSelect={this.handleHoldConditionSelect} />);
            default:
                return (<FlightSelection flights={flights} onSelect={this.handleFlightSelection} />);
        }
    }
}

export default CommandPane;
