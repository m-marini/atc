import React from 'react';
import { Badge, Col, Container, Nav, Navbar } from 'react-bootstrap';
import { sprintf } from 'sprintf-js';

function ATCNavBar({ session }) {

  const home = process.env.REACT_APP_BASENAME;

  var serviceStatus = undefined;
  if (!session) {
    serviceStatus = (
      <Navbar.Text></Navbar.Text>
    );
  } else {
    const { noFlights, noLandedOk, noLandedKo, noExitKo, noExitOk, noCollision, t } = session
    const successRate = !!t ? (noLandedOk + noExitOk) * 3600 / t : 0;
    const wrongRate = !!noFlights ? (noExitKo + noLandedKo) / noFlights * 100 : 0;
    const collisionRate = !!noFlights ? noCollision / noFlights * 100 : 0;

    serviceStatus = (
      <Container fluid>
        <Col>
          <span>
            <Badge variant="info" pill>Inbound: {sprintf('%d', noFlights)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="success" pill>Success: {sprintf('%.1f fph', successRate)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="warning" pill>Wrong: {sprintf('%.0f%%', wrongRate)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="danger" pill>Collision: {sprintf('%.0f%%', collisionRate)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="success">Right landed: {sprintf('%d', noLandedOk)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="success">Right left: {sprintf('%d', noExitOk)}</Badge>
          </span>
        </Col >
        <Col>
          <span>
            <Badge variant="warning">Wrong landed: {sprintf('%d', noLandedKo)}</Badge>
          </span>
        </Col >
        <Col>
          <span><Badge variant="warning">Wrong left: {sprintf('%d', noExitKo)}</Badge></span>
        </Col>
        <Col>
          <span>
            <Badge variant="danger">Collisions: {sprintf('%d', noCollision)}</Badge>
          </span>
        </Col >
      </Container >
    );
  }
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Navbar.Brand href="http://www.mmarini.org">www.mmarini.org</Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href={home}>ATC {process.env.REACT_APP_VERSION}</Nav.Link>
        </Nav>
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
