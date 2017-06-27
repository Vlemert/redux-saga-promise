export default (promise) => {
  let isRejected = false;
  promise.catch(() => {
    isRejected = true;
  });
  return () => {
    return isRejected;
  };
};
