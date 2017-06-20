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

  // test('selecting from state', async () => {
  //   getState.mockClear();
  //
  //   const testState = {};
  //   getState.mockImplementationOnce(() => testState);
  //   const testSelectedState = {};
  //   const selector = jest.fn(() => testSelectedState);
  //
  //   const promise = middleware.run(({ select }) => async () => {
  //     return await select(selector);
  //   });
  //   const result = await promise;
  //
  //   expect(getState).toBeCalled();
  //   expect(selector).toBeCalledWith(testState);
  //   expect(result).toBe(testSelectedState);
  // });
});
