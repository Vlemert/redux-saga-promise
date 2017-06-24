// @flow

import delay from '../delay';

jest.useFakeTimers();

describe('delay', () => {
  test('returns a promise that resolves after a specific time', async () => {
    const resolvedTimers = [];

    const setDelay = (time: number) => delay(time).then(() => resolvedTimers.push(time));

    setDelay(1000);
    setDelay(2000);
    setDelay(3000);
    setDelay(3001);
    setDelay(3001);

    const moveTime = (time: number) => {
      jest.runTimersToTime(time);

      return new Promise(resolve => setImmediate(resolve));
    };

    await moveTime(1000);
    expect(resolvedTimers).toMatchSnapshot();

    await moveTime(1000);
    expect(resolvedTimers).toMatchSnapshot();

    await moveTime(500);
    expect(resolvedTimers).toMatchSnapshot();

    await moveTime(499);
    expect(resolvedTimers).toMatchSnapshot();

    await moveTime(1);
    expect(resolvedTimers).toMatchSnapshot();

    await moveTime(1);
    expect(resolvedTimers).toMatchSnapshot();
  });
});
