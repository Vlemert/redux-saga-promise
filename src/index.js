// @flow

import type { MiddlewareAPI } from 'redux';

import type { TakePattern } from './types';
import createTake from './utils/take';
import race from './utils/race';
import all from './utils/all';
import delay from './utils/delay';

function createMiddleware<S, A: Object>() {
  let call;

  const middleware = (store: MiddlewareAPI<S, A>) => {
    let takePatterns: Array<TakePattern<A>> = [];

    const put = (action) => {
      store.dispatch(action);
    };

    const take = createTake(takePatterns);

    call = <T>(saga: (helpers: *) => () => T, ...args): T => {
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
        return store.getState();
      }
      return selector(store.getState(), ...args);
    };

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

  middleware.run = (...args) => {
    if (call) {
      return call(...args);
    }

    throw new Error('Cannot run sagas before connecting the middleware to a store');
  };

  return middleware;
}

export default createMiddleware;
