export default (func, canceled) => (...args) => Promise.race([
  func(...args),
  canceled,
]);
