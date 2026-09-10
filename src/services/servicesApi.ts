import { baseApi } from "./baseApi";

export interface ServiceItem {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  serviceName?: string;
  [key: string]: any;
}

export interface ServicesResponse {
  success?: boolean;
  message?: string;
  data?: ServiceItem[] | { services?: ServiceItem[] };
  [key: string]: any;
}

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query<ServicesResponse | ServiceItem[], void>({
      query: () => "/services",
      providesTags: ["Services"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetServicesQuery } = servicesApi;
