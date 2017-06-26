// @flow

import type { Store, StoreEnhancer } from 'redux';
import { createStore, applyMiddleware, compose } from 'redux';

import type { SagaMiddleware } from '../types';
import createMiddleware from '../index';

type State = {};

type HiAction = {
  type: 'HI',
};

type ByeAction = {
  type: 'BYE',
};

type Action = HiAction | ByeAction;

describe('middleware', () => {
  let middleware: SagaMiddleware<State, Action>;
  let store: Store<State, Action>;
  const dispatch = jest.fn();

  const debugEnhancer: StoreEnhancer<State, Action> = (createStore) => (...args) => {
    const store: Store<State, Action> = createStore(...args);

    const originalDispatch = store.dispatch;
    store.dispatch = (...args) => {
      dispatch(...args);
      return originalDispatch(...args);
    };

    return store;
  };

  beforeEach(() => {
    middleware = createMiddleware();
    store = createStore(
      () => ({}),
      {},
      compose(
        applyMiddleware(
          (middleware: SagaMiddleware<State, Action>)
        ),
        debugEnhancer
      )
    );
  });

  describe('waiting for actions', () => {
    test('single', async () => {
      const promise = middleware.run(({ take }) => async () => {
        return await take('HI');
      });

      const action = {
        type: 'HI',
      };

      store.dispatch(action);

      expect(await promise).toBe(action);
    });

    test('multiple', async () => {
      const promise = middleware.run(({ take }) => async () => {
        return await take(['HI', 'BYE']);
      });

      const action = {
        type: 'HI',
      };

      store.dispatch(action);

      expect(await promise).toBe(action);
    });

    test('all', async () => {
      const promise = middleware.run(({ take }) => async () => {
        return await take();
      });

      const action = {
        type: 'HI',
      };

      store.dispatch(action);

      expect(await promise).toBe(action);
    });

    test('pattern function', async () => {
      const promise = middleware.run(({ take }) => async () => {
        return await take(() => true);
      });

      const action = {
        type: 'HI',
      };

      store.dispatch(action);

      expect(await promise).toBe(action);
    });
  });

  test('dispatching to the state', async () => {
    dispatch.mockClear();
    const action = {
      type: 'BYE',
    };
    const promise = middleware.run(({ put }) => async () => {
      return await put(action);
    });
    await promise;

    expect(dispatch).toBeCalledWith(action);
  });

  test('canceling of sagas', async () => {
    const subSaga2Canceled = jest.fn();
    const subSaga2 = ({ delay, canceled }) => async () => {
      try {
        await delay(2000);
      } catch (e) {
        subSaga2Canceled(canceled());
      }
    };

    const subSagaCanceled = jest.fn();
    const subSaga = ({ call, canceled }) => async () => {
      const callPromise = call(subSaga2);

      try {
        await callPromise;
      } catch (e) {
        subSagaCanceled(canceled());
      }
    };

    const promise = middleware.run(({ call, cancel }) => async () => {
      const callPromise = call(subSaga);
      cancel(callPromise);
    });
    await promise;

    await new Promise(setImmediate);

    expect(subSagaCanceled).toBeCalledWith(true);
    expect(subSaga2Canceled).toBeCalledWith(true);
  });

  test('canceling of a race', async () => {
    const raceSucceeded = jest.fn();
    const raceCanceled = jest.fn();
    const subSaga = ({ race, canceled }) => async () => {
      try {
        await race([
          new Promise(() => {}),
          new Promise(() => {}),
        ]);
        raceSucceeded();
      } catch (e) {
        raceCanceled(canceled());
      }
    };

    const promise = middleware.run(({ call, cancel }) => async () => {
      const callPromise = call(subSaga);
      cancel(callPromise);
    });
    await promise;

    await new Promise(setImmediate);

    expect(raceCanceled).toBeCalledWith(true);
    expect(raceSucceeded).not.toBeCalled();
  });

  test('canceling of an all', async () => {
    const allSucceeded = jest.fn();
    const allCanceled = jest.fn();
    const subSaga = ({ all, canceled }) => async () => {
      try {
        await all([
          new Promise(() => {}),
          new Promise(() => {}),
        ]);
        allSucceeded();
      } catch (e) {
        allCanceled(canceled());
      }
    };

    const promise = middleware.run(({ call, cancel }) => async () => {
      const callPromise = call(subSaga);
      cancel(callPromise);
    });
    await promise;

    await new Promise(setImmediate);

    expect(allCanceled).toBeCalledWith(true);
    expect(allSucceeded).not.toBeCalled();
  });

  test('canceling of non call promise', async () => {
    const promise = middleware.run(({ cancel }) => async () => {
      cancel(new Promise(() => {}));
    });

    await expect(promise).rejects.toMatchSnapshot();
  });
});
