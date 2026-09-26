import { baseApi } from "./baseApi";
import type {
  ProductOrdersResponse,
  ProductUpdatableStatus,
  ServiceOrdersResponse,
  ServiceUpdatableStatus,
  SingleProductOrderResponse,
  SingleServiceOrderResponse,
} from "@/types/order";

export interface OrdersQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  payment?: string;
  status?: string;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProductOrders: build.query<
      ProductOrdersResponse,
      OrdersQueryParams | void
    >({
      query: (params) => {
        if (!params) return "/admin-dashboard/orders/products";
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.searchTerm)
          queryParams.append("searchTerm", params.searchTerm);
        if (params.payment && params.payment !== "all")
          queryParams.append("payment", params.payment);
        if (params.status && params.status !== "all")
          queryParams.append("status", params.status);
        return `/admin-dashboard/orders/products?${queryParams.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getServiceOrders: build.query<
      ServiceOrdersResponse,
      OrdersQueryParams | void
    >({
      query: (params) => {
        if (!params) return "/admin-dashboard/orders/services";
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.searchTerm)
          queryParams.append("searchTerm", params.searchTerm);
        if (params.payment && params.payment !== "all")
          queryParams.append("payment", params.payment);
        if (params.status && params.status !== "all")
          queryParams.append("status", params.status);
        return `/admin-dashboard/orders/services?${queryParams.toString()}`;
      },
      providesTags: ["Orders"],
    }),
    getProductOrderById: build.query<SingleProductOrderResponse, string>({
      query: (id) => `/admin-dashboard/orders/products/${id}`,
      providesTags: (_result, _error, arg) => [{ type: "Orders", id: arg }],
    }),
    getServiceOrderById: build.query<SingleServiceOrderResponse, string>({
      query: (id) => `/admin-dashboard/orders/services/${id}`,
      providesTags: (_result, _error, arg) => [{ type: "Orders", id: arg }],
    }),
    updateProductOrderStatus: build.mutation<
      unknown,
      { id: string; orderStatus: ProductUpdatableStatus; reason?: string }
    >({
      query: ({ id, orderStatus, reason }) => ({
        url: `/admin-dashboard/orders/products/${id}/status`,
        method: "PATCH",
        body: reason?.trim() ? { orderStatus, reason: reason.trim() } : { orderStatus },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
      ],
    }),
    updateServiceOrderStatus: build.mutation<
      unknown,
      { id: string; orderStatus: ServiceUpdatableStatus; reason?: string }
    >({
      query: ({ id, orderStatus, reason }) => ({
        url: `/admin-dashboard/orders/services/${id}/status`,
        method: "PATCH",
        body: reason?.trim() ? { orderStatus, reason: reason.trim() } : { orderStatus },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Orders",
        { type: "Orders", id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductOrdersQuery,
  useGetServiceOrdersQuery,
  useGetProductOrderByIdQuery,
  useGetServiceOrderByIdQuery,
  useUpdateProductOrderStatusMutation,
  useUpdateServiceOrderStatusMutation,
} = ordersApi;
