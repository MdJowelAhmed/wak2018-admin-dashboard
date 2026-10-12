import { useState, useId } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
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
import { SectionPagination } from "@/components/shared/SectionPagination";
import { useGetCampaignsQuery } from "@/services/newsletterApi";
import { CampaignDetailsDialog } from "./CampaignDetailsDialog";

export function CampaignHistoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const searchInputId = useId();
  const statusFilterId = useId();

  const {
    data: campaignsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCampaignsQuery({
    page,
    limit: pageSize,
    searchTerm: searchTerm.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const campaigns = campaignsResponse?.data ?? [];
  const pagination = campaignsResponse?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPage: 1,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case "sending":
        return (
          <Badge variant="warning" className="gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            Sending...
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="danger" className="gap-1.5 font-medium">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Draft"}</Badge>;
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
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-4 shadow-[0_2px_10px_rgba(137,81,41,0.04)] md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={searchInputId}
              type="text"
              placeholder="Search campaigns by subject or title..."
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
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="sending">Sending</option>
              <option value="failed">Failed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-2 md:border-t-0 md:pt-0">
          <span className="text-xs text-muted-foreground">
            Total Campaigns: <strong>{pagination.total}</strong>
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

      {/* Campaigns Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white shadow-[0_2px_10px_rgba(137,81,41,0.06)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#faf7f3]/60 hover:bg-[#faf7f3]/60">
              <TableHead className="w-[320px]">Campaign Subject & Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery Performance</TableHead>
              <TableHead>Dispatched By</TableHead>
              <TableHead>Date Sent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-20 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-28 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto h-8 w-16 animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <Send className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                      No broadcast campaigns yet
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "No campaigns matched your current search criteria."
                        : "Broadcast your first newsletter campaign to reach your customers."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => {
                const total = campaign.totalRecipients || 0;
                const sent = campaign.sentCount || 0;
                const percent = total > 0 ? Math.round((sent / total) * 100) : 0;

                const senderName =
                  typeof campaign.sentBy === "object" && campaign.sentBy
                    ? campaign.sentBy.name || campaign.sentBy.email
                    : typeof campaign.sentBy === "string"
                      ? campaign.sentBy
                      : "Admin";

                let formattedDate = "-";
                if (campaign.sentAt || campaign.createdAt) {
                  try {
                    formattedDate = format(
                      new Date(campaign.sentAt || campaign.createdAt),
                      "MMM d, yyyy • h:mm a",
                    );
                  } catch {
                    formattedDate = campaign.sentAt || campaign.createdAt;
                  }
                }

                return (
                  <TableRow key={campaign._id} className="hover:bg-[#faf7f3]/40">
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{campaign.subject}</p>
                        <p className="text-xs text-muted-foreground">{campaign.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-foreground">
                            {sent.toLocaleString()}/{total.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        {campaign.failedCount > 0 && (
                          <p className="text-[10px] text-rose-500">
                            {campaign.failedCount} failed
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{senderName}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCampaignId(campaign._id)}
                        className="gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPage > 1 && (
        <SectionPagination
          page={page}
          totalPages={pagination.totalPage}
          pageNumbers={pageNumbers}
          onChangePage={(newPage) => setPage(newPage)}
        />
      )}

      {/* Campaign Details Dialog */}
      <CampaignDetailsDialog
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />
    </div>
  );
}
