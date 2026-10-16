import type { ReactNode } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, Text, TextInput, View, type TextInputProps } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { styles } from "./theme";

export function Button({ title, onPress, disabled = false, danger = false }: { title: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={[styles.button, danger && { backgroundColor: "#b42318" }, disabled && styles.disabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#87968f" accessibilityLabel={label} style={styles.input} {...props} /></View>;
}

export function Choices<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
    {options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)}
      style={[styles.chip, value === option.value && styles.chipActive]}><Text style={value === option.value ? styles.buttonText : styles.label}>{option.label}</Text></Pressable>)}
  </View></View>;
}

type QueryState = { isPending: boolean; error: Error | null; refetch: () => unknown; isRefetching: boolean };

export function QueryStatus({ queries }: { queries: QueryState[] }) {
  const error = queries.find(query => query.error)?.error;
  return <View style={styles.centered}>{error ? <><Text style={styles.error}>{error.message}</Text><Button title="重新加载" onPress={() => queries.forEach(query => query.refetch())} /></> : <ActivityIndicator color="#173f32" />}</View>;
}

export function Screen({ children, queries = [] }: { children: ReactNode; queries?: QueryState[] }) {
  const error = queries.find(query => query.error)?.error;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
    refreshControl={queries.length ? <RefreshControl refreshing={queries.some(query => query.isRefetching)} onRefresh={() => queries.forEach(query => query.refetch())} tintColor="#173f32" /> : undefined}>
    {error ? <Text style={styles.error}>{error.message}</Text> : null}{children}
  </ScrollView>;
}

export function Form({ children, error, pending, onSubmit, title = "保存" }: { children: ReactNode; error: Error | null; pending: boolean; onSubmit: () => void; title?: string }) {
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100}>
    <Screen><View pointerEvents={pending ? "none" : "auto"} style={{ gap: 16 }}>{children}</View>{error ? <Text style={styles.error}>{error.message}</Text> : null}
      <Button title={pending ? "正在处理…" : title} disabled={pending} onPress={onSubmit} />
    </Screen>
  </KeyboardAvoidingView>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={[styles.label, { flex: 1 }]}>{label}</Text><Text style={[styles.value, { flexShrink: 1 }]}>{value}</Text></View>;
}

export function useSave<T>(save: (input: T) => Promise<unknown>, onSuccess?: () => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn: save, onError: error => console.error(error), onSuccess: async () => {
    await client.invalidateQueries();
    onSuccess?.();
  } });
}

export function confirmDelete(name: string, remove: () => void) {
  Alert.alert("确认删除", `确定删除“${name}”吗？`, [{ text: "取消", style: "cancel" }, { text: "删除", style: "destructive", onPress: remove }]);
}

