import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Jumbotron, Nav, Navbar } from 'react-bootstrap';

function App() {
  return (
    <Container fluid>
      <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          React Bootstrap
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Container>
        <Jumbotron>
          <h1>ATC</h1>
        </Jumbotron>
      </Container>
    </Container>
  );
}

export default App;
