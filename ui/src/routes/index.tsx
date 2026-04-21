import { lazy } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { 
  AdminRoute, 
  MechanicOwnerRoute, 
  MechanicEmployeeRoute, 
  ClientRoute 
} from "@/components/auth/RoleBasedRoute";
import { RoleRedirect } from "@/components/auth/RoleRedirect";
import Layout from "@/routes/layout";

// Lazy load pages for better performance
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const DashboardPage = lazy(() => import("@/pages/dashboard/index"));
const HomePage = lazy(() => import("@/pages/index"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const WorkshopsPage = lazy(() => import("@/pages/dashboard/workshops/index"));
const ShopDetailsPage = lazy(() => import("@/pages/dashboard/workshops/shopDetails/index"));
const BookServicePage = lazy(() => import("@/pages/dashboard/workshops/shopDetails/bookService/index"));
const ManagerShopPanelPage = lazy(() => import("@/pages/dashboard/managerPanel/index"));
const CreateWorkshopPage = lazy(() => import("@/pages/dashboard/managerPanel/createWorkshop/index"));
const AssignMechanicsPage = lazy(() => import("@/pages/dashboard/managerPanel/assignMechanics/index"));
const WorkshopMechDetailsPage = lazy(() => import("@/pages/dashboard/managerPanel/workshop-mechDetails/index"));
const MechanicShopPanelPage = lazy(() => import("@/pages/dashboard/mechanicShopPanel/index"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <RoleRedirect>
          <Outlet />
        </RoleRedirect>
      </Layout>
    ),
    children: [
      {
        index: true,
        element: (
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        ),
      },
      {
        path: "login",
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      // Admin routes
      {
        path: "dashboard",
        element: (
          <AdminRoute fallbackPath="/unauthorized">
            <DashboardPage />
          </AdminRoute>
        ),
      },
      // Client routes (USER role)
      {
        path: "workshops",
        element: (
          <ClientRoute fallbackPath="/unauthorized">
            <WorkshopsPage />
          </ClientRoute>
        ),
      },
      {
        path: "workshops/shop/:shopId",
        element: (
          <ClientRoute fallbackPath="/unauthorized">
            <ShopDetailsPage />
          </ClientRoute>
        ),
      },
      {
        path: "workshops/shop/:shopId/:user_id",
        element: (
          <ClientRoute fallbackPath="/unauthorized">
            <BookServicePage />
          </ClientRoute>
        ),
      },
      // Mechanic Owner routes
      {
        path: "managerShopPanel",
        element: (
          <MechanicOwnerRoute fallbackPath="/unauthorized">
            <ManagerShopPanelPage />
          </MechanicOwnerRoute>
        ),
      },
      {
        path: "managerShopPanel/createWorkshop",
        element: (
          <MechanicOwnerRoute fallbackPath="/unauthorized">
            <CreateWorkshopPage />
          </MechanicOwnerRoute>
        ),
      },
      {
        path: "managerShopPanel/assignMechanics",
        element: (
          <MechanicOwnerRoute fallbackPath="/unauthorized">
            <AssignMechanicsPage />
          </MechanicOwnerRoute>
        ),
      },
      {
        path: "managerShopPanel/workshops/:workshopId",
        element: (
          <MechanicOwnerRoute fallbackPath="/unauthorized">
            <WorkshopMechDetailsPage />
          </MechanicOwnerRoute>
        ),
      },
      // Mechanic Employee routes
      {
        path: "mechanicShopPanel",
        element: (
          <MechanicEmployeeRoute fallbackPath="/unauthorized">
            <MechanicShopPanelPage />
          </MechanicEmployeeRoute>
        ),
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export default router;
