import React from 'react';
import { Nav, Navbar } from 'react-bootstrap';

function ATCNavBar() {

  const home = process.env.REACT_APP_BASENAME;
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Navbar.Brand href={home}>
        ATC
        </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default ATCNavBar;
