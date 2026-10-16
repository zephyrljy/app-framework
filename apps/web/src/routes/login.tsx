import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { setToken, api } from "@/api";

export default function LoginPage() {
  const mutation = useMutation({ mutationFn: api.login, onSuccess: ({ token }) => setToken(token) });

  return <main className="grid min-h-svh place-items-center p-6">
    <Card className="w-full max-w-sm">
      <CardHeader><CardTitle>App</CardTitle><CardDescription>输入密码登录</CardDescription></CardHeader>
      <CardContent>
        <form className="form-fields" onSubmit={event => { event.preventDefault(); mutation.mutate({ password: String(new FormData(event.currentTarget).get("password")) }); }}>
          <label>密码<Input name="password" type="password" autoComplete="current-password" required autoFocus disabled={mutation.isPending}/></label>
          {mutation.error && <Alert variant="destructive"><AlertDescription>{mutation.error.message}</AlertDescription></Alert>}
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "登录中…" : "登录"}</Button>
        </form>
      </CardContent>
    </Card>
  </main>;
}
