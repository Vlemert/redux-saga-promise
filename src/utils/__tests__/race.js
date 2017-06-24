// @flow

import race from '../race';

describe('race', () => {
  test('resolves with the winning result in an array of promises', async () => {
    const racePromise = race([
      Promise.resolve('1'),
      new Promise(() => {}),
    ]);

    const raceResult = await racePromise;

    expect(raceResult).toEqual('1');
  });

  test('resolves a dictionary of promises with only the winning result set', async () => {
    const racePromise = race({
      'a': Promise.resolve('1'),
      'b': new Promise(() => {}),
    });

    const raceResult = await racePromise;

    expect(raceResult).toEqual({
      'a': '1',
    });
  });
});
