import { useState } from "react";
import {
  Send,
  Users,
  History,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsletterStatsCards } from "../components/NewsletterStatsCards";
import { SubscribersTable } from "../components/SubscribersTable";
import { CampaignComposer } from "../components/CampaignComposer";
import { CampaignHistoryTable } from "../components/CampaignHistoryTable";
import { useGetNewsletterStatsQuery } from "@/services/newsletterApi";

export default function NewsletterPage() {
  const [activeTab, setActiveTab] = useState("subscribers");

  const {
    data: statsResponse,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
    refetch: refetchStats,
  } = useGetNewsletterStatsQuery();

  const stats = statsResponse?.data;

  return (
    <PageShell
      title="Newsletter & Campaigns"
      description="Manage customer subscriptions, dispatch newsletters asynchronously, and track delivery metrics."
      right={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStats()}
            disabled={isFetchingStats}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isFetchingStats ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setActiveTab("composer")}
            className="gap-2 bg-[#895129] text-white hover:bg-[#724220]"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Broadcast</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <NewsletterStatsCards stats={stats} isLoading={isLoadingStats} />

        {/* Tabbed Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between border-b border-[rgba(137,81,41,0.12)] pb-2">
            <TabsList className="bg-[#faf7f3]">
              <TabsTrigger value="subscribers" className="gap-2">
                <Users className="h-4 w-4" />
                <span>Subscribers List</span>
                {stats?.totalSubscribers !== undefined && (
                  <span className="rounded-full bg-black/5 px-1.5 py-0.2 text-xs font-semibold text-foreground">
                    {stats.totalSubscribers}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger value="composer" className="gap-2">
                <Send className="h-4 w-4" />
                <span>Compose Broadcast</span>
              </TabsTrigger>

              <TabsTrigger value="campaigns" className="gap-2">
                <History className="h-4 w-4" />
                <span>Campaign History</span>
                {stats?.totalCampaigns !== undefined && (
                  <span className="rounded-full bg-black/5 px-1.5 py-0.2 text-xs font-semibold text-foreground">
                    {stats.totalCampaigns}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="m-0">
            <SubscribersTable />
          </TabsContent>

          {/* Composer Tab */}
          <TabsContent value="composer" className="m-0">
            <CampaignComposer
              activeSubscribersCount={stats?.activeSubscribers ?? 0}
              onCampaignBroadcasted={() => {
                refetchStats();
                setActiveTab("campaigns");
              }}
            />
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="m-0">
            <CampaignHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
