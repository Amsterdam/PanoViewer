
import { createStore, combineReducers, applyMiddleware } from 'redux'

import reducer from '../panorama/ducks/reducer'
import middleware from './middleware.js'

export default createStore(
  combineReducers({
    panorama: reducer
  }),
  applyMiddleware(...middleware)
)
