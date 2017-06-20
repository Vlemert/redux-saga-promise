// @flow

import type { MiddlewareAPI } from 'redux';

import type { TakePattern } from './types';
import createTake from './utils/take';

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

  const race = (promises) => {
    if (Array.isArray(promises)) {
      return Promise.race(promises);
    }

    const mappedPromises = Object.keys(promises).map(
      promiseKey => new Promise(async (resolve, reject) => {
        let result;
        try {
          result = await promises[promiseKey];
        } catch (e) {
          reject(e);
        }
        resolve({
          [promiseKey]: result,
        });
      })
    );

    return Promise.race(mappedPromises);
  };

  const all = async (promises) => {
    if (Array.isArray(promises)) {
      return Promise.all(promises);
    }

    const promiseKeys = Object.keys(promises);

    const result = await Promise.all(promiseKeys.map(promiseKey => promises[promiseKey]));

    return promiseKeys.reduce((completeResult, promiseKey, index) => ({
      ...completeResult,
      [promiseKey]: result[index],
    }), {});
  };

  const delay = async (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  middleware.run = call;

  return middleware;
}

export default createMiddleware;
