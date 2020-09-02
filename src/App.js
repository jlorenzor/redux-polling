import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compose } from 'ramda';
import logo from './logo.svg';
import './App.css';
import {
  fetchUserActon,
  onFetchReportConfig,
  onStopFetch,
  onInitializeReportDataFetch,
} from './store';
import ChainData from './features/ChainData.js/component';

const App = () => {
  const dispatch = useDispatch();
  const reportData = useSelector((x) => x.reportData.data);
  const stopDataFetch = compose(dispatch, onStopFetch);
  const startF = compose(dispatch, onInitializeReportDataFetch);
  const onFetchUser = compose(dispatch, fetchUserActon);
  const fetchConfig = compose(dispatch, onFetchReportConfig);
  useEffect(() => {
    onFetchUser();
    fetchConfig(2);
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <h2>API KEY {process.env.REACT_APP_BLOCKCHAIR_API_URL}</h2>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <div>
        <ChainData
          data={reportData}
          chain="BTC"
          onClick={stopDataFetch}
          onInitFetch={startF}
        />
      </div>
    </div>
  );
};

export default App;
