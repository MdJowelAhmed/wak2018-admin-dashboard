export type HeroType = "product" | "service";

export interface HeroSection {
  _id: string;
  header: string;
  description: string;
  image: string;
  product?: any | null; // Product model can be further typed if needed
  service?: any | null; // Service model can be further typed if needed
  link?: string | null;
  type: HeroType;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeroSectionsResponse {
  success: boolean;
  message: string;
  data: HeroSection[];
}
