export type GenericResponse<T> = {
  value: T;
  error: Error | null;
};
