import { useEffect } from "react";
import { AppState } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useToken } from "../src/api";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function RootLayout() {
  const token = useToken();
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", state => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerTintColor: "#173f32", contentStyle: { backgroundColor: "#f5f7f6" } }}>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  </QueryClientProvider>;
}
