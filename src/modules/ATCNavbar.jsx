import React from 'react';
import { Badge, Col, Container, Nav, Navbar } from 'react-bootstrap';

function ATCNavBar({ session }) {

  const home = process.env.REACT_APP_BASENAME;

  var serviceStatus = undefined;
  if (!session) {
    serviceStatus = (
      <Navbar.Text></Navbar.Text>
    );
  } else {
    const { noFlights, noLandedOk, noLandedKo, noExitKo, noExitOk, noCollision } = session
    serviceStatus = (
      <Navbar.Text>
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
        </Container >
      </Navbar.Text >
    );
  }
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Navbar.Brand href={home}>
        ATC 0.1.0
        </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto"></Nav>
      </Navbar.Collapse>
      {serviceStatus}
    </Navbar>
  );
}

export default ATCNavBar;
