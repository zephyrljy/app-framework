import { useSyncExternalStore } from "react";
import * as SecureStore from "expo-secure-store";
import { createApi } from "@app/api-client";

const apiURL = process.env.EXPO_PUBLIC_API_URL;
if (!apiURL) throw new Error("请设置 EXPO_PUBLIC_API_URL，指向服务端的 /api 地址");
const parsedURL = new URL(apiURL);
if (parsedURL.protocol !== "https:" && parsedURL.protocol !== "http:") {
  throw new Error("EXPO_PUBLIC_API_URL 必须是 HTTP 或 HTTPS 地址");
}

const listeners = new Set<() => void>();
let token = SecureStore.getItem("token");

export function setToken(value: string | null) {
  token = value;
  if (value) SecureStore.setItem("token", value);
  else SecureStore.deleteItemAsync("token").catch(error => console.error(error));
  listeners.forEach(listener => listener());
}

export const useToken = () => useSyncExternalStore(listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
}, () => token);

export const api = createApi(apiURL, { getToken: () => token, onUnauthorized: () => setToken(null) });
