// @flow

import type { TakePattern } from '../types';
import createTake from './take';

export default <A: Object>() => {
  let takePatterns: Array<TakePattern<A>> = [];

  const take = createTake(takePatterns);

  const actionMiddleware = (next: (A) => A) => (action: A): A => {
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
  };

  return {
    take,
    actionMiddleware,
  }
};
