import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useParams,
} from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { PublicRoute } from "@/routes/PublicRoute";
import { DeliveryDriverDetailsSkeleton } from "@/features/delivery-drivers/pages/DeliveryDriverDetailsSkeleton";
import HeroSection from "@/features/hero/HeroSection";

const DashboardPage = lazy(
  () => import("@/features/dashboard/pages/DashboardPage"),
);
const LoginPage = lazy(() => import("@/features/auth/pages/Login"));
const OtpVerifyPage = lazy(() => import("@/features/auth/pages/OtpVerifyPage"));
const UpdatePasswordPage = lazy(
  () => import("@/features/auth/pages/UpdatePasswordPage"),
);
const ForgotPasswordPage = lazy(
  () => import("@/features/auth/pages/ForgotPasswordPage"),
);
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const VendorsPage = lazy(() => import("@/features/vendors/pages/VendorsPage"));
const ProductsPage = lazy(
  () => import("@/features/catalog/pages/ProductsPage"),
);
const AddProductPage = lazy(
  () => import("@/features/catalog/pages/AddProductPage"),
);
const CategoriesPage = lazy(
  () => import("@/features/catalog/pages/CategoriesPage"),
);
const ServicesPage = lazy(
  () => import("@/features/catalog/pages/ServicesPage"),
);
const OrdersPage = lazy(() => import("@/features/orders/pages/OrdersPage"));
const DeliveryPage = lazy(
  () => import("@/features/delivery/pages/DeliveryPage"),
);
const DeliveryDriversPage = lazy(
  () => import("@/features/delivery-drivers/pages/DeliveryDriversPage"),
);
const DeliveryDriverDetailsPage = lazy(
  () => import("@/features/delivery-drivers/pages/DeliveryDriverDetailsPage"),
);
const ServiceProvidersPage = lazy(
  () => import("@/features/service-providers/pages/ServiceProvidersPage"),
);
const ServiceProviderDetailsPage = lazy(
  () => import("@/features/service-providers/pages/ServiceProviderDetailsPage"),
);
const PayoutsPage = lazy(() => import("@/features/payouts/pages/PayoutsPage"));
const SupportPage = lazy(() => import("@/features/support/pages/SupportPage"));
const AnalyticsPage = lazy(
  () => import("@/features/analytics/pages/AnalyticsPage"),
);
const SettingsPage = lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);
const SettingsProfilePage = lazy(
  () => import("@/features/settings/pages/SettingsProfilePage"),
);
const SettingsSecurityPage = lazy(
  () => import("@/features/settings/pages/SettingsSecurityPage"),
);
const SettingsLegalPage = lazy(
  () => import("@/features/settings/pages/SettingsLegalPage"),
);
const SettingsCommissionPage = lazy(
  () => import("@/features/settings/pages/SettingsCommissionPage"),
);
const ShopDeliveryPage = lazy(
  () => import("@/features/shop/pages/ShopDeliveryPage"),
);
const ShopAnalyticsPage = lazy(
  () => import("@/features/shop/pages/ShopAnalyticsPage"),
);
const ShopPayoutsPage = lazy(
  () => import("@/features/shop/pages/ShopPayoutsPage"),
);
const NotFoundPage = lazy(() => import("@/routes/NotFoundPage"));

import { CustomSpinner } from "@/components/common/CustomSpinner";

function Loading() {
  return <CustomSpinner />;
}

function LegacyDeliveryDriverDetailRedirect() {
  const { id } = useParams();
  if (!id) return <Navigate to="/admin/vendors/delivery-drivers" replace />;
  return (
    <Navigate
      to={`/admin/vendors/delivery-drivers/${encodeURIComponent(id)}`}
      replace
    />
  );
}

const router = createBrowserRouter([
  {
    element: (
      <PrivateRoute>
        <AdminLayout />
      </PrivateRoute>
    ),
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/users", element: <UsersPage /> },
      { path: "/vendors", element: <Navigate to="/admin/vendors" replace /> },
      { path: "/admin/vendors", element: <VendorsPage /> },
      {
        path: "/admin/vendors/delivery-drivers",
        element: <DeliveryDriversPage />,
      },
      {
        path: "/admin/vendors/delivery-drivers/:id",
        element: (
          <Suspense fallback={<DeliveryDriverDetailsSkeleton />}>
            <DeliveryDriverDetailsPage />
          </Suspense>
        ),
      },
      {
        path: "/admin/delivery-drivers",
        element: <Navigate to="/admin/vendors/delivery-drivers" replace />,
      },
      {
        path: "/admin/delivery-drivers/:id",
        element: <LegacyDeliveryDriverDetailRedirect />,
      },
      { path: "/admin/service-providers", element: <ServiceProvidersPage /> },
      {
        path: "/admin/service-providers/:id",
        element: <ServiceProviderDetailsPage />,
      },
      { path: "/admin/categories", element: <CategoriesPage /> },
      { path: "/products", element: <ProductsPage /> },
      { path: "/products/add", element: <AddProductPage /> },
      { path: "/shop/delivery", element: <ShopDeliveryPage /> },
      { path: "/shop/analytics", element: <ShopAnalyticsPage /> },
      { path: "/shop/payouts", element: <ShopPayoutsPage /> },
      { path: "/services", element: <ServicesPage /> },
      { path: "/orders", element: <OrdersPage /> },
      { path: "/delivery", element: <DeliveryPage /> },
      { path: "/payouts", element: <PayoutsPage /> },
      { path: "/hero", element: <HeroSection /> },
      { path: "/support", element: <SupportPage /> },
      { path: "/analytics", element: <AnalyticsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/settings/profile", element: <SettingsProfilePage /> },
      { path: "/settings/security", element: <SettingsSecurityPage /> },
      { path: "/settings/legal", element: <SettingsLegalPage /> },
      { path: "/settings/commission", element: <SettingsCommissionPage /> },
      {
        path: "/settings/support",
        element: <Navigate to="/support" replace />,
      },
    ],
  },
  {
    path: "/auth",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "verify-otp", element: <OtpVerifyPage /> },
      { path: "update-password", element: <UpdatePasswordPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: "/verify-otp",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [{ index: true, element: <OtpVerifyPage /> }],
  },
  {
    path: "/update-password",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [{ index: true, element: <UpdatePasswordPage /> }],
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [{ index: true, element: <ForgotPasswordPage /> }],
  },
  { path: "*", element: <NotFoundPage /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
