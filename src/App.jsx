import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './modules/Home';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import SessionPane from './modules/SessionPane';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AudioTest from './modules/AudioTest';
import VoiceSynth from './modules/VoiceSynth';

function App() {
  return (
    <Router basename=".">
      <div>
        <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar
          pauseOnFocusLoss
          pauseOnHover />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route exact path="/audiotest">
            <AudioTest />
          </Route>
          <Route exact path="/voicesynth">
            <VoiceSynth />
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
