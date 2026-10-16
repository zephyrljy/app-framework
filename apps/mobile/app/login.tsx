import { useState } from "react";
import { Text } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { setToken, api } from "../src/api";
import { Field, Form } from "../src/components";
import { styles } from "../src/theme";

export default function LoginScreen() {
  const [password, setPassword] = useState("");
  const login = useMutation({ mutationFn: api.login, onSuccess: ({ token }) => setToken(token) });
  return <Form error={login.error} pending={login.isPending} title="登录" onSubmit={() => login.mutate({ password })}>
    <Text style={styles.title}>App</Text>
    <Text style={styles.subtitle}>输入密码登录</Text>
    <Field label="密码" value={password} onChangeText={setPassword} secureTextEntry autoFocus autoComplete="current-password" />
  </Form>;
}
