import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { adminMenu } from "@/layouts/adminMenu";
import { cn, getImageUrl } from "@/utils/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { markAllRead } from "@/app/notifications/notificationsSlice";
import { useGetProfileQuery } from "@/services/userApi";
const COLLAPSE_KEY = "admin_sidebar_collapsed";
const SETTINGS_OPEN_KEY = "admin_sidebar_settings_open";
const VENDORS_OPEN_KEY = "admin_sidebar_vendors_open";
const SHOP_OPEN_KEY = "admin_sidebar_shop_open";

function adminBreadcrumbItems(
  pathname: string,
): { label: string; to?: string }[] {
  if (pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  const driversList = "/admin/vendors/delivery-drivers";
  if (pathname.startsWith(`${driversList}/`)) {
    return [
      { label: "Dashboard", to: "/" },
      { label: "Vendors", to: "/admin/vendors" },
      { label: "Delivery Drivers", to: driversList },
      { label: "Details" },
    ];
  }
  if (pathname === driversList) {
    return [
      { label: "Dashboard", to: "/" },
      { label: "Vendors", to: "/admin/vendors" },
      { label: "Delivery Drivers" },
    ];
  }
  if (pathname === "/admin/vendors") {
    return [{ label: "Dashboard", to: "/" }, { label: "Vendors" }];
  }

  const spBase = "/admin/service-providers";
  if (pathname.startsWith(`${spBase}/`) && pathname !== `${spBase}/`) {
    return [
      { label: "Dashboard", to: "/" },
      { label: "Service Providers", to: spBase },
      { label: "Details" },
    ];
  }
  if (pathname === spBase) {
    return [{ label: "Dashboard", to: "/" }, { label: "Service Providers" }];
  }

  if (pathname === "/admin/categories") {
    return [
      { label: "Dashboard", to: "/" },
      { label: "Products", to: "/products" },
      { label: "Categories" },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? pathname;
  const label = last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return [{ label: "Dashboard", to: "/" }, { label: label }];
}

function SidebarTooltip({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (!collapsed) return null;
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#EEE7DF] bg-white px-2.5 py-1 text-xs text-foreground shadow-soft opacity-0 transition-opacity group-hover:opacity-100 ml-2">
      {label}
    </span>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);
  const { data: profileResponse } = useGetProfileQuery();
  const userProfile = profileResponse?.data;
  const firstName = userProfile?.name?.split(" ")[0] || "Admin";
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const unreadByKind = useMemo(() => {
    return {
      support: notifications.some((n) => !n.read && n.kind === "message"),
      orders: notifications.some((n) => !n.read && n.kind === "order"),
      delivery: notifications.some((n) => !n.read && n.kind === "delivery"),
    };
  }, [notifications]);

  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/login");
  };

  const [collapsed, setCollapsed] = useState(() => {
    const raw = localStorage.getItem(COLLAPSE_KEY);
    return raw === "1";
  });

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(() => {
    const inSettings = location.pathname.startsWith("/settings");
    if (inSettings) return true;
    const raw = localStorage.getItem(SETTINGS_OPEN_KEY);
    return raw !== "0";
  });

  const [vendorsOpen, setVendorsOpen] = useState(() => {
    const inVendors = location.pathname.startsWith("/admin/vendors");
    if (inVendors) return true;
    const raw = localStorage.getItem(VENDORS_OPEN_KEY);
    return raw !== "0";
  });

  const [shopOpen, setShopOpen] = useState(() => {
    const inShop =
      location.pathname.startsWith("/admin/categories") ||
      location.pathname.startsWith("/products") ||
      location.pathname.startsWith("/shop");
    if (inShop) return true;
    const raw = localStorage.getItem(SHOP_OPEN_KEY);
    return raw !== "0";
  });

  useEffect(() => {
    const inSettings = location.pathname.startsWith("/settings");
    if (!inSettings) return;
    const t = window.setTimeout(() => setSettingsOpen(true), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const inVendors = location.pathname.startsWith("/admin/vendors");
    if (!inVendors) return;
    const t = window.setTimeout(() => setVendorsOpen(true), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const inShop =
      location.pathname.startsWith("/admin/categories") ||
      location.pathname.startsWith("/products") ||
      location.pathname.startsWith("/shop");
    if (!inShop) return;
    const t = window.setTimeout(() => setShopOpen(true), 0);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    // collapse settings / vendors menus by default on small screens when not on those routes
    const mql = window.matchMedia("(max-width: 767px)");
    const handle = () => {
      setIsMobile(mql.matches);
      if (!location.pathname.startsWith("/settings") && mql.matches)
        setSettingsOpen(false);
      if (!location.pathname.startsWith("/admin/vendors") && mql.matches)
        setVendorsOpen(false);
      const inShopRoute =
        location.pathname.startsWith("/admin/categories") ||
        location.pathname.startsWith("/products") ||
        location.pathname.startsWith("/shop");
      if (!inShopRoute && mql.matches) setShopOpen(false);
    };
    handle();
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, [location.pathname]);

  const sidebarWidth = isMobile ? 300 : collapsed ? 88 : 292;

  const sectionedMenu = useMemo(() => {
    const isLink = (
      i: (typeof adminMenu)[number],
    ): i is Extract<(typeof adminMenu)[number], { to: string }> =>
      !("children" in i);

    const links = adminMenu.filter(isLink);
    const settingsGroup = adminMenu.find(
      (i) => "children" in i && i.key === "settings",
    );
    const vendorsGroup = adminMenu.find(
      (i) => "children" in i && i.key === "vendors",
    );
    const shopGroup = adminMenu.find(
      (i) => "children" in i && i.key === "shop",
    );

    const mainKeys = new Set(["dashboard", "users"]);
    const managementLinkOrder = [
      "categories",
      "service_providers",
      // "services",
      "orders",
      "delivery",
      "payouts",
      "hero",
      "support",
    ] as const;
    const sysKeys = new Set(["analytics"]);

    const main = links.filter((l) => mainKeys.has(l.key));
    const managementLinks = managementLinkOrder
      .map((key) => links.find((l) => l.key === key))
      .filter((l): l is NonNullable<(typeof links)[number]> => Boolean(l));
    const system = links.filter((l) => sysKeys.has(l.key));
    return {
      main,
      managementLinks,
      system,
      vendors: vendorsGroup && "children" in vendorsGroup ? vendorsGroup : null,
      shop: shopGroup && "children" in shopGroup ? shopGroup : null,
      settings:
        settingsGroup && "children" in settingsGroup ? settingsGroup : null,
    };
  }, []);

  const breadcrumbItems = useMemo(
    () => adminBreadcrumbItems(location.pathname),
    [location.pathname],
  );

  useEffect(() => {
    // close mobile drawer on navigation
    if (!isMobile) return;
    const t = window.setTimeout(() => setMobileOpen(false), 0);
    return () => window.clearTimeout(t);
  }, [isMobile, location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen border-r border-[#EEE7DF] bg-[#faf9f7] shadow-sm flex flex-col overflow-hidden",
          "supports-backdrop-filter:bg-[#faf9f7]/90 supports-backdrop-filter:backdrop-blur",
        )}
        animate={{
          width: sidebarWidth,
          x: isMobile ? (mobileOpen ? 0 : -sidebarWidth - 12) : 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "flex items-center gap-3",
              collapsed && !isMobile && "justify-center",
            )}
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              className="relative grid h-10 w-10 place-items-center rounded-xl bg-primary text-white font-semibold shadow-sm"
            >
              <span className="absolute inset-0 rounded-xl bg-primary blur-md opacity-25" />
              W
            </motion.div>
            {(!collapsed || isMobile) && (
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-foreground">
                  wak2018
                </div>
                <div className="text-xs text-muted-foreground">Admin Panel</div>
              </div>
            )}
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isMobile) {
                setMobileOpen(false);
                return;
              }
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
            }}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll">
          <nav className="px-3 py-2">
            <div className="space-y-5">
              {/* MAIN */}
              <div className="space-y-2">
                {(!collapsed || isMobile) && (
                  <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                    MAIN
                  </div>
                )}
                <div className="space-y-1">
                  {sectionedMenu.main.map((item) => {
                    const Icon = item.icon;
                    const showDot =
                      (item.key === "support" && unreadByKind.support) ||
                      (item.key === "orders" && unreadByKind.orders) ||
                      (item.key === "delivery" && unreadByKind.delivery);
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                            "hover:bg-[#895129]/5 hover:text-[#895129]",
                            isActive &&
                              "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                            collapsed && !isMobile && "justify-center px-2",
                          )
                        }
                        title={collapsed && !isMobile ? item.label : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.span
                                layoutId="sidebar-active-indicator-main"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                              />
                            )}
                            <motion.span
                              whileHover={{ x: 4, scale: 1.01 }}
                              className="flex items-center gap-3 group-hover:translate-x-1"
                            >
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={cn(
                                  "relative",
                                  isActive
                                    ? "text-[#895129]"
                                    : "text-muted-foreground group-hover:text-[#895129]",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {showDot && (
                                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                )}
                              </motion.span>
                              {(!collapsed || isMobile) && (
                                <span>{item.label}</span>
                              )}
                            </motion.span>
                            <SidebarTooltip
                              label={item.label}
                              collapsed={collapsed && !isMobile}
                            />
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* MANAGEMENT */}
              <div className="space-y-2">
                {(!collapsed || isMobile) && (
                  <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                    MANAGEMENT
                  </div>
                )}
                <div className="space-y-1">
                  {/* Vendors accordion */}
                  {sectionedMenu.vendors && (
                    <div className="space-y-1">
                      {(() => {
                        const item = sectionedMenu.vendors;
                        const Icon = item.icon;
                        const isActive =
                          location.pathname.startsWith("/admin/vendors");
                        const open = vendorsOpen && (!collapsed || isMobile);
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !vendorsOpen;
                                setVendorsOpen(next);
                                localStorage.setItem(
                                  VENDORS_OPEN_KEY,
                                  next ? "1" : "0",
                                );
                              }}
                              className={cn(
                                "group relative w-full flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                                "hover:bg-[#895129]/5 hover:text-[#895129]",
                                isActive &&
                                  "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                                collapsed && !isMobile && "justify-center px-2",
                              )}
                              title={
                                collapsed && !isMobile ? item.label : undefined
                              }
                              aria-expanded={open}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-indicator-vendors"
                                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                                />
                              )}
                              <motion.span
                                whileHover={{ x: 4, scale: 1.01 }}
                                className="flex items-center gap-3"
                              >
                                <span
                                  className={cn(
                                    isActive
                                      ? "text-[#895129]"
                                      : "text-muted-foreground group-hover:text-[#895129]",
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                {(!collapsed || isMobile) && (
                                  <>
                                    <span className="flex-1 text-left">
                                      {item.label}
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        open && "rotate-180",
                                        isActive && "text-[#895129]",
                                      )}
                                    />
                                  </>
                                )}
                              </motion.span>
                              <SidebarTooltip
                                label={item.label}
                                collapsed={collapsed && !isMobile}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {open && (!collapsed || isMobile) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.24,
                                    ease: [0.4, 0, 0.2, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-2 space-y-0.5 border-l-2 border-[#895129]/15 pl-2 py-0.5">
                                    {item.children.map((child) => {
                                      const ChildIcon = child.icon;
                                      const childActive =
                                        child.key === "vendors_delivery_drivers"
                                          ? location.pathname.startsWith(
                                              "/admin/vendors/delivery-drivers",
                                            )
                                          : location.pathname === child.to;
                                      return (
                                        <motion.div
                                          key={child.key}
                                          whileHover={{ x: 3 }}
                                          transition={{ duration: 0.18 }}
                                        >
                                          <NavLink
                                            to={child.to}
                                            onClick={() =>
                                              isMobile && setMobileOpen(false)
                                            }
                                            className={cn(
                                              "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors",
                                              "hover:bg-[#895129]/5 hover:text-[#895129]",
                                              childActive &&
                                                "bg-primary/10 text-[#895129] font-semibold shadow-[0_2px_8px_rgba(137,81,41,0.08)]",
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                childActive
                                                  ? "text-[#895129]"
                                                  : "text-muted-foreground group-hover:text-[#895129]",
                                              )}
                                            >
                                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                            </span>
                                            <span>{child.label}</span>
                                          </NavLink>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Shop accordion */}
                  {sectionedMenu.shop && (
                    <div className="space-y-1">
                      {(() => {
                        const item = sectionedMenu.shop;
                        const Icon = item.icon;
                        const isActive =
                          location.pathname.startsWith("/admin/categories") ||
                          location.pathname.startsWith("/products") ||
                          location.pathname.startsWith("/shop");
                        const open = shopOpen && (!collapsed || isMobile);
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !shopOpen;
                                setShopOpen(next);
                                localStorage.setItem(
                                  SHOP_OPEN_KEY,
                                  next ? "1" : "0",
                                );
                              }}
                              className={cn(
                                "group relative w-full flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                                "hover:bg-[#895129]/5 hover:text-[#895129]",
                                isActive &&
                                  "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                                collapsed && !isMobile && "justify-center px-2",
                              )}
                              title={
                                collapsed && !isMobile ? item.label : undefined
                              }
                              aria-expanded={open}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="sidebar-active-indicator-shop"
                                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                                />
                              )}
                              <motion.span
                                whileHover={{ x: 4, scale: 1.01 }}
                                className="flex items-center gap-3"
                              >
                                <span
                                  className={cn(
                                    isActive
                                      ? "text-[#895129]"
                                      : "text-muted-foreground group-hover:text-[#895129]",
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                {(!collapsed || isMobile) && (
                                  <>
                                    <span className="flex-1 text-left">
                                      {item.label}
                                    </span>
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        open && "rotate-180",
                                        isActive && "text-[#895129]",
                                      )}
                                    />
                                  </>
                                )}
                              </motion.span>
                              <SidebarTooltip
                                label={item.label}
                                collapsed={collapsed && !isMobile}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {open && (!collapsed || isMobile) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.24,
                                    ease: [0.4, 0, 0.2, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-2 space-y-0.5 border-l-2 border-[#895129]/15 pl-2 py-0.5">
                                    {item.children.map((child) => {
                                      const ChildIcon = child.icon;
                                      const childActive =
                                        child.to === "/admin/categories"
                                          ? location.pathname.startsWith(
                                              "/admin/categories",
                                            )
                                          : location.pathname === child.to ||
                                            location.pathname.startsWith(
                                              `${child.to}/`,
                                            );
                                      return (
                                        <motion.div
                                          key={child.key}
                                          whileHover={{ x: 3 }}
                                          transition={{ duration: 0.18 }}
                                        >
                                          <NavLink
                                            to={child.to}
                                            onClick={() =>
                                              isMobile && setMobileOpen(false)
                                            }
                                            className={cn(
                                              "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors",
                                              "hover:bg-[#895129]/5 hover:text-[#895129]",
                                              childActive &&
                                                "bg-primary/10 text-[#895129] font-semibold shadow-[0_2px_8px_rgba(137,81,41,0.08)]",
                                            )}
                                          >
                                            <span
                                              className={cn(
                                                childActive
                                                  ? "text-[#895129]"
                                                  : "text-muted-foreground group-hover:text-[#895129]",
                                              )}
                                            >
                                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                            </span>
                                            <span>{child.label}</span>
                                          </NavLink>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {sectionedMenu.managementLinks.map((item) => {
                    const Icon = item.icon;
                    const showDot =
                      (item.key === "support" && unreadByKind.support) ||
                      (item.key === "orders" && unreadByKind.orders) ||
                      (item.key === "delivery" && unreadByKind.delivery);
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={({ isActive }) => {
                          const linkActive =
                            isActive ||
                            (item.key === "service_providers" &&
                              location.pathname.startsWith(
                                "/admin/service-providers",
                              ));
                          return cn(
                            "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                            "hover:bg-[#895129]/5 hover:text-[#895129]",
                            linkActive &&
                              "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                            collapsed && !isMobile && "justify-center px-2",
                          );
                        }}
                        title={collapsed && !isMobile ? item.label : undefined}
                      >
                        {({ isActive }) => {
                          const linkActive =
                            isActive ||
                            (item.key === "service_providers" &&
                              location.pathname.startsWith(
                                "/admin/service-providers",
                              ));
                          return (
                            <>
                              {linkActive && (
                                <motion.span
                                  layoutId="sidebar-active-indicator-main"
                                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                                />
                              )}
                              <motion.span
                                whileHover={{ x: 4, scale: 1.01 }}
                                className="flex items-center gap-3 group-hover:translate-x-1"
                              >
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={cn(
                                    "relative",
                                    linkActive
                                      ? "text-[#895129]"
                                      : "text-muted-foreground group-hover:text-[#895129]",
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                  {showDot && (
                                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                  )}
                                </motion.span>
                                {(!collapsed || isMobile) && (
                                  <span>{item.label}</span>
                                )}
                              </motion.span>
                              <SidebarTooltip
                                label={item.label}
                                collapsed={collapsed && !isMobile}
                              />
                            </>
                          );
                        }}
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* SYSTEM */}
              <div className="space-y-2">
                {(!collapsed || isMobile) && (
                  <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                    SYSTEM
                  </div>
                )}
                <div className="space-y-1">
                  {sectionedMenu.system.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.key}
                        to={item.to}
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                            "hover:bg-[#895129]/5 hover:text-[#895129]",
                            isActive &&
                              "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                            collapsed && !isMobile && "justify-center px-2",
                          )
                        }
                        title={collapsed && !isMobile ? item.label : undefined}
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <motion.span
                                layoutId="sidebar-active-indicator-main"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                              />
                            )}
                            <motion.span
                              whileHover={{ x: 4, scale: 1.01 }}
                              className="flex items-center gap-3 group-hover:translate-x-1"
                            >
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={cn(
                                  "relative",
                                  isActive
                                    ? "text-[#895129]"
                                    : "text-muted-foreground group-hover:text-[#895129]",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </motion.span>
                              {(!collapsed || isMobile) && (
                                <span>{item.label}</span>
                              )}
                            </motion.span>
                            <SidebarTooltip
                              label={item.label}
                              collapsed={collapsed && !isMobile}
                            />
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>

              {/* Settings accordion */}
              {sectionedMenu.settings && (
                <div className="space-y-2">
                  {(!collapsed || isMobile) && (
                    <div className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground">
                      SETTINGS
                    </div>
                  )}
                  <div className="space-y-1">
                    {(() => {
                      const item = sectionedMenu.settings;
                      const Icon = item.icon;
                      const isActive =
                        location.pathname.startsWith("/settings");
                      const open = settingsOpen && (!collapsed || isMobile);
                      return (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              const next = !settingsOpen;
                              setSettingsOpen(next);
                              localStorage.setItem(
                                SETTINGS_OPEN_KEY,
                                next ? "1" : "0",
                              );
                            }}
                            className={cn(
                              "group relative w-full flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium tracking-tight text-muted-foreground transition-colors",
                              "hover:bg-[#895129]/5 hover:text-[#895129]",
                              isActive &&
                                "bg-primary/10 text-[#895129] border-[#895129]/20 shadow-[0_4px_12px_rgba(137,81,41,0.12)] font-semibold",
                              collapsed && !isMobile && "justify-center px-2",
                            )}
                            title={
                              collapsed && !isMobile ? item.label : undefined
                            }
                            aria-expanded={open}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="sidebar-active-indicator-settings"
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#895129]"
                              />
                            )}
                            <motion.span
                              whileHover={{ x: 4, scale: 1.01 }}
                              className="flex items-center gap-3"
                            >
                              <span
                                className={cn(
                                  isActive
                                    ? "text-[#895129]"
                                    : "text-muted-foreground group-hover:text-[#895129]",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              {(!collapsed || isMobile) && (
                                <>
                                  <span className="flex-1 text-left">
                                    {item.label}
                                  </span>
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform",
                                      open && "rotate-180",
                                      isActive && "text-[#895129]",
                                    )}
                                  />
                                </>
                              )}
                            </motion.span>
                            <SidebarTooltip
                              label={item.label}
                              collapsed={collapsed && !isMobile}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {open && (!collapsed || isMobile) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: "easeOut" }}
                                className="overflow-hidden"
                              >
                                <div className="ml-2 space-y-0.5 border-l-2 border-[#895129]/15 pl-2 py-0.5">
                                  {item.children.map((child) => {
                                    const ChildIcon = child.icon;
                                    const childActive =
                                      location.pathname === child.to;
                                    return (
                                      <motion.div
                                        key={child.key}
                                        whileHover={{ x: 3 }}
                                        transition={{ duration: 0.18 }}
                                      >
                                        <NavLink
                                          to={child.to}
                                          onClick={() =>
                                            isMobile && setMobileOpen(false)
                                          }
                                          className={cn(
                                            "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight text-muted-foreground transition-colors",
                                            "hover:bg-[#895129]/5 hover:text-[#895129]",
                                            childActive &&
                                              "bg-primary/10 text-[#895129] font-semibold shadow-[0_2px_8px_rgba(137,81,41,0.08)]",
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              childActive
                                                ? "text-[#895129]"
                                                : "text-muted-foreground group-hover:text-[#895129]",
                                            )}
                                          >
                                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                          </span>
                                          <span>{child.label}</span>
                                        </NavLink>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom user card */}
        <div className="shrink-0 px-3 pb-3 pt-3 border-t border-[#EEE7DF]">
          <motion.div
            whileHover={{ y: -1 }}
            className="rounded-2xl border border-[#EEE7DF] bg-white/60 p-3 shadow-soft"
          >
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={!collapsed || isMobile ? "w-full" : ""}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className={cn(
                    "h-9 px-3",
                    (!collapsed || isMobile) && "w-full",
                  )}
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  {(!collapsed || isMobile) && (
                    <span className="ml-2">Logout</span>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.aside>

      <div style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <header className="sticky top-0 z-30 border-b border-[#EEE7DF] bg-white/80 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
              <div className="hidden h-10 md:flex items-center gap-2 rounded-xl border border-[#EEE7DF] bg-white px-3 text-sm text-muted-foreground w-90">
                <Search className="h-4 w-4" />
                <Input
                  className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
                  placeholder="Search users, orders, vendors…"
                />
              </div>
              <nav
                aria-label="Breadcrumb"
                className="flex min-h-10 flex-wrap items-center gap-1 text-sm text-muted-foreground"
              >
                {breadcrumbItems.map((crumb, i) => (
                  <span
                    key={`${crumb.label}-${i}`}
                    className="inline-flex items-center gap-1"
                  >
                    {i > 0 && (
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden
                      />
                    )}
                    {crumb.to && i < breadcrumbItems.length - 1 ? (
                      <Link
                        to={crumb.to}
                        className="transition-colors hover:text-[#895129] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#895129]/30 rounded-sm"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          i === breadcrumbItems.length - 1 &&
                            "font-medium text-foreground",
                        )}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative h-10 w-10"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-85">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(markAllRead())}
                    >
                      Mark all read
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-90 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-3 py-6 text-sm text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="items-start gap-2"
                        >
                          <span
                            className={cn(
                              "mt-1 h-2 w-2 rounded-full",
                              n.read ? "bg-black/10" : "bg-primary",
                            )}
                          />
                          <div className="flex flex-col gap-0.5">
                            <div className="text-sm font-medium text-foreground">
                              {n.title}
                            </div>
                            {n.description && (
                              <div className="text-xs text-muted-foreground">
                                {n.description}
                              </div>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage
                        src={getImageUrl(userProfile?.profileImage)}
                        alt={firstName}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {firstName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">
                      {firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/settings/profile")}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-3 pb-6 pt-6 sm:px-4 lg:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out? You will need to log in again
              to access the admin panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
