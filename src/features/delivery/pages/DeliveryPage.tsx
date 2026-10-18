import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, UserPlus } from "lucide-react";
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
  useGetDeliveriesStatsQuery,
  useGetDeliveriesQuery,
  useGetDeliveryByIdQuery,
  useUpdateDeliveryStatusMutation,
} from "@/services/deliveriesApi";
import type { DeliveryStatus, DeliveryType } from "@/types/delivery";

type Driver = { name: string; phone: string };

// Keep mock drivers for the assignment UI if needed
const mockDrivers: Driver[] = [
  { name: "Karim Uddin", phone: "+880 1700-111111" },
  { name: "Nadia Islam", phone: "+880 1700-222222" },
  { name: "Sabbir Hossain", phone: "+880 1700-333333" },
  { name: "Rafi Ahmed", phone: "+880 1700-444444" },
];

function TypeBadge({ type }: { type: DeliveryType | string }) {
  return type === "local" ? (
    <Badge variant="secondary">Local</Badge>
  ) : (
    <Badge variant="secondary">International</Badge>
  );
}

function StatusBadge({ status }: { status: DeliveryStatus | string }) {
  if (status === "delivered") return <Badge variant="success">Delivered</Badge>;
  if (status === "in_transit")
    return <Badge variant="warning">In transit</Badge>;
  if (status === "picked_up") return <Badge variant="warning">Picked up</Badge>;
  if (status === "confirmed") return <Badge variant="default">Confirmed</Badge>;
  return (
    <Badge variant="secondary">{status?.replace("_", " ") || "Pending"}</Badge>
  );
}

const MotionTableRow = motion(TableRow);

export default function DeliveryPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);

  const [tab, setTab] = useState<
    "all" | "local" | "international" | "pending" | "in_transit" | "delivered"
  >("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "all">("all");
  const [type, setType] = useState<DeliveryType | "all">("all");
  const [driver] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>(
    mockDrivers[0]?.name ?? "",
  );
  const [highlightId] = useState<string | null>(null);

  const [dismissedToastId, setDismissedToastId] = useState<string | null>(null);
  const lastDeliveryNotifId = useRef<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      searchTerm: q || undefined,
      status:
        tab !== "all" && ["pending", "in_transit", "delivered"].includes(tab)
          ? tab
          : status === "all"
            ? undefined
            : status,
      type:
        tab === "local" || tab === "international"
          ? tab
          : type === "all"
            ? undefined
            : type,
      driver: driver === "all" ? undefined : driver,
    }),
    [page, q, status, type, driver, tab],
  );

  const { data: statsResponse } = useGetDeliveriesStatsQuery();
  const { data: deliveriesResponse, isFetching: isFetchingDeliveries } =
    useGetDeliveriesQuery(queryParams);
  const { data: singleDeliveryResponse, isFetching: isFetchingDetails } =
    useGetDeliveryByIdQuery(selectedId || "", { skip: !selectedId });

  const [updateDeliveryStatus] = useUpdateDeliveryStatusMutation();

  const stats = statsResponse?.data || {
    activeDeliveries: 0,
    pendingAssignments: 0,
    deliveredToday: 0,
    avgDeliveryTime: "N/A",
  };

  const currentData = deliveriesResponse?.data || [];
  const pagination = deliveriesResponse?.pagination;
  const totalPages = pagination?.totalPage || 1;

  const selectedDetails = singleDeliveryResponse?.data;

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const nums: number[] = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  const latestDeliveryNotification = useMemo(() => {
    return notifications.find((n) => n.kind === "delivery");
  }, [notifications]);

  const toastVisible =
    !!latestDeliveryNotification &&
    latestDeliveryNotification.id !== dismissedToastId &&
    !latestDeliveryNotification.read;

  function assignDriverTo() {
    // Implement API call for driver assignment if available
    setAssignTargetId(null);
  }

  const handleStatusUpdate = async (newStatus: DeliveryStatus) => {
    if (selectedId) {
      try {
        await updateDeliveryStatus({
          id: selectedId,
          status: newStatus,
        }).unwrap();
      } catch (err) {
        console.error("Failed to update status", err);
      }
    }
  };

  useEffect(() => {
    const latest: AppNotification | undefined = latestDeliveryNotification;
    if (!latest) return;
    if (latest.id === lastDeliveryNotifId.current) return;
    lastDeliveryNotifId.current = latest.id;

    const t1 = window.setTimeout(() => {
      setDismissedToastId(latest.id);
      dispatch(markRead(latest.id));
    }, 3000);

    return () => {
      window.clearTimeout(t1);
    };
  }, [dispatch, latestDeliveryNotification]);

  return (
    <PageShell
      title="Delivery"
      description="Assign drivers, track local/international delivery and timeline."
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        {toastVisible && latestDeliveryNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-[#EEE7DF] bg-white p-3 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {latestDeliveryNotification.title}
                </div>
                {latestDeliveryNotification.description && (
                  <div className="text-sm text-muted-foreground">
                    {latestDeliveryNotification.description}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDismissedToastId(latestDeliveryNotification.id);
                  dispatch(markRead(latestDeliveryNotification.id));
                }}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active Deliveries", value: stats.activeDeliveries },
            { label: "Pending Assignments", value: stats.pendingAssignments },
            { label: "Delivered Today", value: stats.deliveredToday },
            { label: "Avg Delivery Time", value: stats.avgDeliveryTime },
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

      
      
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order ID or customer..."
                className="md:col-span-2"
              />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as DeliveryStatus | "all");
                  setPage(1);
                  setTab("all");
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Status: all</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="picked_up">Picked up</option>
                <option value="in_transit">In transit</option>
                <option value="delivered">Delivered</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as DeliveryType | "all");
                  setPage(1);
                  setTab("all");
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Type: all</option>
                <option value="local">Local</option>
                <option value="international">International</option>
              </select>
              <div className="flex items-center justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setQ("");
                    setStatus("all");
                    setType("all");
                    setTab("all");
                    setPage(1);
                  }}
                >
                  Reset filters
                </Button>
              </div>
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
                <TabsTrigger value="local">Local Delivery</TabsTrigger>
                <TabsTrigger value="international">
                  International Delivery
                </TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_transit">In Transit</TabsTrigger>
                <TabsTrigger value="delivered">Delivered</TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Delivery ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Pickup → Drop</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="min-w-40 pr-6 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isFetchingDeliveries ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : currentData.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No deliveries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((d: any) => (
                        <MotionTableRow
                          key={d._id}
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.12 }}
                          className={
                            highlightId === d._id ? "bg-primary/5" : undefined
                          }
                        >
                          <TableCell
                            className="font-medium text-xs max-w-[100px] truncate"
                            title={d._id}
                          >
                            {d._id}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-medium">
                            {d.orderId}
                          </TableCell>
                          <TableCell>
                            <TypeBadge type={d.deliveryType} />
                          </TableCell>
                          <TableCell>{d.customer?.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {d.rider?.name ?? "—"}
                          </TableCell>
                          <TableCell
                            className="text-muted-foreground text-xs max-w-[200px] truncate"
                            title={`${d.pickupAddress} → ${d.dropoffAddress}`}
                          >
                            {d.pickupAddress} → {d.dropoffAddress}
                          </TableCell>
                          <TableCell>
                            <motion.div
                              key={`${d._id}-${d.status}`}
                              initial={{ opacity: 0.6, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.18 }}
                              className="inline-block"
                            >
                              <StatusBadge status={d.status} />
                            </motion.div>
                          </TableCell>
                          <TableCell className="min-w-40 pr-6 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-3">
                              <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-10 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                                  onClick={() => setSelectedId(d._id)}
                                  aria-label="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </motion.div>
                              {!d.rider && (
                                <motion.div
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  <Button
                                    size="sm"
                                    className="bg-primary text-white hover:bg-primary/90"
                                    onClick={() => {
                                      setAssignTargetId(d._id);
                                      setSelectedDriver(
                                        mockDrivers[0]?.name ?? "",
                                      );
                                    }}
                                  >
                                    <UserPlus className="h-4 w-4" />
                                    Assign Driver
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </TableCell>
                        </MotionTableRow>
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
        
      </motion.div>

      <Dialog
        open={!!assignTargetId}
        onOpenChange={(open) => !open && setAssignTargetId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign driver</DialogTitle>
            <DialogDescription>
              Select a driver and confirm assignment.
            </DialogDescription>
          </DialogHeader>
          {!assignTargetId ? null : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#EEE7DF] p-3">
                <div className="text-sm font-medium">{assignTargetId}</div>
              </div>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                {mockDrivers.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} • {d.phone}
                  </option>
                ))}
              </select>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAssignTargetId(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-white hover:bg-primary/90"
                  onClick={() => {
                    assignDriverTo();
                  }}
                >
                  Confirm assign
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Delivery details</DialogTitle>
            <DialogDescription>
              Timeline + location information.
            </DialogDescription>
          </DialogHeader>

          {isFetchingDetails ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading details...
            </div>
          ) : !selectedDetails ? null : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Overview</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Order</div>
                      <div className="font-medium">
                        {selectedDetails.overview.orderId}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Type</div>
                      <TypeBadge
                        type={selectedDetails.overview.type.toLowerCase()}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <StatusBadge status={selectedDetails.overview.status} />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Driver info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Name</div>
                      <div className="font-medium">
                        {selectedDetails.driverInfo?.name ?? "—"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Phone</div>
                      <div className="font-medium">
                        {selectedDetails.driverInfo?.phone ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Locations</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg bg-black/2 p-3">
                    <div className="text-xs text-muted-foreground">Pickup</div>
                    <div className="font-medium mt-1">
                      {selectedDetails.locations.pickup}
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/2 p-3">
                    <div className="text-xs text-muted-foreground">Drop</div>
                    <div className="font-medium mt-1">
                      {selectedDetails.locations.drop}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Timeline</div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {selectedDetails.timeline?.map((log: any, i: number) => (
                    <Badge
                      key={i}
                      variant={
                        i === (selectedDetails.timeline?.length || 1) - 1
                          ? "default"
                          : "secondary"
                      }
                      title={log.note}
                    >
                      {log.stage.replace("_", " ")} -{" "}
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  Close
                </Button>
                {selectedDetails.overview.type.toLowerCase() === "local" && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      disabled={
                        selectedDetails.overview.status !== "pending" &&
                        selectedDetails.overview.status !== "confirmed"
                      }
                      onClick={() => handleStatusUpdate("picked_up")}
                    >
                      Mark as Picked Up
                    </Button>
                    <Button
                      variant="outline"
                      disabled={selectedDetails.overview.status === "delivered"}
                      onClick={() => handleStatusUpdate("in_transit")}
                    >
                      Mark as In Transit
                    </Button>
                    <Button
                      disabled={selectedDetails.overview.status === "delivered"}
                      onClick={() => handleStatusUpdate("delivered")}
                    >
                      Mark as Delivered
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
