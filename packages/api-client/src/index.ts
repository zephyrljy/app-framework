import axios, { type AxiosRequestConfig } from "axios";
import type { LoginInput } from "@app/contracts";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function createApi(baseURL: string, auth: { getToken: () => string | null; onUnauthorized: () => void }) {
  const client = axios.create({ baseURL, timeout: 10_000 });
  client.interceptors.request.use(config => {
    const token = auth.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  async function request<T>(config: AxiosRequestConfig) {
    try {
      return (await client.request<T>(config)).data;
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) auth.onUnauthorized();
        throw new ApiError(error.response?.data?.message ?? error.message, error.response?.status ?? 0);
      }
      throw error;
    }
  }

  return {
    request,
    login: (data: LoginInput) => request<{ token: string }>({ url: "/auth/login", method: "POST", data }),
  };
}

export type Api = ReturnType<typeof createApi>;
