export interface ISubscriber {
  _id: string;
  email: string;
  status: "active" | "unsubscribed";
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  createdAt: string;
}

export interface INewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedSubscribers: number;
  totalCampaigns: number;
}

export interface INewsletterCampaign {
  _id: string;
  subject: string;
  title: string;
  content: string;
  status: "draft" | "sending" | "completed" | "failed";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentBy:
    | {
        _id: string;
        name: string;
        email: string;
        role?: string;
      }
    | string;
  sentAt?: string;
  createdAt: string;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface NewsletterStatsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: INewsletterStats;
}

export interface SubscribersListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  pagination: IPagination;
  data: ISubscriber[];
}

export interface DeleteSubscriberResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    _id: string;
    email: string;
  };
}

export interface SendTestEmailPayload {
  email: string;
  subject: string;
  title: string;
  content: string;
}

export interface SendTestEmailResponse {
  success: boolean;
  statusCode: number;
  message: string;
}

export interface BroadcastCampaignPayload {
  subject: string;
  title: string;
  content: string;
}

export interface BroadcastCampaignResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: INewsletterCampaign;
}

export interface CampaignsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  pagination: IPagination;
  data: INewsletterCampaign[];
}

export interface CampaignDetailsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: INewsletterCampaign;
}

export interface GetSubscribersParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: "active" | "unsubscribed";
  sort?: string;
}

export interface GetCampaignsParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: string;
  sort?: string;
}
