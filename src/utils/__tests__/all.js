// @flow

import all from '../all';

describe('all', () => {
  test('resolves an array of promises', async () => {
    const allPromise = all([
      Promise.resolve('1'),
      Promise.resolve(2),
    ]);

    const allResult = await allPromise;

    expect(allResult).toEqual([
      '1',
      2,
    ]);
  });

  test('resolves a dictionary of promises', async () => {
    const allPromise = all({
      'a': Promise.resolve('1'),
      'b': Promise.resolve(2),
    });

    const allResult = await allPromise;

    expect(allResult).toEqual({
      'a': '1',
      'b': 2,
    });
  });

  test('rejects if any promise rejects', async () => {
    const allPromise = all({
      'a': Promise.resolve('1'),
      'b': Promise.reject('some error'),
    });

    expect(allPromise).rejects.toBe('some error');
  });
});
