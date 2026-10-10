import { useEffect, useMemo, useState } from "react";
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

function apiOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
  try {
    return new URL(base).origin;
  } catch {
    return base.replace(/\/api\/v1\/?$/, "");
  }
}

function rewriteLocalhost(url: string, origin: string) {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "0.0.0.0"
    ) {
      return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }
  return url;
}

function candidateDocumentUrls(doc: VerificationDocument) {
  const origin = apiOrigin();
  const raw = doc.url?.trim() || "";
  const urls: string[] = [];
  const push = (value: string) => {
    if (value && !urls.includes(value)) urls.push(value);
  };

  let search = "";
  if (raw.includes("?")) search = raw.slice(raw.indexOf("?"));

  if (/^https?:\/\//i.test(raw)) {
    push(rewriteLocalhost(raw, origin));
    push(raw);
  } else if (raw) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    push(`${origin}${path}`);
    if (!path.startsWith("/documents/") && !path.startsWith("/api/")) {
      push(`${origin}/documents${path.split("?")[0]}${search}`);
    }
  }

  if (doc.key) {
    const key = doc.key.replace(/^\/+/, "");
    push(`${origin}/documents/${key}${search}`);
    push(`${origin}/api/v1/documents/${key}${search}`);
  }

  return urls;
}

function previewKind(blobType: string, doc: VerificationDocument) {
  const hint = `${doc.key || ""} ${doc.url || ""}`.split("?")[0].toLowerCase();
  if (blobType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(hint)) {
    return "image" as const;
  }
  if (blobType.includes("pdf") || hint.endsWith(".pdf")) return "pdf" as const;
  return "other" as const;
}

function DocumentPreview({ doc }: { doc: VerificationDocument }) {
  const urls = useMemo(() => candidateDocumentUrls(doc), [doc]);
  const directUrl = urls[0] || "";
  const directKind = previewKind("", doc);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const [blobKind, setBlobKind] = useState<"image" | "pdf" | "other" | null>(
    null,
  );
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setBlobSrc(null);
    setBlobKind(null);
    setFailed(false);
    setLoadingBlob(false);
  }, [directUrl]);

  useEffect(() => {
    if (!loadingBlob) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const token = localStorage.getItem("admin_token");

    async function load() {
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!response.ok) continue;
          const blob = await response.blob();
          const type = blob.type || "";
          if (!blob.size || type.includes("json") || type.includes("html")) continue;
          objectUrl = URL.createObjectURL(blob);
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          setBlobKind(previewKind(type, doc));
          setBlobSrc(objectUrl);
          setFailed(false);
          return;
        } catch {
          continue;
        }
      }
      if (!cancelled) setFailed(true);
    }

    load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc, loadingBlob, urls]);

  const src = blobSrc || directUrl;
  const kind = blobKind || directKind;

  return (
    <div className="overflow-hidden rounded-lg border border-[#EEE7DF]">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEE7DF] px-4 py-2">
        <span className="text-sm font-medium uppercase">{formatLabel(doc.type)}</span>
        {directUrl && (
          <a
            href={directUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#895129] underline"
          >
            Open
          </a>
        )}
      </div>
      <div className="flex h-72 w-full items-center justify-center overflow-hidden bg-[#faf7f3]">
        {loadingBlob && !blobSrc && !failed && (
          <span className="text-sm text-muted-foreground">
            Loading document...
          </span>
        )}
        {failed && (
          <span className="px-4 text-center text-sm text-muted-foreground">
            Document could not be loaded.
          </span>
        )}
        {!failed && src && !(loadingBlob && !blobSrc) && kind === "image" && (
          <img
            src={src}
            alt={formatLabel(doc.type)}
            className="h-full w-full object-contain"
            onError={() => {
              if (!blobSrc) setLoadingBlob(true);
              else setFailed(true);
            }}
          />
        )}
        {!failed && src && kind !== "image" && (
          <iframe title={doc.type} src={src} className="h-full w-full" />
        )}
      </div>
    </div>
  );
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
                    <DocumentPreview key={`${doc.key}-${doc.type}`} doc={doc} />
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
