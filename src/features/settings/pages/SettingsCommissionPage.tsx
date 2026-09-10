import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Percent,
  UserCheck,
  Briefcase,
  Store,
  Bike,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useGetCommissionQuery,
  useUpdateCommissionMutation,
  type CommissionSettings,
} from "@/services/commissionApi";

type Toast = {
  id: string;
  message: string;
  type: "success" | "error";
};

function ToastNotification({
  toast,
  onClose,
}: {
  toast: Toast | null;
  onClose: () => void;
}) {
  if (!toast) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      className={`flex items-center justify-between rounded-xl border p-4 shadow-md ${
        toast.type === "success"
          ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
          : "border-rose-200 bg-rose-50/90 text-rose-900"
      }`}
    >
      <div className="flex items-center gap-3">
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
        )}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClose}
        className="h-8 px-2 text-xs hover:bg-black/5"
      >
        Dismiss
      </Button>
    </motion.div>
  );
}

export default function SettingsCommissionPage() {
  const { data: response, isLoading, isError, refetch } = useGetCommissionQuery();
  const [updateCommission, { isLoading: isUpdating }] = useUpdateCommissionMutation();

  const [toast, setToast] = useState<Toast | null>(null);

  const [formState, setFormState] = useState<CommissionSettings>({
    customerChargePercentage: 0,
    providerChargePercentage: 0,
    productVendorCommissionPercentage: 0,
    riderCommissionPercentage: 0,
  });

  // Populate form state when data is fetched
  useEffect(() => {
    if (response?.data) {
      setFormState({
        customerChargePercentage: response.data.customerChargePercentage ?? 0,
        providerChargePercentage: response.data.providerChargePercentage ?? 0,
        productVendorCommissionPercentage:
          response.data.productVendorCommissionPercentage ?? 0,
        riderCommissionPercentage: response.data.riderCommissionPercentage ?? 0,
      });
    }
  }, [response]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = String(Date.now());
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3500);
  };

  const handleInputChange = (field: keyof CommissionSettings, value: string) => {
    const numVal = parseFloat(value);
    setFormState((prev) => ({
      ...prev,
      [field]: isNaN(numVal) ? 0 : numVal,
    }));
  };

  const handleReset = () => {
    if (response?.data) {
      setFormState({
        customerChargePercentage: response.data.customerChargePercentage ?? 0,
        providerChargePercentage: response.data.providerChargePercentage ?? 0,
        productVendorCommissionPercentage:
          response.data.productVendorCommissionPercentage ?? 0,
        riderCommissionPercentage: response.data.riderCommissionPercentage ?? 0,
      });
      showToast("Form reset to saved values", "success");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await updateCommission({
        customerChargePercentage: formState.customerChargePercentage,
        providerChargePercentage: formState.providerChargePercentage,
        productVendorCommissionPercentage: formState.productVendorCommissionPercentage,
        riderCommissionPercentage: formState.riderCommissionPercentage,
      }).unwrap();

      showToast(res?.message || "Commission settings updated successfully!", "success");
    } catch (err: any) {
      showToast(
        err?.data?.message || "Failed to update commission settings. Please try again.",
        "error"
      );
    }
  };

  const fields = [
    {
      key: "customerChargePercentage" as keyof CommissionSettings,
      label: "Customer Service Charge",
      description: "Percentage charged to customers on orders or bookings.",
      icon: UserCheck,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      accent: "from-blue-500 to-indigo-600",
    },
    {
      key: "providerChargePercentage" as keyof CommissionSettings,
      label: "Service Provider Commission",
      description: "Platform commission fee deducted from service providers.",
      icon: Briefcase,
      color: "bg-purple-50 text-purple-600 border-purple-200",
      accent: "from-purple-500 to-violet-600",
    },
    {
      key: "productVendorCommissionPercentage" as keyof CommissionSettings,
      label: "Vendor Product Commission",
      description: "Commission rate applied on shop/vendor product sales.",
      icon: Store,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      accent: "from-amber-500 to-orange-600",
    },
    {
      key: "riderCommissionPercentage" as keyof CommissionSettings,
      label: "Delivery Rider Commission",
      description: "Commission rate for delivery driver payouts.",
      icon: Bike,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
      accent: "from-emerald-500 to-teal-600",
    },
  ];

  if (isLoading) {
    return (
      <PageShell title="Commission Settings" description="Manage system-wide commission rates and service fees.">
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Loading commission settings...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell title="Commission Settings" description="Manage system-wide commission rates and service fees.">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-semibold text-rose-900">Failed to load commission settings</h3>
            <p className="mt-1 text-sm text-rose-700">Unable to fetch settings from the server.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4 border-rose-300 text-rose-800">
              <RotateCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Commission Settings" description="Manage system-wide commission rates and service fees.">
      <div className="space-y-6">
        <AnimatePresence>
          <ToastNotification toast={toast} onClose={() => setToast(null)} />
        </AnimatePresence>

        {/* Live Summary Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => {
            const Icon = field.icon;
            const value = formState[field.key];
            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="relative overflow-hidden border-[#EEE7DF] transition-all hover:shadow-soft">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${field.accent}`} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {field.label}
                      </span>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${field.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {value}
                      </span>
                      <span className="text-lg font-semibold text-muted-foreground">%</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-[#EEE7DF]">
            <CardHeader className="border-b border-[#EEE7DF] bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Commission & Fee Structure</CardTitle>
                  <CardDescription>
                    Adjust percentages for charges and commissions across customer, provider, vendor, and rider services.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {fields.map((field) => {
                    const Icon = field.icon;
                    return (
                      <div
                        key={field.key}
                        className="group flex flex-col justify-between rounded-2xl border border-[#EEE7DF] p-5 transition-all hover:border-primary/40 hover:bg-muted/10"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${field.color}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <label htmlFor={field.key} className="text-sm font-semibold text-foreground">
                              {field.label}
                            </label>
                          </div>
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        </div>

                        <div className="mt-4 relative flex items-center">
                          <Input
                            id={field.key}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formState[field.key]}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            className="pr-10 text-base font-semibold transition-all group-hover:border-primary/50"
                            placeholder="0.00"
                            required
                          />
                          <div className="absolute right-3 text-sm font-bold text-muted-foreground pointer-events-none">
                            %
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#EEE7DF] pt-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <HelpCircle className="h-4 w-4 text-muted-foreground/70" />
                    <span>All values are applied as percentage (%) rates.</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={isUpdating}
                      className="border-[#EEE7DF]"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="min-w-32 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          <span>Save Settings</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageShell>
  );
}
