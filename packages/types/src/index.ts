export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
