import { Outlet } from "react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { useToken } from "@/api";
import LoginPage from "@/routes/login";

export default function AppRoute() {
  if (!useToken()) return <LoginPage/>;
  return <AppLayout><Outlet /></AppLayout>;
}
