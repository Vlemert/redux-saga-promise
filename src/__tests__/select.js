// @flow

import { createStore, applyMiddleware, compose } from 'redux';

import type { SagaMiddleware } from '../types';
import createMiddleware from '../index';

type State = {
  someValue: {
    a: string,
  },
};

type Action = {
  type: 'TEST',
};

describe('middleware', () => {
  let middleware: SagaMiddleware<State, Action>;
  let initialState = {
    someValue: {
      a: 'test',
    },
  };

  beforeEach(() => {
    middleware = createMiddleware();
    createStore(
      state => state,
      initialState,
      compose(
        applyMiddleware(
          (middleware: SagaMiddleware<State, Action>)
        )
      )
    );
  });

  test('selecting from state', async () => {
    const selector = (state: State) => state.someValue;

    const promise = middleware.run(({ select }) => async () => {
      return select(selector);
    });
    const result = await promise;

    expect(result).toBe(initialState.someValue);
    expect(result.a).toBe('test');
  });
});
