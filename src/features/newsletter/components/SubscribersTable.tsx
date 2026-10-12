import { useState, useId } from "react";
import { format } from "date-fns";
import {
  Search,
  Trash2,
  Copy,
  Check,
  Mail,
  AlertCircle,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionPagination } from "@/components/shared/SectionPagination";
import {
  useGetSubscribersQuery,
  useDeleteSubscriberMutation,
} from "@/services/newsletterApi";
import type { ISubscriber } from "@/types/newsletter";

export function SubscribersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [sortOrder, setSortOrder] = useState<string>("-createdAt");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [subscriberToDelete, setSubscriberToDelete] = useState<ISubscriber | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const searchInputId = useId();
  const statusFilterId = useId();
  const sortOrderId = useId();

  const {
    data: subscribersResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetSubscribersQuery({
    page,
    limit: pageSize,
    searchTerm: searchTerm.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort: sortOrder,
  });

  const [deleteSubscriber, { isLoading: isDeleting }] = useDeleteSubscriberMutation();

  const subscribers = subscribersResponse?.data ?? [];
  const pagination = subscribersResponse?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPage: 1,
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!subscriberToDelete) return;
    try {
      const res = await deleteSubscriber(subscriberToDelete._id).unwrap();
      setFeedbackMessage({
        type: "success",
        text: res.message || `Subscriber ${subscriberToDelete.email} removed successfully.`,
      });
      setSubscriberToDelete(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to delete subscriber.";
      setFeedbackMessage({ type: "error", text: errorMsg });
    }
  };

  const pageNumbers = Array.from(
    { length: Math.min(5, pagination.totalPage) },
    (_, i) => {
      const start = Math.max(1, Math.min(page - 2, pagination.totalPage - 4));
      return start + i;
    },
  ).filter((p) => p <= pagination.totalPage && p >= 1);

  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition-all ${
            feedbackMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
              : "border-rose-200 bg-rose-50/90 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-4 shadow-[0_2px_10px_rgba(137,81,41,0.04)] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Search by email or source..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              id={statusFilterId}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "unsubscribed");
                setPage(1);
              }}
              className="h-9 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="unsubscribed">Unsubscribed Only</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              id={sortOrderId}
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="email">Email (A-Z)</option>
              <option value="-email">Email (Z-A)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-2 md:border-t-0 md:pt-0">
          <span className="text-xs text-muted-foreground">
            Total: <strong>{pagination.total}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white shadow-[0_2px_10px_rgba(137,81,41,0.06)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#faf7f3]/60 hover:bg-[#faf7f3]/60">
              <TableHead className="w-[300px]">Email Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-8 w-8 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                      No subscribers found
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "Try clearing your filters or search query to find more subscribers."
                        : "Subscribers who sign up on the storefront will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((subscriber) => {
                const isActive = subscriber.status === "active";
                let formattedDate = "-";
                try {
                  const dateVal = subscriber.subscribedAt || subscriber.createdAt;
                  if (dateVal) {
                    formattedDate = format(new Date(dateVal), "MMM d, yyyy • h:mm a");
                  }
                } catch {
                  formattedDate = subscriber.subscribedAt || subscriber.createdAt || "-";
                }

                return (
                  <TableRow key={subscriber._id} className="hover:bg-[#faf7f3]/40">
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{subscriber.email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(subscriber.email, subscriber._id)}
                          className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Copy email"
                        >
                          {copiedId === subscriber._id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge variant="success" className="gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Unsubscribed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
                        {subscriber.source || "organic"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubscriberToDelete(subscriber)}
                        className="h-8 w-8 p-0 text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        title="Delete subscriber"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination.totalPage > 1 && (
        <SectionPagination
          page={page}
          totalPages={pagination.totalPage}
          pageNumbers={pageNumbers}
          onChangePage={(newPage) => setPage(newPage)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!subscriberToDelete}
        onOpenChange={(open) => !open && setSubscriberToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Delete Subscriber
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{subscriberToDelete?.email}</strong> from your
              newsletter subscriber list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setSubscriberToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Subscriber
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
