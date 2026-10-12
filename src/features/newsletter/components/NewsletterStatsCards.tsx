import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Send } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import type { INewsletterStats } from "@/types/newsletter";

interface NewsletterStatsCardsProps {
  stats?: INewsletterStats;
  isLoading: boolean;
}

export function NewsletterStatsCards({ stats, isLoading }: NewsletterStatsCardsProps) {
  const total = stats?.totalSubscribers ?? 0;
  const active = stats?.activeSubscribers ?? 0;
  const unsubscribed = stats?.unsubscribedSubscribers ?? 0;
  const campaigns = stats?.totalCampaigns ?? 0;

  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0;
  const unsubscribedPercent = total > 0 ? Math.round((unsubscribed / total) * 100) : 0;

  const cards = [
    {
      title: "Total Subscribers",
      value: total,
      subtext: "All registered email contacts",
      icon: Users,
      badgeText: "Audience",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      accentBg: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Active Subscribers",
      value: active,
      subtext: `${activePercent}% of total audience eligible`,
      icon: UserCheck,
      badgeText: `${activePercent}% Active`,
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Unsubscribed",
      value: unsubscribed,
      subtext: `${unsubscribedPercent}% opt-out rate`,
      icon: UserX,
      badgeText: "Opted out",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      accentBg: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Total Broadcasts",
      value: campaigns,
      subtext: "Sent or active campaigns",
      icon: Send,
      badgeText: "Campaigns",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      accentBg: "bg-purple-500/10 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: idx * 0.06 }}
          className="group relative overflow-hidden rounded-2xl border border-[rgba(137,81,41,0.12)] bg-white p-5 shadow-[0_2px_10px_rgba(137,81,41,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(137,81,41,0.12)]"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.accentBg}`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
              ) : (
                <AnimatedNumber value={card.value} />
              )}
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${card.badgeClass}`}
            >
              {card.badgeText}
            </span>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">{card.subtext}</p>
        </motion.div>
      ))}
    </div>
  );
}
