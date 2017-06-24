// @flow

import type { All } from '../types';

const all: All = async (promises) => {
  if (Array.isArray(promises)) {
    return Promise.all(promises);
  }

  const promiseKeys = Object.keys(promises);

  const result = await Promise.all(promiseKeys.map(promiseKey => promises[promiseKey]));

  return promiseKeys.reduce((completeResult, promiseKey, index) => ({
    ...completeResult,
    [promiseKey]: result[index],
  }), {});
};

export default all;
