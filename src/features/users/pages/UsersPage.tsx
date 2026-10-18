import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { PageShell } from "@/components/PageShell";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetCustomersQuery,
  useGetCustomerDetailsQuery,
  useUpdateCustomerStatusMutation,
} from "@/services/customerApi";
import type { Customer } from "@/types/customer";

const baseApiUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
// Remove any /api/v... from the base URL to get the root host URL for images
const hostUrl = baseApiUrl.replace(/\/api\/v\d+\/?$/, "");

function getImageUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${hostUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function RoleBadge({ role }: { role: string }) {
  const variant: "default" | "secondary" | "warning" =
    role === "vendor" ? "secondary" : role === "driver" ? "warning" : "default";
  return <Badge variant={variant}>{role}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  return status === "inactive" || status === "blocked" ? (
    <Badge variant="danger">{status}</Badge>
  ) : (
    <Badge variant="success">{status || "active"}</Badge>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function orderStatusVariant(
  status: string,
): "secondary" | "success" | "warning" | "danger" {
  if (status === "paid" || status === "completed") return "success";
  if (status === "pending") return "warning";
  if (status === "refunded") return "secondary";
  return "danger";
}

const MotionTableRow = motion(TableRow);

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: customersData, isLoading } = useGetCustomersQuery({
    page,
    limit: pageSize,
    searchTerm: q || undefined,
    status: status !== "all" ? status : undefined,
    role: role !== "all" ? role : undefined,
  });

  const [updateStatus] = useUpdateCustomerStatusMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detailsData } = useGetCustomerDetailsQuery(selectedId || "", {
    skip: !selectedId,
  });

  const selectedDetails = detailsData?.data;

  const [confirmTarget, setConfirmTarget] = useState<Customer | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "inactive" | "active" | null
  >(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  const paged = customersData?.data || [];
  const totalPages = customersData?.pagination?.totalPage || 1;
  const totalUsers = customersData?.pagination?.total || 0;

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const nums: number[] = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  function requestToggle(u: Customer) {
    setConfirmTarget(u);
    setPendingAction(
      u.status === "inactive" || u.status === "blocked" ? "active" : "inactive",
    );
  }

  async function applyToggle() {
    if (!confirmTarget || !pendingAction) return;
    try {
      await updateStatus({
        id: confirmTarget._id,
        status: pendingAction,
      }).unwrap();
    } catch (err) {
      console.error("Failed to update status", err);
    }
    setConfirmTarget(null);
    setPendingAction(null);
  }

  return (
    <PageShell
      title="Users"
      description="Search, filter, and manage customers, vendors, and drivers."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name/email…"
            className="w-full md:w-65"
          />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All roles</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="driver">Driver</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone / Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spend</TableHead>
                  <TableHead className="min-w-40 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10">
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <svg
                          width="120"
                          height="90"
                          viewBox="0 0 120 90"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="opacity-70"
                        >
                          <rect
                            x="10"
                            y="16"
                            width="100"
                            height="64"
                            rx="10"
                            fill="rgba(0,0,0,0.04)"
                          />
                          <rect
                            x="22"
                            y="30"
                            width="44"
                            height="10"
                            rx="5"
                            fill="rgba(137,81,41,0.18)"
                          />
                          <rect
                            x="22"
                            y="46"
                            width="76"
                            height="8"
                            rx="4"
                            fill="rgba(0,0,0,0.08)"
                          />
                          <rect
                            x="22"
                            y="58"
                            width="60"
                            height="8"
                            rx="4"
                            fill="rgba(0,0,0,0.08)"
                          />
                        </svg>
                        <div className="text-sm font-medium text-foreground">
                          No users yet
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Try adjusting search or filters.
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((u) => (
                    <MotionTableRow
                      key={u._id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => setClickedId(u._id)}
                      className={
                        clickedId === u._id ? "bg-primary/5" : undefined
                      }
                    >
                      <TableCell className="align-middle py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={getImageUrl(u.profileImage)}
                              alt={u.name}
                            />
                            <AvatarFallback>
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="leading-tight">
                            <div className="font-medium">{u.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle py-4 text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell className="align-middle py-4">
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="align-middle py-4 text-sm">
                        <div>{u.phone || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.address || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle py-4">
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="align-middle py-4">
                        {u.ordersCount}
                      </TableCell>
                      <TableCell className="align-middle py-4">
                        {formatMoney(u.totalSpend)}
                      </TableCell>
                      <TableCell className="min-w-40 align-middle py-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg border border-[#89512920] bg-white text-[#895129] hover:bg-[#faf7f3]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(u._id);
                              }}
                              aria-label="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </motion.div>

                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            {u.status === "active" ? (
                              <Button
                                size="sm"
                                className="h-9 rounded-lg border border-red-200 bg-[#fff1f1] px-3 text-sm font-medium text-red-600 hover:bg-[#ffe6e6]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestToggle(u);
                                }}
                              >
                                Block
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="h-9 rounded-lg border border-green-200 bg-[#eefbf3] px-3 text-sm font-medium text-green-700 hover:bg-[#e2f6ea]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestToggle(u);
                                }}
                              >
                                Unblock
                              </Button>
                            )}
                          </motion.div>
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
       
      </motion.div>

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              Full history and admin controls.
            </DialogDescription>
          </DialogHeader>

          {!selectedDetails ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading details...
            </div>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getImageUrl(
                            selectedDetails.customer.profileImage,
                          )}
                          alt={selectedDetails.customer.name}
                        />
                        <AvatarFallback>
                          {getInitials(selectedDetails.customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {selectedDetails.customer.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedDetails.customer.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoleBadge role={selectedDetails.customer.role} />
                      <StatusBadge status={selectedDetails.customer.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="font-medium">
                        {selectedDetails.customer.phone || "-"}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        Joined
                      </div>
                      <div className="font-medium">
                        {new Date(
                          selectedDetails.customer.createdAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        Total orders
                      </div>
                      <div className="font-medium">
                        {selectedDetails.customer.ordersCount}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        Total spent
                      </div>
                      <div className="font-medium">
                        {formatMoney(selectedDetails.customer.totalSpend)}
                      </div>
                    </div>
                    <div className="text-sm sm:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        Address
                      </div>
                      <div className="font-medium">
                        {selectedDetails.customer.address || "-"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Activity summary</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Quick snapshot across orders and bookings.
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-black/2 p-3">
                      <div className="text-xs text-muted-foreground">
                        Products
                      </div>
                      <div className="text-base font-semibold">
                        {selectedDetails.productOrders.length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/2 p-3">
                      <div className="text-xs text-muted-foreground">Spend</div>
                      <div className="text-base font-semibold">
                        {formatMoney(selectedDetails.customer.totalSpend)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-black/2 p-3">
                      <div className="text-xs text-muted-foreground">
                        Services
                      </div>
                      <div className="text-base font-semibold">
                        {selectedDetails.serviceOrders.length}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="orders" className="space-y-3">
                <div className="text-sm font-medium">Recent Product Orders</div>
                <div className="space-y-2">
                  {selectedDetails.productOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No product orders found.
                    </div>
                  ) : (
                    selectedDetails.productOrders.slice(0, 5).map((o: any) => (
                      <div
                        key={o._id || o.id}
                        className="flex items-center justify-between rounded-lg border border-[#EEE7DF] p-3"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {o._id || o.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatMoney(o.total || o.amount || 0)}
                          </div>
                        </div>
                        <Badge
                          variant={orderStatusVariant(o.status)}
                          className="capitalize"
                        >
                          {o.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-3">
                <div className="text-sm font-medium">Service bookings</div>
                <div className="space-y-2">
                  {selectedDetails.serviceOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No bookings found.
                    </div>
                  ) : (
                    selectedDetails.serviceOrders
                      .slice(0, 8)
                      .map((b: any, idx: number) => (
                        <div
                          key={b._id || idx}
                          className="flex items-center justify-between rounded-lg border border-[#EEE7DF] p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {b.serviceName || "Service Order"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {b.date
                                ? new Date(b.date).toLocaleDateString()
                                : "-"}
                            </div>
                          </div>
                          <Badge
                            variant={
                              b.status === "confirmed" ||
                              b.status === "completed"
                                ? "success"
                                : b.status === "pending"
                                  ? "warning"
                                  : "danger"
                            }
                            className="capitalize"
                          >
                            {b.status || "unknown"}
                          </Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmTarget && !!pendingAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmTarget(null);
            setPendingAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "inactive" ? "Block user?" : "Unblock user?"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget
                ? `${pendingAction === "inactive" ? "Blocking" : "Unblocking"} ${confirmTarget.name} will immediately change their access.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmTarget(null);
                setPendingAction(null);
              }}
            >
              Cancel
            </Button>
            {pendingAction === "inactive" ? (
              <Button variant="destructive" onClick={applyToggle}>
                Block
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                onClick={applyToggle}
              >
                Unblock
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
