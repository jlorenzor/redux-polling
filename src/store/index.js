import { compose, createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { path } from 'ramda';
import { createSelector } from 'reselect';
import API_CALLS, { bitcoinStatsEndpoint } from '../API/blockchair';
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

const getReportConfig = ({ reportConfig }) => reportConfig;
const getReportTitle = createSelector(getReportConfig, path(['data', 'title']));

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

function* userAuthWatcher() {
  yield takeLatest(FETCH_USER, userAuthSaga);
}

function* userAuthSaga(name) {
  console.log({ name });
  try {
    const currentUser = yield call(getUser, 'id');
    console.log('user found', { currentUser });
    const response = yield call(fetchData, `/user?id=${currentUser}`);
    yield put({ type: FETCH_USER_SUCCESS, payload: head(response.data) });
  } catch (e) {
    yield put({ type: FETCH_USER_FAILURE, payload: e });
  }
}

function* reportConfigSaga(action) {
  try {
    const response = yield call(fetchData, `/reports?id=${action.payload}`);
    console.log({ reportConfigResponse: response });
    yield put({
      type: FETCH_REPORT_CONFIG_SUCCESS,
      payload: head(response.data),
    });
    yield put({ type: FETCH_REPORT_DATA });
  } catch (e) {
    yield put({ type: FETCH_REPORT_CONFIG_FAILURE, payload: e });
  }
}

function* reportDataSaga() {
  while (true) {
    try {
      const reportTitle = yield select(getReportTitle);
      console.log({ reportTitle });
      const response = yield call(() =>
        axios
          .get(`https://api.blockchair.com/${reportTitle}`)
          .then((res) => res.data)
      );
      console.log({ blockchairDataResponse: response });
      yield put({ type: FETCH_REPORT_DATA_SUCCESS, payload: response.data });
      yield delay(10000);
    } catch (e) {
      yield put({ type: FETCH_REPORT_DATA_FAILURE, payload: e });
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
    yield race([call(reportDataSaga), take(STOP_REPORT_DATA_FETCH)]);
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

const rootReducer = combineReducers({
  user: userAuthenticationReducer,
  reportConfig: reportConfigReducer,
  reportData: reportDataReducer,
});

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(...[sagaMiddleware]))
);
sagaMiddleware.run(rootSaga);

export default store;
