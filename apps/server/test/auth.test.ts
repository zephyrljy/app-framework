import assert from "node:assert/strict";
import { test } from "node:test";
import { buildApp } from "./helper.js";
import { setupTestDatabase } from "./helper.js";

setupTestDatabase();

test("password login issues a token and is rate limited while health stays public", async () => {
  const app = buildApp();
  try {
    assert.equal((await app.inject("/health")).statusCode, 200);
    assert.equal((await app.inject({ method: "POST", url: "/api/auth/login", payload: { password: "wrong" } })).statusCode, 401);
    const { token } = (await app.inject({ method: "POST", url: "/api/auth/login", payload: { password: "test-password" } })).json() as { token: string };
    assert.ok(app.jwt.verify(token));
    const attempts = await Promise.all(Array.from({ length: 5 }, () => app.inject({ method: "POST", url: "/api/auth/login", payload: { password: "wrong" } })));
    assert.ok(attempts.some(response => response.statusCode === 429));
  } finally {
    await app.close();
  }
});
