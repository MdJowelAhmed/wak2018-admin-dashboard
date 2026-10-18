import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Eye, ShieldAlert } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useGetWithdrawRequestsQuery,
  useUpdateWithdrawRequestStatusMutation,
} from "@/services/withdrawRequestsApi";
import type {
  WithdrawRequest,
  WithdrawRequestStatus,
} from "@/types/withdrawRequest";

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function StatusBadge({ status }: { status: WithdrawRequestStatus | string }) {
  if (status === "approved") {
    return (
      <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        approved
      </Badge>
    );
  }
  if (status === "flagged") {
    return (
      <Badge className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        flagged
      </Badge>
    );
  }
  if (status === "hold") {
    return (
      <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        hold
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        rejected
      </Badge>
    );
  }
  return (
    <Badge className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      pending
    </Badge>
  );
}

const MotionTableRow = motion(TableRow);

export default function PayoutsPage() {
  const [selected, setSelected] = useState<WithdrawRequest | null>(null);

  const [tab, setTab] = useState<"all" | "pending" | "approved" | "flagged">(
    "all",
  );
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<WithdrawRequestStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      searchTerm: q || undefined,
      status: tab !== "all" ? tab : status === "all" ? undefined : status,
    }),
    [page, q, status, tab],
  );

  const { data: response, isFetching } =
    useGetWithdrawRequestsQuery(queryParams);
  const [updateStatus] = useUpdateWithdrawRequestStatusMutation();

  const withdrawRequests = response?.data || [];
  const pagination = response?.pagination;
  const totalPages = pagination?.totalPage || 1;

  const commissionRate = 0.1;

  const summary = useMemo(() => {
    // These are simplified calculations as the new endpoint does not provide aggregated stats.
    const totalPayouts = withdrawRequests
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayouts = withdrawRequests
      .filter((p) => p.status === "pending" || p.status === "hold")
      .reduce((sum, p) => sum + p.amount, 0);

    // Total Revenue is mocked as we don't have it from this endpoint
    const totalRevenue = totalPayouts / (1 - commissionRate);
    const platformEarnings = totalRevenue * commissionRate;
    return { totalRevenue, totalPayouts, pendingPayouts, platformEarnings };
  }, [withdrawRequests]);

  const insights = useMemo(() => {
    const topVendors = [...withdrawRequests]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    const highestPayouts = [...withdrawRequests]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    const recent = [...withdrawRequests]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 5);
    return { topVendors, highestPayouts, recent };
  }, [withdrawRequests]);

  // Local filtering for date and amount ranges (since API doesn't support them yet)
  const filtered = useMemo(() => {
    const from = fromDate.trim() || undefined;
    const to = toDate.trim() || undefined;
    const min = minAmount.trim() === "" ? undefined : Number(minAmount);
    const max = maxAmount.trim() === "" ? undefined : Number(maxAmount);

    return withdrawRequests.filter((p) => {
      const matchesFrom = !from || p.createdAt.split("T")[0] >= from;
      const matchesTo = !to || p.createdAt.split("T")[0] <= to;
      const matchesMin =
        min === undefined || (!Number.isNaN(min) && p.amount >= min);
      const matchesMax =
        max === undefined || (!Number.isNaN(max) && p.amount <= max);

      return matchesFrom && matchesTo && matchesMin && matchesMax;
    });
  }, [withdrawRequests, fromDate, toDate, minAmount, maxAmount]);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const nums: number[] = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  async function handleStatusUpdate(
    id: string,
    nextStatus: WithdrawRequestStatus,
  ) {
    try {
      await updateStatus({ id, status: nextStatus }).unwrap();
      if (selected?._id === id) {
        setSelected({ ...selected, status: nextStatus });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  function commissionFor(p: WithdrawRequest) {
    const fee = Math.round(p.amount * commissionRate * 100) / 100;
    const vendorEarning = Math.round((p.amount - fee) * 100) / 100;
    return { fee, vendorEarning };
  }

  return (
    <PageShell
      title="Earnings & Payouts"
      description="Approve payouts, flag suspicious activity, and monitor revenue."
      right={
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search vendor…"
            className="w-full md:w-65"
          />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total Revenue (Est.)",
              value: formatMoney(summary.totalRevenue),
            },
            {
              label: "Total Payouts",
              value: formatMoney(summary.totalPayouts),
            },
            {
              label: "Pending Payouts",
              value: formatMoney(summary.pendingPayouts),
            },
            {
              label: "Platform Earnings (Est.)",
              value: formatMoney(summary.platformEarnings),
            },
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-10">
          <div className="xl:col-span-7">
         
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as WithdrawRequestStatus | "all");
                    setPage(1);
                    setTab("all");
                  }}
                  className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
                >
                  <option value="all">Status: all</option>
                  <option value="pending">Pending</option>
                  <option value="hold">Hold</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="flagged">Flagged</option>
                </select>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                />
                <Input
                  inputMode="numeric"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Min $"
                />
                <Input
                  inputMode="numeric"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Max $"
                />
              </div>

              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v as typeof tab);
                  setPage(1);
                }}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="flagged">Flagged</TabsTrigger>
                </TabsList>

                <TabsContent value={tab} className="mt-3">
                  <div className="w-full overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-30 py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            Payout ID
                          </TableHead>
                          <TableHead className="min-w-52.5 py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            User
                          </TableHead>
                          <TableHead className="w-30 py-3 text-right text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            Amount
                          </TableHead>
                          <TableHead className="w-25 py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3] ml-4">
                            Method
                          </TableHead>
                          <TableHead className="w-32.5 py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            Request Date
                          </TableHead>
                          <TableHead className="w-25 py-3 text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            Status
                          </TableHead>
                          <TableHead className="w-35 py-3 pr-6 text-right text-xs font-medium uppercase tracking-wide text-[#895129b3]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isFetching ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              Loading...
                            </TableCell>
                          </TableRow>
                        ) : filtered.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No payout requests found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((p) => (
                            <MotionTableRow
                              key={p._id}
                              whileHover={{ scale: 1.01 }}
                              transition={{ duration: 0.12 }}
                            >
                              <TableCell
                                className="align-middle py-3 font-medium text-xs max-w-[100px] truncate"
                                title={p._id}
                              >
                                {p._id}
                              </TableCell>
                              <TableCell className="min-w-45 align-middle py-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="whitespace-nowrap font-medium leading-none">
                                      {p.user?.name}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {p.user?.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="align-middle py-3 text-right">
                                {formatMoney(p.amount)}
                              </TableCell>
                              <TableCell className="align-middle py-3 text-muted-foreground capitalize ml-4">
                                {p.method}
                              </TableCell>
                              <TableCell className="align-middle py-3 text-muted-foreground">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="align-middle py-3">
                                <motion.div
                                  key={`${p._id}-${p.status}`}
                                  initial={{ opacity: 0.6, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.18 }}
                                  className="inline-block"
                                >
                                  <StatusBadge status={p.status} />
                                </motion.div>
                              </TableCell>
                              <TableCell className="w-35 align-middle py-3 pr-6 text-right">
                                <div className="flex items-center justify-end">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 w-30 justify-between rounded-lg border border-[#89512920] bg-white px-3 text-xs text-[#895129] hover:bg-[#faf7f3]"
                                      >
                                        Actions
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="min-w-40"
                                    >
                                      {(p.status === "pending" ||
                                        p.status === "hold") && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleStatusUpdate(
                                                p._id,
                                                "approved",
                                              )
                                            }
                                          >
                                            Approve
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleStatusUpdate(
                                                p._id,
                                                "rejected",
                                              )
                                            }
                                          >
                                            Reject
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleStatusUpdate(p._id, "hold")
                                            }
                                          >
                                            Hold
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              handleStatusUpdate(
                                                p._id,
                                                "flagged",
                                              )
                                            }
                                          >
                                            Flag
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => setSelected(p)}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </MotionTableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3"
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
                        size="sm"
                        className="h-9 px-3"
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
          </div>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Quick insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Top earning vendors</div>
                <div className="mt-3 space-y-2">
                  {insights.topVendors.length > 0 ? (
                    insights.topVendors.map((v, idx) => (
                      <div
                        key={`${v._id}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="font-medium">{v.user?.name}</div>
                        <div className="text-muted-foreground">
                          {formatMoney(v.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Highest payouts</div>
                <div className="mt-3 space-y-2">
                  {insights.highestPayouts.length > 0 ? (
                    insights.highestPayouts.map((p, idx) => (
                      <div
                        key={`${p._id}-${idx}`}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="font-medium">{p.user?.name}</div>
                        <div className="text-muted-foreground">
                          {formatMoney(p.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[#EEE7DF] p-4">
                <div className="text-sm font-medium">Recent transactions</div>
                <div className="mt-3 space-y-2">
                  {insights.recent.length > 0 ? (
                    insights.recent.map((p, idx) => (
                      <div
                        key={`${p._id}-${idx}`}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <div>
                          <div
                            className="font-medium text-xs truncate max-w-[100px]"
                            title={p._id}
                          >
                            {p._id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.user?.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-muted-foreground">
                            {formatMoney(p.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payout details</DialogTitle>
            <DialogDescription>
              Vendor info, payout info, and commission details.
            </DialogDescription>
          </DialogHeader>

          {!selected ? null : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">User info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Name</div>
                      <div className="font-medium">{selected.user?.name}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{selected.user?.email}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Payout info</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-medium">
                        {formatMoney(selected.amount)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Method</div>
                      <div className="font-medium capitalize">
                        {selected.method}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Request date</div>
                      <div className="font-medium">
                        {new Date(selected.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">Status</div>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Commission info</div>
                  {(() => {
                    const { fee, vendorEarning } = commissionFor(selected);
                    return (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">
                            Platform fee ({Math.round(commissionRate * 100)}%)
                          </div>
                          <div className="font-medium">{formatMoney(fee)}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-muted-foreground">
                            Vendor earning
                          </div>
                          <div className="font-medium">
                            {formatMoney(vendorEarning)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Risk check</div>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="success">Checks passed</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  {(selected.status === "pending" ||
                    selected.status === "hold") && (
                    <>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                        onClick={() =>
                          handleStatusUpdate(selected._id, "approved")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleStatusUpdate(selected._id, "rejected")
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
