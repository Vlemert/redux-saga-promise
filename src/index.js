// @flow

import type { MiddlewareAPI } from 'redux';

import type { TakePattern } from './types';
import createTake from './utils/take';
import race from './utils/race';
import all from './utils/all';
import delay from './utils/delay';

function createMiddleware<S, A: Object>() {
  let connectedStore: MiddlewareAPI<S, A>;

  let takePatterns: Array<TakePattern<A>> = [];

  const middleware = (store: MiddlewareAPI<S, A>) => {
    connectedStore = store;
    return (next: (A) => A) => (action: A): A => {
      let result = next(action);

      takePatterns = takePatterns.reduce((falsePatterns, pattern) => {
        if (pattern.func(action)) {
          pattern.resolve(action);
          return falsePatterns;
        }

        return [
          ...falsePatterns,
          pattern,
        ];
      }, []);

      return result;
    }
  };

  const put = (action) => {
    if (!connectedStore) {
      throw new Error('Attempting to put before connecting middleware');
    }

    connectedStore.dispatch(action);
  };

  const take = createTake(takePatterns);

  const call = <T>(saga: (helpers: *) => () => T, ...args): T => {
    return saga({
      take,
      put,
      call,
      select,
      race,
      all,
      delay,
    })(...args);
  };

  const select = (selector, ...args) => {
    if (!selector) {
      return connectedStore.getState();
    }
    return selector(connectedStore.getState(), ...args);
  };

  middleware.run = call;

  return middleware;
}

export default createMiddleware;
