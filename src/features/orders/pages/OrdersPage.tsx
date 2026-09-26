import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppNotification } from "@/app/notifications/notificationsSlice";
import { markRead } from "@/app/notifications/notificationsSlice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";

import {
  useGetProductOrdersQuery,
  useGetServiceOrdersQuery,
  useGetProductOrderByIdQuery,
  useGetServiceOrderByIdQuery,
  useUpdateProductOrderStatusMutation,
  useUpdateServiceOrderStatusMutation,
} from "@/services/ordersApi";
import type {
  ProductUpdatableStatus,
  ServiceUpdatableStatus,
} from "@/types/order";

type OrderType = "product" | "service";

const PRODUCT_STATUS_OPTIONS: { value: ProductUpdatableStatus; label: string }[] =
  [
    { value: "shipped", label: "Shipped" },
    { value: "out_for_delivery", label: "Out for Delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "ready_for_pickup", label: "Ready for Pickup" },
    { value: "cancelled", label: "Cancelled" },
  ];

const SERVICE_STATUS_OPTIONS: { value: ServiceUpdatableStatus; label: string }[] =
  [
    { value: "in_progress", label: "In Progress" },
    { value: "delivered", label: "Delivered" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

function formatStatusLabel(status: string) {
  return status?.replace(/_/g, " ") || "Pending";
}

function getApiErrorMessage(err: unknown) {
  if (typeof err === "object" && err && "data" in err) {
    const message = (err as { data?: { message?: string } }).data?.message;
    if (message) return message;
  }
  return "Failed to update order status.";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function TypeBadge({ type }: { type: OrderType }) {
  return type === "product" ? (
    <Badge variant="secondary">Product</Badge>
  ) : (
    <Badge variant="secondary">Service</Badge>
  );
}

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "pending" || status === "unpaid")
    return <Badge variant="warning">Pending</Badge>;
  if (status === "failed") return <Badge variant="danger">Failed</Badge>;
  return <Badge variant="secondary">Cancelled</Badge>;
}

function DeliveryBadge({ status }: { status: string }) {
  const label = formatStatusLabel(status);
  if (status === "delivered" || status === "completed")
    return <Badge variant="success">{label}</Badge>;
  if (status === "cancelled") return <Badge variant="danger">{label}</Badge>;
  if (
    status === "in_progress" ||
    status === "in_transit" ||
    status === "shipped" ||
    status === "out_for_delivery" ||
    status === "ready_for_pickup"
  )
    return <Badge variant="warning">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);

  const [tab, setTab] = useState<
    | "all"
    | "pending"
    | "confirmed"
    | "in_progress"
    | "delivered"
    | "completed"
    | "cancelled"
  >("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string | "all">("all"); // payment
  const [type, setType] = useState<OrderType>("product");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    id: string;
    orderId: string;
    currentStatus: string;
  } | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);

  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const [highlightId] = useState<string | null>(null);

  const lastOrderNotifId = useRef<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      searchTerm: q || undefined,
      startDate: fromDate || undefined,
      endDate: toDate || undefined,
      payment: status === "all" ? undefined : status,
      status: tab === "all" ? undefined : tab,
    }),
    [page, q, fromDate, toDate, status, tab],
  );

  const { data: productResponse, isFetching: isFetchingProducts } =
    useGetProductOrdersQuery(queryParams, { skip: type !== "product" });
  const { data: serviceResponse, isFetching: isFetchingServices } =
    useGetServiceOrdersQuery(queryParams, { skip: type !== "service" });

  const { data: singleProductResponse, isFetching: isFetchingProductDetails } =
    useGetProductOrderByIdQuery(selectedOrderId || "", {
      skip: !selectedOrderId || type !== "product",
    });
  const { data: singleServiceResponse, isFetching: isFetchingServiceDetails } =
    useGetServiceOrderByIdQuery(selectedOrderId || "", {
      skip: !selectedOrderId || type !== "service",
    });

  const [updateProductStatus, { isLoading: isUpdatingProductStatus }] =
    useUpdateProductOrderStatusMutation();
  const [updateServiceStatus, { isLoading: isUpdatingServiceStatus }] =
    useUpdateServiceOrderStatusMutation();
  const isUpdatingStatus =
    isUpdatingProductStatus || isUpdatingServiceStatus;

  const statusOptions =
    type === "product" ? PRODUCT_STATUS_OPTIONS : SERVICE_STATUS_OPTIONS;

  const currentData =
    type === "product"
      ? productResponse?.data || []
      : serviceResponse?.data || [];
  const pagination =
    type === "product"
      ? productResponse?.pagination
      : serviceResponse?.pagination;
  const isLoading =
    type === "product" ? isFetchingProducts : isFetchingServices;

  const selectedOrder =
    type === "product"
      ? singleProductResponse?.data
      : singleServiceResponse?.data;
  const isLoadingDetails =
    type === "product" ? isFetchingProductDetails : isFetchingServiceDetails;

  function openStatusDialog(order: { _id: string; orderId: string; orderStatus: string }) {
    if (order.orderStatus === "cancelled") return;
    const options =
      type === "product" ? PRODUCT_STATUS_OPTIONS : SERVICE_STATUS_OPTIONS;
    const currentAllowed = options.find((opt) => opt.value === order.orderStatus);
    setStatusTarget({
      id: order._id,
      orderId: order.orderId,
      currentStatus: order.orderStatus,
    });
    setNextStatus(currentAllowed?.value ?? options[0].value);
    setStatusReason("");
    setStatusError(null);
  }

  function closeStatusDialog(force = false) {
    if (isUpdatingStatus && !force) return;
    setStatusTarget(null);
    setStatusReason("");
    setStatusError(null);
  }

  async function handleStatusUpdate() {
    if (!statusTarget || !nextStatus) return;
    setStatusError(null);
    try {
      if (type === "product") {
        await updateProductStatus({
          id: statusTarget.id,
          orderStatus: nextStatus as ProductUpdatableStatus,
          reason: statusReason || undefined,
        }).unwrap();
      } else {
        await updateServiceStatus({
          id: statusTarget.id,
          orderStatus: nextStatus as ServiceUpdatableStatus,
          reason: statusReason || undefined,
        }).unwrap();
      }
      closeStatusDialog(true);
    } catch (err) {
      setStatusError(getApiErrorMessage(err));
    }
  }

  const totalPages = pagination?.totalPage || 1;
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const nums: number[] = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  const latestOrderNotification = useMemo(() => {
    return notifications.find((n) => n.kind === "order");
  }, [notifications]);

  const toastVisible =
    !!latestOrderNotification &&
    latestOrderNotification.id !== dismissedToastId &&
    !latestOrderNotification.read;

  useEffect(() => {
    const latest: AppNotification | undefined = latestOrderNotification;
    if (!latest) return;
    if (latest.id === lastOrderNotifId.current) return;
    lastOrderNotifId.current = latest.id;

    const t1 = window.setTimeout(() => {
      setDismissedToastId(latest.id);
      dispatch(markRead(latest.id));
    }, 3000);

    return () => {
      window.clearTimeout(t1);
    };
  }, [dispatch, latestOrderNotification]);

  return (
    <PageShell
      title="Orders"
      description="Filter orders, inspect details, and handle delivery/chat actions."
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        {toastVisible && latestOrderNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-[#EEE7DF] bg-white p-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {latestOrderNotification.title}
                </div>
                {latestOrderNotification.description && (
                  <div className="text-sm text-muted-foreground">
                    {latestOrderNotification.description}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDismissedToastId(latestOrderNotification.id);
                  dispatch(markRead(latestOrderNotification.id));
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Orders", value: pagination?.total || 0 },
            { label: "Current Page", value: page },
            { label: "Page Limit", value: pagination?.limit || 10 },
            { label: "Total Pages", value: totalPages },
          ].map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Card className="transition-shadow hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-foreground">
                    {s.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Order lifecycle</CardTitle>
            <div className="text-sm text-muted-foreground">
              {pagination?.total || 0} results
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order ID, customer email..."
                className="md:col-span-2"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Payment: all</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as OrderType);
                  setPage(1);
                  setTab("all");
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="md:col-span-1"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="md:col-span-1"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                  setType("product");
                  setFromDate("");
                  setToDate("");
                  setTab("all");
                  setPage(1);
                }}
              >
                Reset filters
              </Button>
            </div>

            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as typeof tab);
                setPage(1);
              }}
            >
              <TabsList className="flex flex-wrap h-auto justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vendor/Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="min-w-52 pr-6 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No orders match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((o: any) => (
                        <TableRow
                          key={o._id}
                          className={
                            highlightId === o._id ? "bg-primary/5" : undefined
                          }
                        >
                          <TableCell className="font-medium">
                            {o.orderId}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={type} />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {o.customer?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {o.customer?.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {type === "product"
                                ? o.vendor?.name
                                : o.provider?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {type === "product"
                                ? o.vendor?.email
                                : o.provider?.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatMoney(
                              type === "product" ? o.grandTotal : o.netAmount,
                            )}
                          </TableCell>
                          <TableCell>
                            <PaymentBadge status={o.paymentStatus} />
                          </TableCell>
                          <TableCell>
                            <DeliveryBadge status={o.orderStatus} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="min-w-52 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                                disabled={o.orderStatus === "cancelled"}
                                title={
                                  o.orderStatus === "cancelled"
                                    ? "Cancelled orders cannot be updated"
                                    : undefined
                                }
                                onClick={() => openStatusDialog(o)}
                              >
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                Update Status
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 px-4 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                                onClick={() => setSelectedOrderId(o._id)}
                                aria-label="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    {pageNumbers.map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        className="h-9 w-9 px-0"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription>
              Full view: payment, delivery, and timeline.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading details...
            </div>
          ) : !selectedOrder ? null : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Order info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Order ID</div>
                      <div className="font-medium">{selectedOrder.orderId}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Date</div>
                      <div className="font-medium">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Type</div>
                      <TypeBadge type={type} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Payment</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <PaymentBadge status={selectedOrder.paymentStatus} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Method</div>
                      <div className="font-medium capitalize">
                        {selectedOrder.paymentMethod}
                      </div>
                    </div>
                    {type === "product" &&
                      (selectedOrder as any).stripeSessionId && (
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">Stripe ID</div>
                          <div
                            className="font-medium truncate ml-2 max-w-[150px]"
                            title={(selectedOrder as any).stripeSessionId}
                          >
                            {(selectedOrder as any).stripeSessionId}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Customer</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="font-medium">
                      {selectedOrder.customer.name}
                    </div>
                    <div className="text-muted-foreground">
                      {selectedOrder.customer.email}
                    </div>
                    {selectedOrder.customer.phone && (
                      <div className="text-muted-foreground">
                        {selectedOrder.customer.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">
                    {type === "product" ? "Vendor" : "Provider"}
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="font-medium">
                      {(selectedOrder as any).vendor?.name ||
                        (selectedOrder as any).provider?.name}
                    </div>
                    <div className="text-muted-foreground">
                      {(selectedOrder as any).vendor?.email ||
                        (selectedOrder as any).provider?.email}
                    </div>
                  </div>
                </div>
              </div>

              {type === "product" ? (
                <>
                  <div className="rounded-lg border border-[#EEE7DF] p-4">
                    <div className="text-sm font-medium">Items</div>
                    <div className="mt-3 space-y-2">
                      {(selectedOrder as any).items?.map(
                        (i: any, idx: number) => (
                          <div
                            key={`${selectedOrder.orderId}-it-${idx}`}
                            className="flex items-center justify-between rounded-lg bg-black/2 p-3 text-sm"
                          >
                            <div className="font-medium">
                              {typeof i.product === "object"
                                ? i.product.name
                                : "Product"}{" "}
                              <span className="text-muted-foreground">
                                ×{i.quantity}
                              </span>
                            </div>
                            <div className="font-medium">
                              {formatMoney(i.unitTotal)}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t flex items-center justify-between font-medium">
                      <span>Grand Total</span>
                      <span>
                        {formatMoney((selectedOrder as any).grandTotal)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#EEE7DF] p-4">
                    <div className="text-sm font-medium">Shipping Address</div>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="font-medium">
                        {(selectedOrder as any).shippingAddress?.fullName}
                      </div>
                      <div className="text-muted-foreground">
                        {(selectedOrder as any).shippingAddress?.phone}
                      </div>
                      <div className="text-muted-foreground">
                        {(selectedOrder as any).shippingAddress?.address}
                      </div>
                      <div className="text-muted-foreground">
                        {(selectedOrder as any).shippingAddress?.city},{" "}
                        {(selectedOrder as any).shippingAddress?.state},{" "}
                        {(selectedOrder as any).shippingAddress?.country}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Service Info</div>
                  <div className="mt-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Service Name</div>
                      <div className="font-medium">
                        {typeof (selectedOrder as any).service === "object"
                          ? (selectedOrder as any).service.name
                          : "Service"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Delivery Date</div>
                      <div className="font-medium">
                        {new Date(
                          (selectedOrder as any).deliveryDate,
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Net Amount</div>
                      <div className="font-medium">
                        {formatMoney((selectedOrder as any).netAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Timeline</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {selectedOrder.statusLog?.map((log: any, i: number) => (
                    <Badge
                      key={i}
                      variant={
                        i === (selectedOrder.statusLog?.length || 1) - 1
                          ? "default"
                          : "secondary"
                      }
                      title={log.note}
                    >
                      {formatStatusLabel(log.status)} -{" "}
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2 pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrderId(null)}
                  >
                    Close
                  </Button>
                  <Button
                    disabled={selectedOrder.orderStatus === "cancelled"}
                    title={
                      selectedOrder.orderStatus === "cancelled"
                        ? "Cancelled orders cannot be updated"
                        : undefined
                    }
                    onClick={() => openStatusDialog(selectedOrder)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Update Status
                  </Button>
                </div>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!statusTarget}
        onOpenChange={(open) => !open && closeStatusDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update order status</DialogTitle>
            <DialogDescription>
              {statusTarget
                ? `Choose a new status for ${statusTarget.orderId}.`
                : "Choose a new status for this order."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {statusTarget && (
              <div className="flex items-center justify-between rounded-lg border border-[#EEE7DF] bg-[#faf7f3] px-3 py-2 text-sm">
                <span className="text-muted-foreground">Current status</span>
                <DeliveryBadge status={statusTarget.currentStatus} />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="order-status">
                New status
              </label>
              <select
                id="order-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="order-reason">
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <textarea
                id="order-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={
                  nextStatus === "cancelled"
                    ? "Recommended when cancelling an order"
                    : "Add a note for this status change"
                }
                rows={3}
                className="w-full rounded-lg border border-[#EEE7DF] bg-white px-3 py-2 text-sm outline-none focus:border-[#89512960]"
              />
            </div>

            {statusError && (
              <p className="text-sm text-red-600">{statusError}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => closeStatusDialog()}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus || !nextStatus}
            >
              {isUpdatingStatus ? "Updating..." : "Update status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
