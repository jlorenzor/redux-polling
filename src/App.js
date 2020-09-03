import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { path } from 'ramda';
import logo from './logo.svg';
import './App.css';
import { createSelector } from 'reselect';
import {
  all,
  delay,
  take,
  race,
  call,
  put,
  select,
  takeLatest,
} from 'redux-saga/effects';
import axios from 'axios';
/**
 *
 *
 */
const JSON_API_URL = 'https://jsonplaceholder.typicode.com/todos/';

const getReportConfig = ({ reportConfig }) => reportConfig;
const getReportConfigData = createSelector(getReportConfig, path(['data']));
const users = [
  {
    id: 'abc123',
    hasAccess: true,
  },
  { id: 'efg456', hasAccess: false },
];

const checkUserId = ({ id }) => (x) => id === x.id;
const checkUserAccess = (user) =>
  !user.hasAccess
    ? { id: user.id, isAuthorized: false }
    : { id: user.id, isAuthorized: true };

const trace = (label) => (val) => {
  console.log(`label::${label}`, val);
  return val;
};
const composeFns = (...fns) => (initial) =>
  fns.reduceRight((val, fn) => fn(val), initial);
const findUser = (user) => (arr = []) => arr.find(checkUserId(user));

const checkUserAuth = (user) =>
  composeFns(checkUserAccess, trace('after checksUserId'), findUser(user));

const getReports = ({ reports }) => reports;
const getReportDataState = ({ reportData }) => reportData;
const getReportData = createSelector(getReportDataState, path(['data']));
const getReportTitle = createSelector(getReportData, path(['title']));
const getFetchCount = createSelector(getReportDataState, path(['fetchCount']));

const actionTypes = {
  FETCH_USER: 'FETCH_USER',
  FETCH_USER_SUCCESS: 'FETCH_USER_SUCCESS',
  FETCH_USER_FAILURE: 'FETCH_USER_FAILURE',
  FETCH_REPORT_CONFIG: 'FETCH_REPORT_CONFIG',
  FETCH_REPORT_CONFIG_SUCCESS: 'FETCH_REPORT_CONFIG_SUCCESS',
  FETCH_REPORT_CONFIG_FAILURE: 'FETCH_REPORT_CONFIG_FAILURE',
  FETCH_REPORT_DATA: 'FETCH_REPORT_DATA',
  FETCH_REPORT_DATA_SUCCESS: 'FETCH_REPORT_DATA_SUCCESS',
  FETCH_REPORT_DATA_FAILURE: 'FETCH_REPORT_DATA_FAILURE',
  STOP_REPORT_DATA_FETCH: 'STOP_REPORT_DATA_FETCH',
};
const {
  FETCH_USER,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILURE,
  FETCH_REPORT_DATA,
  FETCH_REPORT_DATA_FAILURE,
  FETCH_REPORT_DATA_SUCCESS,
  FETCH_REPORT_CONFIG,
  FETCH_REPORT_CONFIG_SUCCESS,
  FETCH_REPORT_CONFIG_FAILURE,
  STOP_REPORT_DATA_FETCH,
} = actionTypes;

const fetchCurrentUserAction = () => ({
  type: FETCH_USER,
});

const fetchUserSuccessAction = (id) => ({
  type: FETCH_USER_SUCCESS,
  payload: { id },
});

const onStopFetch = () => ({ type: STOP_REPORT_DATA_FETCH });

const onFetchReportConfig = (reportId) => ({
  type: FETCH_REPORT_CONFIG,
  payload: reportId,
});

const onFetchReportConfigSuccess = (response) => ({
  type: FETCH_REPORT_CONFIG_SUCCESS,
  payload: response.data,
});

const onFetchReportConfigFailure = (error) => ({
  type: FETCH_REPORT_CONFIG_FAILURE,
  payload: error,
});

const onFetchReportDataSuccess = (response) => ({
  type: FETCH_REPORT_DATA_SUCCESS,
  payload: response.data,
});

const onInitializeReportDataFetch = () => ({ type: FETCH_REPORT_DATA });

export {
  getFetchCount,
  getReportData,
  getReportTitle,
  onFetchReportConfig,
  fetchCurrentUserAction,
  onStopFetch,
  onInitializeReportDataFetch,
};

const fetchData = (url) =>
  axios
    .get(url)
    .then((response) => response)
    .catch((err) => err);

const getUser = (id) => localStorage.getItem(id);

function* userAuthWatcher() {
  yield takeLatest(FETCH_USER, userAuthSaga);
}

function* userAuthSaga() {
  try {
    const currentUser = yield call(getUser, 'id');
    yield put(fetchUserSuccessAction(currentUser));
  } catch (e) {
    yield put({ type: FETCH_USER_FAILURE, payload: e });
  }
}

function* reportConfigSaga() {
  try {
    const response = yield call(fetchData, `${JSON_API_URL}`);
    yield put(onFetchReportConfigSuccess(response));
    yield put(onInitializeReportDataFetch());
  } catch (e) {
    yield put(onFetchReportConfigFailure(e));
  }
}
function* reportDataSaga() {
  while (true) {
    try {
      const currentReportList = yield select(getReportConfigData);
      const response = yield call(
        fetchData,
        `${JSON_API_URL}/${Math.floor(
          Math.random() * currentReportList.length - 1
        )}`
      );
      yield put(onFetchReportDataSuccess(response));
      yield delay(2000);
    } catch (e) {
      yield put({ type: FETCH_REPORT_DATA_FAILURE, payload: e });
      yield put({ type: STOP_REPORT_DATA_FETCH });
    }
  }
}
function* reportConfigWatcher() {
  yield takeLatest(FETCH_REPORT_CONFIG, reportConfigSaga);
}

/**
 * Saga watcher.
 */
function* watchPollSaga() {
  while (true) {
    yield take(FETCH_REPORT_DATA);
    yield race([call(reportDataSaga), take([STOP_REPORT_DATA_FETCH])]);
  }
}

function* rootSaga() {
  yield all([
    call(userAuthWatcher),
    call(reportConfigWatcher),
    call(watchPollSaga),
  ]);
}

const defaultState = {
  userState: {
    currentUser: {
      loading: false,
      error: null,
      id: null,
      isAuthorized: false,
    },
    allUsers: users,
  },
  reportConfig: { loading: false, error: null, data: null },
  reportData: { loading: false, error: null, data: [], fetchCount: 0 },
};

const userAuthenticationReducer = (
  state = defaultState.userState,
  action = {}
) => {
  const { payload, type } = action;
  console.log({ userState: state });
  switch (type) {
    case FETCH_USER:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          loading: true,
        },
      };
    case FETCH_USER_SUCCESS:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          loading: false,
          ...checkUserAuth(payload)(state.allUsers),
        },
      };
    case FETCH_USER_FAILURE:
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          loading: false,
          error: payload,
        },
      };
    default:
      return state;
  }
};

const reportDataReducer = (state = defaultState.reportData, action = {}) => {
  const { payload, type } = action;
  switch (type) {
    case FETCH_REPORT_DATA:
      return {
        ...state,
        loading: true,
      };
    case FETCH_REPORT_DATA_SUCCESS:
      return {
        ...state,
        loading: false,
        data: payload,
        fetchCount: state.fetchCount + 1,
      };
    case FETCH_REPORT_DATA_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    default:
      return state;
  }
};

const reportConfigReducer = (
  state = defaultState.reportConfig,
  action = {}
) => {
  const { payload, type } = action;
  switch (type) {
    case FETCH_REPORT_CONFIG:
      return {
        ...state,
        loading: true,
      };
    case FETCH_REPORT_CONFIG_SUCCESS:
      return {
        ...state,
        loading: false,
        data: payload,
      };
    case FETCH_REPORT_CONFIG_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  userState: userAuthenticationReducer,
  reportConfig: reportConfigReducer,
  reportData: reportDataReducer,
});

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  rootReducer,
  defaultState,
  composeEnhancers(applyMiddleware(...[sagaMiddleware]))
);
sagaMiddleware.run(rootSaga);

/**
 *
 * Component Code
 */
const Todo = ({ userId, title, completed, id }) => (
  <div>
    <h5>to-do id: {id}</h5>
    <h3>To-do Item Text: {title}</h3>
    <h4>Created by user: {userId}</h4>
    <h4>Status: {completed ? 'Complete' : 'Pending'}</h4>
  </div>
);

const useActionCreators = (fns = []) => {
  const dispatch = useDispatch();
  const actionCreators = fns.map((fn) => compose(dispatch, fn));
  return [actionCreators];
};

const App = () => {
  const counter = useSelector(getFetchCount);
  const [actionCreators] = useActionCreators([
    onStopFetch,
    onInitializeReportDataFetch,
    fetchCurrentUserAction,
    onFetchReportConfig,
  ]);
  console.log({ actionCreators });
  const [stopFetch, startFetch, fetchUser, fetchConfig] = actionCreators;
  console.log({ fetchUser, stopFetch, startFetch });

  useEffect(() => {
    fetchUser();
    fetchConfig();
  }, []);
  const data = useSelector((x) => getReportData(x));

  return (
    <div className="App">
      <h2>Random Todo Iterator</h2>
      <div>{data ? <Todo {...data} /> : null}</div>
      <button onClick={stopFetch}>Stop Data Fetch</button>
      <button onClick={startFetch}>Start Fetch</button>
      <p>Fetch Count: {counter}</p>
    </div>
  );
};

export default App;
