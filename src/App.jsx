import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './modules/Home';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import SessionPane from './modules/SessionPane';


function App() {
  return (
    <Router basename={process.env.REACT_APP_BASENAME}>
      <div>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/sessions/:id" children={<SessionPane />} >
          </Route>
          <Route path="*">
            <NoMatch />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function NoMatch() {
  return (
    <div>
      No Match
    </div>
  );
}

export default App;
