export type PaymentStatus = "paid" | "unpaid" | "pending" | "failed" | "cancelled";
export type ProductUpdatableStatus =
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "ready_for_pickup";
export type ServiceUpdatableStatus =
  | "in_progress"
  | "delivered"
  | "completed"
  | "cancelled";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "shipped"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "delivered"
  | "completed"
  | "cancelled";
export type DeliveryType = "international" | "local";

export interface StatusLogEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface CustomerSlim {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  phone?: string;
  address?: string;
}

export interface VendorSlim {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  address?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

export interface ProductItemSlim {
  _id: string;
  name: string;
  description: string;
  price: number;
}

export interface OrderItem {
  _id: string;
  product: string | ProductItemSlim; // string in list, object in details
  quantity: number;
  unitPrice: number;
  unitTotal: number;
}

export interface ProductOrder {
  _id: string;
  orderId: string;
  customer: CustomerSlim;
  vendor: VendorSlim;
  paymentMethod: string;
  deliveryType: DeliveryType;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subTotal: number;
  shippingFee: number;
  discount: number;
  totalQuantity: number;
  grandTotal: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  stockReservationStatus: string;
  stockReservedAt: string;
  localDelivery: any;
  localDeliveryStatus: string;
  shipment: { trackingStatus: string };
  statusLog: StatusLogEntry[];
  createdAt: string;
  updatedAt: string;
  stripeSessionId: string;
}

export interface ServiceItemSlim {
  _id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

export interface ServiceOrder {
  _id: string;
  orderId: string;
  customer: CustomerSlim;
  provider: VendorSlim;
  service: string | ServiceItemSlim; // string in list, object in details
  deliveryDate: string;
  price: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  charge: number;
  netAmount: number;
  deliveryDescription: string | null;
  deliveryAttachments: any[];
  completedAt: string | null;
  cancelledAt: string | null;
  statusLog: StatusLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
  totalPage: number;
}

export interface ProductOrdersResponse {
  success: boolean;
  message: string;
  pagination: PaginationMeta;
  data: ProductOrder[];
}

export interface ServiceOrdersResponse {
  success: boolean;
  message: string;
  pagination: PaginationMeta;
  data: ServiceOrder[];
}

export interface SingleProductOrderResponse {
  success: boolean;
  message: string;
  data: ProductOrder;
}

export interface SingleServiceOrderResponse {
  success: boolean;
  message: string;
  data: ServiceOrder;
}
