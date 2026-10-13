import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "@/features/auth/authSlice";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("admin_token");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;
    // 401 = Unauthorized (token expired), 403 = Forbidden
    if (status === 401 || status === 403) {
      api.dispatch(logout());
      // Redirect to login page
      window.location.href = "/login";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
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
    "VerificationRequests",
    "Newsletter",
  ],
  endpoints: () => ({}),
});
