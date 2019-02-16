import { all, fork } from 'redux-saga/effects';
import { watchClosePanorama, watchFetchPanorama } from '../panorama/sagas/panorama';

export default function* rootSaga() {
  yield all([
    fork(watchFetchPanorama),
    fork(watchClosePanorama)
  ]);
}
