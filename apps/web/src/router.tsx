import { createBrowserRouter, isRouteErrorResponse, redirect, useRouteError } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
const loadHomeRoute = async () => ({ Component: (await import("@/routes/home")).default });
import AppRoute from "@/routes/app";

function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "发生未知错误";

  return <main className="p-6"><Alert variant="destructive"><strong>页面加载失败</strong><AlertDescription>{message}</AlertDescription><Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>重新加载</Button></Alert></main>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppRoute,
    hydrateFallbackElement: <main className="grid min-h-svh place-items-center text-sm text-muted-foreground">正在加载页面...</main>,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, loader: () => redirect("/home") },
      { path: "home", lazy: loadHomeRoute },
      { path: "*", loader: () => redirect("/home") },
    ],
  },
]);
