import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Shield,
  Clock,
  Copy,
  Check,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/utils";
import {
  useGetDisclaimerQuery,
  useUpdateDisclaimerMutation,
} from "@/services/disclaimerApi";

type DocKey = "terms" | "privacy";

interface DocConfig {
  key: DocKey;
  label: string;
  apiType: "terms-and-conditions" | "privacy-policy";
  icon: typeof FileText;
  description: string;
}

const DOC_CONFIGS: Record<DocKey, DocConfig> = {
  terms: {
    key: "terms",
    label: "Terms & Conditions",
    apiType: "terms-and-conditions",
    icon: FileText,
    description: "Platform usage rules, rights, and user agreements.",
  },
  privacy: {
    key: "privacy",
    label: "Privacy Policy",
    apiType: "privacy-policy",
    icon: Shield,
    description: "Data collection, privacy standards, and compliance policy.",
  },
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
};

function ToastBar({
  toast,
  onClose,
}: {
  toast: Toast | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center justify-between rounded-xl border p-3.5 shadow-soft",
        toast.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900",
      )}
    >
      <div className="flex items-center gap-2.5">
        {toast.type === "success" ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
        )}
        <div className="text-sm font-medium">{toast.message}</div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClose}
        className="h-7 px-2 text-xs hover:bg-black/5"
      >
        Dismiss
      </Button>
    </motion.div>
  );
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Not updated yet";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function SettingsLegalPage() {
  const [toast, setToast] = useState<Toast | null>(null);
  const [tab, setTab] = useState<DocKey>("terms");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const {
    data: termsResponse,
    isLoading: isTermsLoading,
    isFetching: isTermsFetching,
  } = useGetDisclaimerQuery("terms-and-conditions");

  const {
    data: privacyResponse,
    isLoading: isPrivacyLoading,
    isFetching: isPrivacyFetching,
  } = useGetDisclaimerQuery("privacy-policy");

  const [updateDisclaimer, { isLoading: isUpdating }] =
    useUpdateDisclaimerMutation();

  const [drafts, setDrafts] = useState<
    Record<DocKey, { content?: string; version?: string }>
  >({
    terms: {},
    privacy: {},
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    const id = String(Date.now());
    setToast({ id, message, type });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2800);
  }

  const currentConfig = DOC_CONFIGS[tab];
  const currentApiData =
    tab === "terms" ? termsResponse?.data : privacyResponse?.data;
  const isCurrentLoading =
    tab === "terms"
      ? isTermsLoading || isTermsFetching
      : isPrivacyLoading || isPrivacyFetching;

  const currentVersion = drafts[tab].version ?? currentApiData?.version ?? "";
  const currentContent = drafts[tab].content ?? currentApiData?.content ?? "";

  function handleFieldChange(field: "content" | "version", value: string) {
    setDrafts((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    try {
      const res = await updateDisclaimer({
        body: {
          type: currentConfig.apiType,
          content: currentContent,
          version: currentVersion,
        },
      }).unwrap();

      setDrafts((prev) => ({
        ...prev,
        [tab]: {},
      }));

      showToast(
        res.message || `${currentConfig.label} saved successfully`,
        "success",
      );
    } catch {
      showToast("Failed to save changes. Please try again.", "error");
    }
  }

  function handleCopyId(id?: string) {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    window.setTimeout(() => setCopiedId(false), 2000);
  }

  const docSummaries = [
    {
      key: "terms" as const,
      config: DOC_CONFIGS.terms,
      data: termsResponse?.data,
    },
    {
      key: "privacy" as const,
      config: DOC_CONFIGS.privacy,
      data: privacyResponse?.data,
    },
  ];

  return (
    <PageShell
      title="Legal Settings"
      description="Manage platform legal documents and compliance content."
    >
      <div className="space-y-4">
        <AnimatePresence>
          <ToastBar toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        {/* Top summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {docSummaries.map((item, idx) => {
            const isSelected = tab === item.key;
            const Icon = item.config.icon;

            return (
              <motion.button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                whileHover={{ y: -3, scale: 1.005 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="text-left w-full focus:outline-none"
              >
                <Card
                  className={cn(
                    "rounded-2xl border bg-white shadow-soft transition-all duration-200",
                    isSelected
                      ? "border-primary/40 ring-2 ring-primary/20 shadow-md bg-primary/[0.015]"
                      : "border-[#EEE7DF] hover:border-[#EEE7DF]/80 hover:shadow-md",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-foreground">
                          {item.config.label}
                        </CardTitle>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] font-normal text-muted-foreground bg-[#FAF8F5]"
                      >
                        {item.config.apiType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-medium text-foreground">
                        {item.data?.version ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF8F5] px-2 py-0.5 border border-[#EEE7DF]">
                            Version: {item.data.version}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Version: Not set
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Updated {formatDateTime(item.data?.updatedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                />
              </motion.button>
            );
          })}
        </motion.div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main editor area */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="overflow-hidden rounded-2xl border border-[#EEE7DF] bg-white shadow-soft">
              <CardContent className="p-0">
                <div className="border-b border-[#EEE7DF] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {currentConfig.label} Management
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentConfig.description}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setPreviewOpen(true)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={handleSave}
                        disabled={isUpdating || isCurrentLoading}
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {isUpdating ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Tabs
                      value={tab}
                      onValueChange={(v) => setTab(v as DocKey)}
                    >
                      <TabsList className="w-full justify-start">
                        <TabsTrigger value="terms">
                          Terms & Conditions
                        </TabsTrigger>
                        <TabsTrigger value="privacy">
                          Privacy Policy
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value={tab} className="mt-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            <div className="space-y-4 rounded-xl border border-[#EEE7DF] bg-[#FAF8F5]/40 p-4">
                              {/* Version field */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">
                                  Version
                                </label>
                                <Input
                                  value={currentVersion}
                                  onChange={(e) =>
                                    handleFieldChange("version", e.target.value)
                                  }
                                  placeholder="e.g. 1.0.0"
                                  disabled={isCurrentLoading}
                                  className="max-w-xs bg-white"
                                />
                              </div>

                              {/* Content field */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-foreground">
                                    Content
                                  </label>
                                  {isCurrentLoading && (
                                    <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Loading content...
                                    </span>
                                  )}
                                </div>
                                <textarea
                                  value={currentContent}
                                  onChange={(e) =>
                                    handleFieldChange("content", e.target.value)
                                  }
                                  disabled={isCurrentLoading}
                                  rows={14}
                                  placeholder="Enter document content here..."
                                  className="w-full resize-y rounded-xl border border-[#EEE7DF] bg-white p-3.5 font-sans text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
                                />
                              </div>

                              {/* Editor footer */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EEE7DF]/60 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>
                                    Last updated:{" "}
                                    <span className="font-medium text-foreground">
                                      {formatDateTime(currentApiData?.updatedAt)}
                                    </span>
                                  </span>
                                </div>
                                <div>
                                  {currentContent.length} characters
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
            className="hidden lg:block space-y-4"
          >
            <Card className="rounded-2xl border border-[#EEE7DF] bg-white shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Document Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Document ID */}
                <div className="rounded-xl bg-[#FAF8F5] p-3 border border-[#EEE7DF]">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Document ID
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium text-foreground break-all">
                      {currentApiData?._id || "Not assigned"}
                    </span>
                    {currentApiData?._id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyId(currentApiData._id)}
                        className="h-6 w-6 p-0 hover:bg-black/5 shrink-0"
                        title="Copy ID"
                      >
                        {copiedId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className="rounded-xl bg-[#FAF8F5] p-3 border border-[#EEE7DF]">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Type
                  </div>
                  <div className="mt-1 font-mono text-xs font-semibold text-foreground">
                    {currentApiData?.type || currentConfig.apiType}
                  </div>
                </div>

                {/* Version */}
                <div className="rounded-xl bg-[#FAF8F5] p-3 border border-[#EEE7DF]">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Version
                  </div>
                  <div className="mt-1 text-xs font-semibold text-foreground">
                    {currentApiData?.version || currentVersion || "Not specified"}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="rounded-xl bg-[#FAF8F5] p-3 border border-[#EEE7DF]">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    Last Updated
                  </div>
                  <div className="mt-1 text-xs font-medium text-foreground">
                    {formatDateTime(currentApiData?.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>

        {/* Preview dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <currentConfig.icon className="h-5 w-5 text-primary" />
                Preview: {currentConfig.label}
              </DialogTitle>
              <DialogDescription>
                Version: {currentVersion || "N/A"} • Last Updated:{" "}
                {formatDateTime(currentApiData?.updatedAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-[#EEE7DF] bg-[#FAF8F5] p-4">
              {currentContent ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-sans">
                  {currentContent}
                </div>
              ) : (
                <div className="text-sm italic text-muted-foreground text-center py-6">
                  No content written yet.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
