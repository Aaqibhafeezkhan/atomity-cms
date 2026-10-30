/** Pagination block the backend returns in `meta` for list endpoints. */
export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

/** Error raised by every api.ts function; `code` mirrors the backend's `errorCode`. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
