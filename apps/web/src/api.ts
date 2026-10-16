import { useSyncExternalStore } from "react";
import { createApi } from "@app/api-client";

const listeners = new Set<() => void>();
let token = localStorage.getItem("token");

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem("token", value);
  else localStorage.removeItem("token");
  listeners.forEach(listener => listener());
}

export const useToken = () => useSyncExternalStore(listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}, () => token);

export const api = createApi("/api", { getToken: () => token, onUnauthorized: () => setToken(null) });
