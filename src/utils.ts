export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return value != null && typeof (value as PromiseLike<T>).then === 'function'
}
