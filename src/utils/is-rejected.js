// @flow

export default (promise: Promise<>) => {
  let isRejected = false;
  promise.catch(() => {
    isRejected = true;
  });
  return () => {
    return isRejected;
  };
};
