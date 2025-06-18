import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("account-pending", "routes/account-pending.tsx"),
  route("user-not-found", "routes/user-not-found.tsx"),
  route("dev-login", "routes/dev-login.tsx"),
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  route("subscription-required", "routes/subscription-required.tsx"),
  route("admin", "routes/admin.tsx"),
  route("admin/grant-me", "routes/admin.grant-me.tsx"),
  route("admin/users", "routes/admin/users.tsx"),
  route("admin/setup", "routes/admin/setup.tsx"),
  route("admin/quick-access", "routes/admin/quick-access.tsx"),
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("upload", "routes/upload.tsx"),
    route("sales", "routes/sales.tsx"),
    route("inventory", "routes/inventory.tsx"),
    route("reports", "routes/reports.tsx"),
    route("budget", "routes/budget.tsx"),
    route("settings", "routes/settings.tsx"),
    route("chat", "routes/chat.tsx"),
  ]),
] satisfies RouteConfig;
