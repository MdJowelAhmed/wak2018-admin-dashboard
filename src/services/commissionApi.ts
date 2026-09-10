import { baseApi } from "./baseApi";

export interface CommissionSettings {
  customerChargePercentage: number;
  providerChargePercentage: number;
  productVendorCommissionPercentage: number;
  riderCommissionPercentage: number;
}

export interface CommissionSettingsResponse {
  success: boolean;
  message: string;
  data: CommissionSettings;
}

export const commissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommission: builder.query<CommissionSettingsResponse, void>({
      query: () => ({
        url: "/commission-settings/",
        method: "GET",
      }),
      providesTags: ["Commission"],
    }),
    updateCommission: builder.mutation<CommissionSettingsResponse, Partial<CommissionSettings>>({
      query: (body) => ({
        url: "/commission-settings/",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Commission"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCommissionQuery,
  useUpdateCommissionMutation,
  // Aliases for compatibility
  useGetCommissionQuery: useGetCommisionQuery,
  useUpdateCommissionMutation: useUpdateCommisionMutation,
} = commissionApi;