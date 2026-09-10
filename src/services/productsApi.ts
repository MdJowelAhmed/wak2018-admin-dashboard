import { baseApi } from "./baseApi";

export interface ProductItem {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  header?: string;
  [key: string]: any;
}

export interface ProductsResponse {
  success?: boolean;
  message?: string;
  data?: ProductItem[] | { products?: ProductItem[] };
  [key: string]: any;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<ProductsResponse | ProductItem[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetProductsQuery } = productsApi;
