/**
 * A domain failure, carried as a value rather than thrown.
 *
 * Handlers return a Go-style `[data, error]` pair, so every failure path is visible
 * in the return type instead of hiding behind a throw. The status code is for the
 * HTTP response line only; it is never part of the response body.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function ok<T>(data: T): [data: T, error: null] {
  return [data, null];
}

export function fail(status: number, message: string): [data: null, error: AppError] {
  return [null, new AppError(status, message)];
}
