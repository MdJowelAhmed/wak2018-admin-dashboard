import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("admin_token");
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "Dashboard",
    "Users",
    "Vendors",
    "Products",
    "Services",
    "Orders",
    "Payouts",
    "WithdrawRequests",
    "Analytics",
    "DeliveryDrivers",
    "Hero",
    "Deliveries",
    "Profile",
    "Disclaimers",
    "ServiceProviders",
    "Categories",
    "Commission",
  ],
  endpoints: () => ({}),
});
