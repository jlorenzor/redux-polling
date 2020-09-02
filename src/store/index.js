import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { path } from 'ramda';
import { createSelector } from 'reselect';
import {
  all,
  delay,
  take,
  race,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import axios from 'axios';

const createUrl = (endpoint = '') => (params = '') =>
  `${process.env.REACT_APP_BLOCKCHAIR_API_URL}${endpoint}`.concat(params);

const bitcoinStatsEndpoint = createUrl('bitcoin')();
const API_CALLS = {
  fetchStats: createUrl('stats'),
  fetchBitcoinStats: createUrl('stats/bitcoin'),
  createUrlWithoutParams: (x) => createUrl(`stats/${x}`)(),
};

const getReportConfig = ({ reportConfig }) => reportConfig;
const getReports = ({ reports }) => reports;
const getReportTitle = createSelector(getReportConfig, path(['data']));
const getCurrentReport = (index) => createSelector(getReports, (x) => x[index]);

const head = (arr = []) => {
  const [first, ...rest] = arr;
  return first;
};

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

const fetchUserActon = (user) => ({
  type: FETCH_USER,
  payload: user,
});

const onStopFetch = () => ({ type: STOP_REPORT_DATA_FETCH });

const onFetchReportConfig = (reportId) => ({
  type: FETCH_REPORT_CONFIG,
  payload: reportId,
});

const onInitializeReportDataFetch = () => ({ type: FETCH_REPORT_DATA });

export {
  onFetchReportConfig,
  fetchUserActon,
  onStopFetch,
  onInitializeReportDataFetch,
};

const fetchData = (url) =>
  axios
    .get(url)
    .then((response) => response)
    .catch((err) => err);

const getUser = (id) => localStorage.getItem(id);
const setUser = (id) => localStorage.setItem('id', id);

function* userAuthWatcher() {
  yield call(setUser, 'abc123');
  yield takeLatest(FETCH_USER, userAuthSaga);
}

function* userAuthSaga(name) {
  console.log({ name });
  try {
    const currentUser = yield call(getUser, 'id');
    console.log('user found', { currentUser });
    yield put({ type: FETCH_USER_SUCCESS, payload: currentUser });
  } catch (e) {
    yield put({ type: FETCH_USER_FAILURE, payload: e });
  }
}

const API_URL = 'https://my-json-server.typicode.com/typicode/demo/';
const JSON_API_URL = 'https://jsonplaceholder.typicode.com/todos/';

function* reportConfigSaga(action) {
  try {
    const response = yield call(fetchData, `${JSON_API_URL}`);
    console.log({ reportConfigResponse: response });
    yield put({
      type: FETCH_REPORT_CONFIG_SUCCESS,
      payload: response.data,
    });
    yield put({ type: FETCH_REPORT_DATA });
  } catch (e) {
    yield put({ type: FETCH_REPORT_CONFIG_FAILURE, payload: e });
  }
}
function* reportDataSaga(action) {
  while (true) {
    try {
      console.log(action);
      const currentReport = yield select((x) => x.reportConfig.data);
      console.log({ currentReport });
      const response = yield call(() =>
        axios
          .get(
            `${JSON_API_URL}/${Math.floor(
              Math.random() * currentReport.length - 1
            )}`
          )
          .then((res) => res.data)
      );
      yield put({ type: FETCH_REPORT_DATA_SUCCESS, payload: response });
      yield delay(10000);
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
  user: { loading: false, error: null, data: null },
  reportConfig: { loading: false, error: null, data: null },
  reportData: { loading: false, error: null, data: [] },
  reports: ['bitcoin', 'ethereum', 'bitcoin-cash'],
};

const userAuthenticationReducer = (state = defaultState.user, action = {}) => {
  const { payload, type } = action;
  switch (type) {
    case FETCH_USER:
      return {
        ...state,
        loading: true,
      };
    case FETCH_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        data: payload,
      };
    case FETCH_USER_FAILURE:
      return {
        ...state,
        loading: false,
        error: payload,
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

const reportsReducer = (state = defaultState.reports, action = {}) => {
  const { type } = action;
  switch (type) {
    default:
      return state;
  }
};
const rootReducer = combineReducers({
  user: userAuthenticationReducer,
  reportConfig: reportConfigReducer,
  reportData: reportDataReducer,
  reports: reportsReducer,
});

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  rootReducer,
  defaultState,
  composeEnhancers(applyMiddleware(...[sagaMiddleware]))
);
sagaMiddleware.run(rootSaga);

export default store;
