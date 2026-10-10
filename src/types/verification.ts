export type VerificationStatus = "pending" | "approved" | "rejected";
export type VerificationType = "vendor" | "rider";

export interface VerificationDocument {
  type: string;
  key: string;
  url: string;
}

export interface VerificationUser {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  isVendorVerified?: boolean;
  isRiderVerified?: boolean;
}

export interface VerificationRequest {
  _id: string;
  type: VerificationType | string;
  status: VerificationStatus | string;
  documents?: VerificationDocument[];
  user?: VerificationUser | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerificationPagination {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export interface VerificationRequestsResponse {
  success: boolean;
  message?: string;
  pagination?: VerificationPagination;
  data: VerificationRequest[];
}

export interface SingleVerificationRequestResponse {
  success: boolean;
  message?: string;
  data: VerificationRequest;
}
