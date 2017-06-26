// @flow

import type { MiddlewareAPI } from 'redux';

import type { TakePattern } from './types';
import createTake from './utils/take';
import race from './utils/race';
import all from './utils/all';
import delay from './utils/delay';

const voidPromise = new Promise(() => {});

const cancelable = (func, canceled) => (...args) => Promise.race([
  func(...args),
  canceled,
]);

const createCanceled = (canceled) => {
  let isCanceled = false;
  canceled.catch(() => {
    isCanceled = true;
  });
  return () => {
    return isCanceled;
  };
};

const createCallAndCancel = (innerCall, canceledFromParent) => {
  const sagaPromises = new Map();

  const call = <T>(saga: (helpers: *) => () => T, ...args) => {
    let rej;
    const canceled = Promise.race([
      new Promise((resolve, reject) => {
        rej = reject;
      }),
      canceledFromParent,
    ]);

    const race = Promise.race([
      innerCall(saga, canceled, ...args),
      canceled,
    ]);

    if (rej) {
      sagaPromises.set(race, rej);
    }

    return race;
  };

  const cancel = (sagaPromise) => {
    const cancelSaga = sagaPromises.get(sagaPromise);

    if (!cancelSaga) {
      // do we want to be able to cancel other things as well? (delay, race, etc)
      throw new Error('You can only cancel call promises');
    }

    sagaPromise.catch(() => {/* Prevent unhandled promise rejection */});
    cancelSaga('canceled');
  };

  return {
    call,
    cancel,
  }
};

function createMiddleware<S, A: Object>() {
  let innerCall;

  const middleware = (store: MiddlewareAPI<S, A>) => {
    let takePatterns: Array<TakePattern<A>> = [];

    const put = (action) => {
      store.dispatch(action);
    };

    const take = createTake(takePatterns);

    innerCall = <T>(saga: (helpers: *) => () => T, canceledFromParent = voidPromise, ...args): T => {
      const { call, cancel } = createCallAndCancel(innerCall, canceledFromParent);

      return saga({
        take,
        put,
        select,
        call,
        cancel,
        race: cancelable(race, canceledFromParent),
        all: cancelable(all, canceledFromParent),
        delay: cancelable(delay, canceledFromParent),
        canceled: createCanceled(canceledFromParent),
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
    if (innerCall) {
      return innerCall(...args);
    }

    throw new Error('Cannot run sagas before connecting the middleware to a store');
  };

  return middleware;
}

export default createMiddleware;
