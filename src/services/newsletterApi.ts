import { baseApi } from "@/services/baseApi";
import type {
  NewsletterStatsResponse,
  SubscribersListResponse,
  GetSubscribersParams,
  DeleteSubscriberResponse,
  SendTestEmailPayload,
  SendTestEmailResponse,
  BroadcastCampaignPayload,
  BroadcastCampaignResponse,
  CampaignsListResponse,
  GetCampaignsParams,
  CampaignDetailsResponse,
} from "@/types/newsletter";

export const newsletterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNewsletterStats: builder.query<NewsletterStatsResponse, void>({
      query: () => ({
        url: "/newsletters/stats",
        method: "GET",
      }),
      providesTags: [{ type: "Newsletter", id: "STATS" }],
    }),

    getSubscribers: builder.query<SubscribersListResponse, GetSubscribersParams | void>({
      query: (params) => ({
        url: "/newsletters/subscribers",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: [{ type: "Newsletter", id: "SUBSCRIBERS" }],
    }),

    deleteSubscriber: builder.mutation<DeleteSubscriberResponse, string>({
      query: (id) => ({
        url: `/newsletters/subscribers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Newsletter", id: "SUBSCRIBERS" },
        { type: "Newsletter", id: "STATS" },
      ],
    }),

    sendTestEmail: builder.mutation<SendTestEmailResponse, SendTestEmailPayload>({
      query: (body) => ({
        url: "/newsletters/test-send",
        method: "POST",
        body,
      }),
    }),

    broadcastCampaign: builder.mutation<BroadcastCampaignResponse, BroadcastCampaignPayload>({
      query: (body) => ({
        url: "/newsletters/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Newsletter", id: "CAMPAIGNS" },
        { type: "Newsletter", id: "STATS" },
      ],
    }),

    getCampaigns: builder.query<CampaignsListResponse, GetCampaignsParams | void>({
      query: (params) => ({
        url: "/newsletters/campaigns",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: [{ type: "Newsletter", id: "CAMPAIGNS" }],
    }),

    getCampaignDetails: builder.query<CampaignDetailsResponse, string>({
      query: (id) => ({
        url: `/newsletters/campaigns/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Newsletter", id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNewsletterStatsQuery,
  useGetSubscribersQuery,
  useDeleteSubscriberMutation,
  useSendTestEmailMutation,
  useBroadcastCampaignMutation,
  useGetCampaignsQuery,
  useGetCampaignDetailsQuery,
} = newsletterApi;
