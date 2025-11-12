const DEFAULT_API_URL = "http://localhost:3001/api";

export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
