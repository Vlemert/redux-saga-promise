// @flow

export default <T>(func: (...args: any) => T, canceled: Promise<>) => (...args: any): Promise<T> => Promise.race([
  func(...args),
  canceled,
]);
