import React from 'react';
import { Badge, Col, Container, Form, FormControl, Nav, Navbar } from 'react-bootstrap';

function ATCNavBar({ session, muted, onMuted }) {

  const home = process.env.REACT_APP_BASENAME;

  var serviceStatus = undefined;
  if (!session) {
    serviceStatus = (
      <Navbar.Text></Navbar.Text>
    );
  } else {
    const { noFlights, noLandedOk, noLandedKo, noExitKo, noExitOk, noCollision } = session
    serviceStatus = (
      <Container fluid>
        <Col>
          <span><Badge variant="info">Inbound: {noFlights}</Badge></span>
        </Col >
        <Col>
          <span><Badge variant="success">Right land: {noLandedOk}</Badge></span>
        </Col >
        <Col>
          <span><Badge variant="success">Right left: {noExitOk}</Badge></span>
        </Col >
        <Col>
          <span><Badge variant="warning">Wrong land: {noLandedKo}</Badge></span>
        </Col >
        <Col>
          <span><Badge variant="warning">Wrong left: {noExitKo}</Badge></span>
        </Col >
        <Col>
          <span><Badge variant="danger">Collisions: {noCollision}</Badge></span>
        </Col >
        <Col>
          <Form inline className="text-light">
            <FormControl type="checkbox" className="mr-sm-2"
              checked={muted} onClick={onMuted} />Muted
          </Form>
        </Col>
      </Container >
    );
  }
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Navbar.Brand href={home}>
        ATC 0.1.0
        </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Navbar.Text>
        </Navbar.Text >
      </Navbar.Collapse>
      <Nav className="mr-auto">
        {serviceStatus}
      </Nav>
    </Navbar>
  );
}

export default ATCNavBar;
