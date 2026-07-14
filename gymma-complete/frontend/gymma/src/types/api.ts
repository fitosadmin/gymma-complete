// ===========================================================================
// API contract types — mirror spec §12 exactly.
// Backend should return these shapes so swapping mock -> real fetch is a
// one-line change in src/lib/api.ts (no component edits).
// ===========================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type Paginated<T> = ApiResponse<T[]>;
