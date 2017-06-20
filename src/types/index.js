// @flow

import type { MiddlewareAPI } from 'redux';

export type PatternMatch<A> = (A) => boolean;

export type ActionCreator<A> = {
  (): A,
  type: $PropertyType<A, 'type'>,
}

export type TakePattern<A> = {
  func: PatternMatch<A>,
  resolve: (A) => void,
};

export type Take<A> = {
  (?string | Array<string> | PatternMatch<A>): Promise<A>,
  <B: A>(ActionCreator<B>): Promise<B>,
};

export type SagaHelpers<A> = {
  take: Take<A>,
  call: <T>((helpers: SagaHelpers<A>) => () => T) => T,
  put: (A) => void,
};

export interface SagaMiddleware<S, A> {
  (store: MiddlewareAPI<S, A>): (next: (A) => A) => (A) => A;
  run: <T>((helpers: SagaHelpers<A>) => () => T) => T;
}
