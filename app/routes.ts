import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  route("verify", "routes/Verify.tsx"),

  route("issuer/dashboard", "routes/IssuerDashboard.tsx"),

] satisfies RouteConfig;