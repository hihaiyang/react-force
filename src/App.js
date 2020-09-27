import React from 'react';
// import ReactDom from 'react-dom';
import { BrowserRouter as Router, HashRouter, Route, Redirect} from "react-router-dom";
import Menus from './views/Menus';
import CanvasPaper from './views/CanvasPaper';
import ForceList from './views/ForceList';
import Help from './views/Help';
import './App.css';

function App() {
  return (
      <div className="App">
          <HashRouter>
              <Route path='/' render={()=>(<Redirect to='/relationship/list' />)}></Route>
              <Route path='/force' component={CanvasPaper}></Route>
              <Route path='/relationship/list' component={ForceList}></Route>
          </HashRouter>
      </div>
  );
}

export default App;
