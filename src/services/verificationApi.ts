import { baseApi } from "./baseApi";
import type {
  SingleVerificationRequestResponse,
  VerificationRequestsResponse,
  VerificationStatus,
  VerificationType,
} from "@/types/verification";

export interface VerificationQueryParams {
  page?: number;
  limit?: number;
  status?: VerificationStatus | "all";
  type?: VerificationType | "all";
}

export const verificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getVerificationRequests: build.query<
      VerificationRequestsResponse,
      VerificationQueryParams | void
    >({
      query: (params) => {
        if (!params) return "/verification-requests";
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.status && params.status !== "all")
          queryParams.append("status", params.status);
        if (params.type && params.type !== "all")
          queryParams.append("type", params.type);
        const qs = queryParams.toString();
        return qs ? `/verification-requests?${qs}` : "/verification-requests";
      },
      providesTags: ["VerificationRequests"],
    }),
    getVerificationRequestById: build.query<
      SingleVerificationRequestResponse,
      string
    >({
      query: (id) => `/verification-requests/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "VerificationRequests", id },
      ],
    }),
    updateVerificationRequestStatus: build.mutation<
      unknown,
      { id: string; status: "approved" | "rejected" }
    >({
      query: ({ id, status }) => ({
        url: `/verification-requests/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "VerificationRequests",
        { type: "VerificationRequests", id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVerificationRequestsQuery,
  useGetVerificationRequestByIdQuery,
  useUpdateVerificationRequestStatusMutation,
} = verificationApi;
