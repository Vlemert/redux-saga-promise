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
  delay: (number) => Promise<void>,
  cancel: (promise: Promise<any>) => void,
  canceled: () => boolean,
  race: Race,
  all: All,
};

export interface SagaMiddleware<S, A> {
  (store: MiddlewareAPI<S, A>): (next: (A) => A) => (A) => A;
  run: <T>((helpers: SagaHelpers<A>) => () => T) => T;
}

export type $awaitmaybe = <T>(Promise<T>) => T | typeof undefined;

export interface Race {
  <T, Elem: Promise<T> | T>(Array<Elem>): Promise<T>;
  <P, T: { [string]: Promise<P> }>(T): Promise<$ObjMap<T, $awaitmaybe>>;
}

export interface All {
  <Elem, T:Iterable<Elem>>(T): Promise<$TupleMap<T, typeof $await>>;
  <P, T: { [string]: Promise<P> }>(T): Promise<$ObjMap<T, typeof $await>>;
}
