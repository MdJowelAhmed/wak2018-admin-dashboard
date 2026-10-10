import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetVerificationRequestByIdQuery,
  useGetVerificationRequestsQuery,
  useUpdateVerificationRequestStatusMutation,
} from "@/services/verificationApi";
import type {
  VerificationDocument,
  VerificationRequest,
  VerificationStatus,
  VerificationType,
  VerificationUser,
} from "@/types/verification";

function getApiErrorMessage(err: unknown) {
  if (typeof err === "object" && err && "data" in err) {
    const message = (err as { data?: { message?: string } }).data?.message;
    if (message) return message;
  }
  return "Failed to update verification status.";
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

function isUser(user: VerificationRequest["user"]): user is VerificationUser {
  return !!user && typeof user === "object";
}

function userName(request: VerificationRequest) {
  if (isUser(request.user)) return request.user.name || "Unknown user";
  return "Unknown user";
}

function userEmail(request: VerificationRequest) {
  if (isUser(request.user)) return request.user.email || "—";
  return "—";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge variant="success">Approved</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function isImageDocument(doc: VerificationDocument) {
  const source = `${doc.key} ${doc.url}`.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(source);
}

export default function VerificationRequestsPage() {
  const [status, setStatus] = useState<VerificationStatus | "all">("all");
  const [type, setType] = useState<VerificationType | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      status,
      type,
    }),
    [page, status, type],
  );

  const { data: response, isFetching } =
    useGetVerificationRequestsQuery(queryParams);
  const { data: detailResponse, isFetching: isFetchingDetails } =
    useGetVerificationRequestByIdQuery(selectedId || "", {
      skip: !selectedId,
    });
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateVerificationRequestStatusMutation();

  const requests = response?.data || [];
  const pagination = response?.pagination;
  const totalPages = pagination?.totalPage || 1;
  const selected = detailResponse?.data;

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    const nums: number[] = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [page, totalPages]);

  async function handleDecision(next: "approved" | "rejected") {
    if (!selectedId) return;
    setActionError(null);
    try {
      await updateStatus({ id: selectedId, status: next }).unwrap();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  }

  return (
    <PageShell
      title="Verifications"
      description="Review vendor and rider KYC documents, then approve or reject the request."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Total Requests", value: pagination?.total || 0 },
            { label: "Current Page", value: page },
            { label: "Total Pages", value: totalPages },
          ].map((item) => (
            <Card key={item.label} className="border-[#EEE7DF] shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{item.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-[#EEE7DF] shadow-soft">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Verification requests</CardTitle>
            <div className="text-sm text-muted-foreground">
              {pagination?.total || 0} results
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as VerificationStatus | "all");
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Status: all</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as VerificationType | "all");
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-[#EEE7DF] bg-white px-3 text-sm"
              >
                <option value="all">Type: all</option>
                <option value="vendor">Vendor</option>
                <option value="rider">Rider</option>
              </select>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setStatus("all");
                    setType("all");
                    setPage(1);
                  }}
                >
                  Reset filters
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="min-w-32 pr-6 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No verification requests match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell>
                        <div className="font-medium">{userName(request)}</div>
                        <div className="text-xs text-muted-foreground">
                          {userEmail(request)}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {formatLabel(request.type)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 rounded-xl border border-[#89512925] bg-white hover:border-[#89512940] hover:bg-[#faf7f3]"
                          onClick={() => {
                            setActionError(null);
                            setSelectedId(request._id);
                          }}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Review
                        </Button>
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open && !isUpdating) {
            setSelectedId(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review verification</DialogTitle>
            <DialogDescription>
              Documents are private and open through a temporary secure link.
            </DialogDescription>
          </DialogHeader>

          {isFetchingDetails ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading documents...
            </div>
          ) : !selected ? (
            <div className="py-12 text-center text-muted-foreground">
              Request details are unavailable.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Applicant</div>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="font-medium">{userName(selected)}</div>
                    <div className="text-muted-foreground">
                      {userEmail(selected)}
                    </div>
                    {isUser(selected.user) && selected.user.phone && (
                      <div className="text-muted-foreground">
                        {selected.user.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-[#EEE7DF] p-4">
                  <div className="text-sm font-medium">Request</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">
                        {formatLabel(selected.type)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Documents</div>
                {(selected.documents || []).length === 0 ? (
                  <div className="rounded-lg border border-[#EEE7DF] p-4 text-sm text-muted-foreground">
                    No documents were attached to this request.
                  </div>
                ) : (
                  selected.documents?.map((doc) => (
                    <div
                      key={`${doc.key}-${doc.type}`}
                      className="overflow-hidden rounded-lg border border-[#EEE7DF]"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DF] px-4 py-2">
                        <span className="text-sm font-medium uppercase">
                          {formatLabel(doc.type)}
                        </span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-[#895129] underline"
                        >
                          Open
                        </a>
                      </div>
                      {isImageDocument(doc) ? (
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="max-h-80 w-full bg-[#faf7f3] object-contain"
                        />
                      ) : (
                        <iframe
                          title={doc.type}
                          src={doc.url}
                          className="h-80 w-full bg-[#faf7f3]"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {actionError && (
                <p className="text-sm text-red-600">{actionError}</p>
              )}

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => setSelectedId(null)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  disabled={isUpdating || selected.status !== "pending"}
                  onClick={() => handleDecision("rejected")}
                >
                  Reject
                </Button>
                <Button
                  disabled={isUpdating || selected.status !== "pending"}
                  onClick={() => handleDecision("approved")}
                >
                  {isUpdating ? "Updating..." : "Approve"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
