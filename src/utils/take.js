// @flow

import type { TakePattern, Take } from '../types';

function createTake<Action: Object>(takePatterns: Array<TakePattern<Action>>) {
  const take: Take<Action> = (pattern = '*') => {
    return new Promise(resolve => {
      const patterns = !Array.isArray(pattern) ? [pattern] : [...pattern];

      patterns.forEach(patternToRegister => {
        let func;
        if (patternToRegister === '*') {
          func = () => true;
        } else if (typeof patternToRegister === 'string') {
          func = action => action.type === patternToRegister;
        } else if (typeof patternToRegister === 'function') {
          if (patternToRegister.type) {
            const type = patternToRegister.type;
            func = action => action.type === type;
          } else {
            func = patternToRegister;
          }
        } else {
          throw new Error('bla');
        }

        takePatterns.push({
          func: func,
          resolve,
        });
      });
    });
  };
  return take;
}

export default createTake;
