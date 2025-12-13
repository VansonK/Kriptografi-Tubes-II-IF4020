import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // The Landing Page (Home)
  index("routes/home.tsx"),

  // The Verification Page (http://localhost:5173/verify)
  route("verify", "routes/Verify.tsx"),

  // The Issuer Dashboard (http://localhost:5173/issuer/dashboard)
  route("issuer/dashboard", "routes/IssuerDashboard.tsx"),

] satisfies RouteConfig;