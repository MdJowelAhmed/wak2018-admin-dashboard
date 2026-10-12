import { useState } from "react";
import {
  Send,
  Eye,
  MailCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlignLeft,
  Heading,
  Link2,
  Sparkles,
  Code,
} from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSendTestEmailMutation,
  useBroadcastCampaignMutation,
} from "@/services/newsletterApi";

interface CampaignComposerProps {
  activeSubscribersCount?: number;
  onCampaignBroadcasted?: () => void;
}

const EMAIL_SNIPPETS = [
  {
    label: "Paragraph",
    icon: <AlignLeft className="h-3.5 w-3.5" />,
    content: "<p>Your paragraph text here.</p>",
  },
  {
    label: "Heading",
    icon: <Heading className="h-3.5 w-3.5" />,
    content: "<h2>Special Highlight Title</h2>",
  },
  {
    label: "Button CTA",
    icon: <Link2 className="h-3.5 w-3.5" />,
    content: `<p style="text-align: center; margin: 24px 0;"><a href="https://worthworld.com/products" style="background-color: #895129; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Shop Now</a></p>`,
  },
  {
    label: "Coupon Box",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    content: `<div style="background-color: #fef3c7; border: 1px dashed #f59e0b; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; color: #92400e; margin: 16px 0;">USE COUPON: SAVE40</div>`,
  },
  {
    label: "Divider",
    icon: <Code className="h-3.5 w-3.5" />,
    content: `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />`,
  },
];

export function CampaignComposer({
  activeSubscribersCount = 0,
  onCampaignBroadcasted,
}: CampaignComposerProps) {
  const [subject, setSubject] = useState("Exclusive Weekend Deals 🎉");
  const [title, setTitle] = useState("Save Up to 40% on Popular Items");
  const [content, setContent] = useState(
    `<p>Dear valued customer,</p>\n<p>We are excited to bring you special discounts across all categories this weekend only!</p>\n<p style="text-align: center; margin: 24px 0;">\n  <a href="https://worthworld.com/products" style="background-color: #895129; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Shop Now</a>\n</p>\n<p>Hurry before stock runs out!</p>`,
  );

  const [testEmail, setTestEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [sendTestEmail, { isLoading: isSendingTest }] = useSendTestEmailMutation();
  const [broadcastCampaign, { isLoading: isBroadcasting }] = useBroadcastCampaignMutation();

  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setNotification({
        type: "error",
        message: "Please provide a valid email address for testing.",
      });
      return;
    }

    try {
      const res = await sendTestEmail({
        email: testEmail.trim(),
        subject: subject.trim(),
        title: title.trim(),
        content,
      }).unwrap();

      setNotification({
        type: "success",
        message: res.message || `Test email sent to ${testEmail.trim()}`,
      });
      setShowTestEmailModal(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to send test email.";
      setNotification({ type: "error", message: errorMsg });
    }
  };

  const handleBroadcast = async () => {
    if (!subject.trim() || !title.trim() || !content.trim()) {
      setNotification({
        type: "error",
        message: "Please fill in Subject, Title, and Email Content before broadcasting.",
      });
      return;
    }

    try {
      const res = await broadcastCampaign({
        subject: subject.trim(),
        title: title.trim(),
        content,
      }).unwrap();

      setNotification({
        type: "success",
        message:
          res.message ||
          "Newsletter broadcast initiated and queued successfully in background BullMQ!",
      });
      setShowBroadcastConfirm(false);

      if (onCampaignBroadcasted) {
        onCampaignBroadcasted();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to initiate broadcast campaign.";
      setNotification({ type: "error", message: errorMsg });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* BullMQ Notice Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/60 p-4 text-amber-900 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700">
          <Zap className="h-4.5 w-4.5" />
        </div>
        <div className="text-xs sm:text-sm">
          <p className="font-semibold text-amber-950">
            High-Performance Asynchronous Broadcast via BullMQ
          </p>
          <p className="mt-0.5 text-amber-800">
            Campaigns are pushed into background worker queues and delivered asynchronously.
            Your server stays responsive while emails are sent to all active subscribers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Editor Form Column */}
        <div className="space-y-5 lg:col-span-7">
          <div className="rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-6 shadow-[0_2px_10px_rgba(137,81,41,0.06)]">
            <div className="mb-5 flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Campaign Details</h3>
                <p className="text-xs text-muted-foreground">
                  Draft your message and configure broadcast content
                </p>
              </div>

              {/* Mobile Tab Switcher */}
              <div className="flex items-center rounded-lg border bg-[#faf7f3] p-1 lg:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    activeTab === "edit"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    activeTab === "preview"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Exclusive Weekend Deals 🎉"
                  className="font-medium"
                />
                <p className="text-[11px] text-muted-foreground">
                  Visible in email notification and inbox title.
                </p>
              </div>

              {/* Title / Heading */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Campaign Title / Hero Header <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Save Up to 40% on Popular Items"
                />
                <p className="text-[11px] text-muted-foreground">
                  Featured header at the top of the email body.
                </p>
              </div>

              {/* TipTap Rich Text & HTML Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email HTML Content <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">Supports Visual & HTML tags</span>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Dear valued customer, ..."
                  minHeight={260}
                  maxHeight={500}
                  showWordCount={true}
                  allowSourceToggle={true}
                  snippets={EMAIL_SNIPPETS}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTestEmailModal(true)}
                  className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <MailCheck className="h-4 w-4" />
                  Send Test Preview
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowBroadcastConfirm(true)}
                  disabled={!subject || !title || !content || activeSubscribersCount === 0}
                  className="gap-2 bg-[#895129] text-white hover:bg-[#724220]"
                >
                  <Send className="h-4 w-4" />
                  Broadcast to {activeSubscribersCount.toLocaleString()} Subscribers
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Column */}
        <div
          className={`space-y-4 lg:col-span-5 ${
            activeTab === "edit" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="sticky top-6 rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-5 shadow-[0_2px_10px_rgba(137,81,41,0.06)]">
            <div className="mb-4 flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[#895129]" />
                <h4 className="text-sm font-semibold text-foreground">Live Email Preview</h4>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                HTML Rendered
              </span>
            </div>

            {/* Simulated Email Client Window */}
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100/70 shadow-sm">
              {/* Email Client Header Bar */}
              <div className="border-b border-neutral-200 bg-neutral-200/50 px-4 py-3 text-xs">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>From: Worth World &lt;newsletter@worthworld.com&gt;</span>
                  <span className="font-mono text-[10px]">Just now</span>
                </div>
                <div className="mt-1 font-semibold text-neutral-800">
                  Subject: {subject || "(No Subject)"}
                </div>
              </div>

              {/* Email Content Body */}
              <div className="bg-white p-6">
                <div className="mx-auto max-w-md">
                  {/* Brand Logo Header */}
                  <div className="mb-6 border-b pb-4 text-center">
                    <span className="text-xl font-bold tracking-tight text-[#895129]">
                      WORTH WORLD
                    </span>
                    <p className="text-[11px] text-neutral-400">Exclusive Store Newsletter</p>
                  </div>

                  {/* Title */}
                  <h2 className="mb-4 text-center text-lg font-bold text-neutral-900">
                    {title || "(Campaign Title)"}
                  </h2>

                  {/* HTML Body */}
                  <div
                    className="prose prose-sm max-w-none text-neutral-700"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />

                  {/* Email Footer with Unsubscribe link */}
                  <div className="mt-8 border-t pt-4 text-center text-[10px] text-neutral-400">
                    <p>You received this email because you subscribed to Worth World updates.</p>
                    <p className="mt-1">
                      <span className="text-[#895129] underline">Manage Preferences</span> •{" "}
                      <span className="text-neutral-500 underline">Unsubscribe</span>
                    </p>
                    <p className="mt-2 text-neutral-400">© 2026 Worth World. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Modal */}
      <Dialog open={showTestEmailModal} onOpenChange={setShowTestEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <MailCheck className="h-5 w-5 text-[#895129]" />
              Send Test Email
            </DialogTitle>
            <DialogDescription>
              Preview how this newsletter looks in your inbox before broadcasting to all customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Recipient Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@worthworld.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-xs text-muted-foreground">
              <p>
                <strong>Subject:</strong> {subject}
              </p>
              <p className="mt-1 truncate">
                <strong>Title:</strong> {title}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTestEmailModal(false)}
              disabled={isSendingTest}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="gap-2 bg-[#895129] text-white hover:bg-[#724220]"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Confirmation Modal */}
      <Dialog open={showBroadcastConfirm} onOpenChange={setShowBroadcastConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Zap className="h-5 w-5" />
              Confirm Broadcast Campaign
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground">
              Are you sure you want to broadcast this campaign to{" "}
              <strong>{activeSubscribersCount.toLocaleString()} active subscribers</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-neutral-200 bg-[#faf7f3] p-4 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">Subject:</span>
              <p className="font-semibold text-foreground">{subject}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">Hero Title:</span>
              <p className="font-medium text-foreground">{title}</p>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Target Recipients:
              </span>
              <p className="font-semibold text-emerald-700">
                {activeSubscribersCount.toLocaleString()} active subscribers
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              ⚡ This will enqueue delivery jobs in the background BullMQ queue. The process runs
              asynchronously without blocking the system.
            </div>
          </div>

          <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBroadcastConfirm(false)}
              disabled={isBroadcasting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className="gap-2 bg-[#895129] text-white hover:bg-[#724220]"
            >
              {isBroadcasting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Queueing Broadcast...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Broadcast Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
