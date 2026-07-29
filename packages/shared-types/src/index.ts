export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ProductFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sort?: string;
  order?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductQueryFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sort: string;
  order: 1 | -1;
  minPrice?: number;
  maxPrice?: number;
}