// @flow

import type { Race } from '../types';

const race: Race = (promises) => {
  if (Array.isArray(promises)) {
    return Promise.race(promises);
  }

  const mappedPromises = Object.keys(promises).map(
    promiseKey => new Promise(async (resolve, reject) => {
      let result;
      try {
        result = await promises[promiseKey];
      } catch (e) {
        reject(e);
      }
      resolve({
        [promiseKey]: result,
      });
    })
  );

  return Promise.race(mappedPromises);
};

export default race;
