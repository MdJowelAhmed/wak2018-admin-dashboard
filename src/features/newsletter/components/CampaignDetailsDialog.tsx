import { useState } from "react";
import { format } from "date-fns";
import {
  User,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Code,
  Eye,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useGetCampaignDetailsQuery } from "@/services/newsletterApi";
import type { INewsletterCampaign } from "@/types/newsletter";

interface CampaignDetailsDialogProps {
  campaignId: string | null;
  onClose: () => void;
}

export function CampaignDetailsDialog({ campaignId, onClose }: CampaignDetailsDialogProps) {
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const { data: response, isLoading } = useGetCampaignDetailsQuery(campaignId || "", {
    skip: !campaignId,
  });

  const campaign: INewsletterCampaign | undefined = response?.data;

  const total = campaign?.totalRecipients || 0;
  const sent = campaign?.sentCount || 0;
  const failed = campaign?.failedCount || 0;
  const percentComplete = total > 0 ? Math.round((sent / total) * 100) : 0;

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed
          </Badge>
        );
      case "sending":
        return (
          <Badge variant="warning" className="gap-1.5">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            Sending...
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="danger" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Draft"}</Badge>;
    }
  };

  const senderName =
    typeof campaign?.sentBy === "object" && campaign?.sentBy
      ? campaign.sentBy.name || campaign.sentBy.email
      : typeof campaign?.sentBy === "string"
        ? campaign.sentBy
        : "Administrator";

  const senderEmail =
    typeof campaign?.sentBy === "object" && campaign?.sentBy ? campaign.sentBy.email : "";

  let formattedDate = "-";
  if (campaign?.sentAt || campaign?.createdAt) {
    try {
      formattedDate = format(
        new Date(campaign.sentAt || campaign.createdAt),
        "MMMM d, yyyy • h:mm a",
      );
    } catch {
      formattedDate = campaign.sentAt || campaign.createdAt;
    }
  }

  return (
    <Dialog open={!!campaignId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {campaign?.subject || "Campaign Details"}
              </DialogTitle>
              <p className="mt-1 text-sm text-muted-foreground">{campaign?.title}</p>
            </div>
            {getStatusBadge(campaign?.status)}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#895129]" />
          </div>
        ) : !campaign ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Campaign details not found.
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Delivery Stats Bar */}
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[rgba(137,81,41,0.12)] bg-[#faf7f3] p-4 sm:grid-cols-3">
              <div>
                <span className="text-xs text-muted-foreground">Total Recipients</span>
                <p className="text-xl font-bold text-foreground">
                  {total.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Successfully Delivered</span>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-emerald-700">
                    {sent.toLocaleString()}
                  </p>
                  <span className="text-xs font-semibold text-emerald-600">
                    ({percentComplete}%)
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Delivery Failures</span>
                <p className="text-xl font-bold text-rose-600">
                  {failed.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Delivery Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress: {sent} of {total} sent</span>
                <span>{percentComplete}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-1 gap-4 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#895129]" />
                <span>
                  Dispatched by: <strong className="text-foreground">{senderName}</strong>
                  {senderEmail && ` (${senderEmail})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#895129]" />
                <span>
                  Date: <strong className="text-foreground">{formattedDate}</strong>
                </span>
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-semibold text-foreground">Email Content Body</h4>
                <div className="flex items-center rounded-lg border bg-[#faf7f3] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("rendered")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                      viewMode === "rendered"
                        ? "bg-white text-foreground shadow-xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("raw")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
                      viewMode === "raw"
                        ? "bg-white text-foreground shadow-xs"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    Raw HTML
                  </button>
                </div>
              </div>

              {viewMode === "rendered" ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
                  <h3 className="mb-4 text-center text-lg font-bold text-neutral-900">
                    {campaign.title}
                  </h3>
                  <div
                    className="prose prose-sm max-w-none text-neutral-800"
                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                  />
                </div>
              ) : (
                <pre className="max-h-60 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-900 p-4 font-mono text-xs text-neutral-100">
                  {campaign.content}
                </pre>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
