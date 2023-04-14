import { applyMiddleware, compose, createStore } from 'redux';
import reduxThunk from 'redux-thunk';

import rootReducer from './rootReducer';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
  }
}

function configureStore(initialState?: any) {
  const composeEnhancers =
    (process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

  const store = createStore(
    rootReducer,
    initialState,
    composeEnhancers(applyMiddleware(reduxThunk)),
  );

  return store;
}

export const store = configureStore();

export default store;
