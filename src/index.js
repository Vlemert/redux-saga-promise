// @flow

import type { MiddlewareAPI } from 'redux';

import race from './utils/race';
import all from './utils/all';
import delay from './utils/delay';
import isRejected from './utils/is-rejected';
import cancelable from './utils/cancelable';
import createTakeAndActionMiddleware from './utils/create-take-and-action-middleware';

const voidPromise = new Promise(() => {});

const createSagaRunner = (take, put, select) => {
  const runSaga = <T>(saga: (helpers: *) => () => T, canceledFromParent = voidPromise, ...args): T => {
    const { call, cancel } = createCallAndCancel(canceledFromParent);

    return saga({
      take,
      put,
      select,
      call,
      cancel,
      race: cancelable(race, canceledFromParent),
      all: cancelable(all, canceledFromParent),
      delay: cancelable(delay, canceledFromParent),
      canceled: isRejected(canceledFromParent),
    })(...args);
  };

  const createCallAndCancel = (canceledFromParent) => {
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
        runSaga(saga, canceled, ...args),
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

  return <T>(saga: (helpers: *) => () => T) => runSaga(saga);
};

function createMiddleware<S, A: Object>() {
  let run;

  const middleware = (store: MiddlewareAPI<S, A>) => {
    const put = store.dispatch;

    const select = (selector, ...args) => {
      if (!selector) {
        return store.getState();
      }
      return selector(store.getState(), ...args);
    };

    const { take, actionMiddleware } = createTakeAndActionMiddleware();

    run = createSagaRunner(take, put, select);

    return actionMiddleware;
  };

  middleware.run = <T>(saga: (helpers: *) => () => T) => {
    if (run) {
      return run(saga);
    }

    throw new Error('Cannot run sagas before connecting the middleware to a store');
  };

  return middleware;
}

export default createMiddleware;
