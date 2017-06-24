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

    call = <T>(saga: (helpers: *) => () => T, parentCanceled, ...args): T => {
      const promises = new Map();
      const cancel = (promiseToCancel) => {
        const rej = promises.get(promiseToCancel);

        if (!rej) {
          // do we want to be able to cancel other things as well? (delay, race, etc)
          throw new Error('You can only cancel call promises');
        }

        if (rej) {
          promiseToCancel.catch(() => {/* Prevent unhandled promise rejection */});
          rej('canceled');
        }
      };

      const sagaPromise = saga({
        take,
        put,
        call: (saga: (helpers: *) => () => T, ...args) => {
          let rej;
          const cancelHorses = [new Promise((resolve, reject) => {
            rej = reject;
          })];
          if (parentCanceled) {
            cancelHorses.push(parentCanceled);
          }

          const canceled = Promise.race(cancelHorses);

          const race = Promise.race([
            call(saga, canceled, ...args),
            canceled,
          ]);

          if (rej) {
            promises.set(race, rej);
          }

          return race;
        },
        select,
        race,
        all,
        delay: (time: number) => {
          const horses = [delay(time)];
          if (parentCanceled) {
            horses.push(parentCanceled);
          }
          return Promise.race(horses);
        },
        cancel,
      })(...args);

      return sagaPromise;
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
