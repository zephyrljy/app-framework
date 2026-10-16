import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";

export const autoConfig = (fastify: FastifyInstance) => ({
  secret: fastify.config.JWT_SECRET,
  sign: { expiresIn: "30d" },
  messages: {
    badRequestErrorMessage: "请先登录",
    noAuthorizationInHeaderMessage: "请先登录",
    authorizationTokenExpiredMessage: "登录已过期，请重新登录",
    authorizationTokenInvalid: () => "请先登录",
    authorizationTokenUntrusted: "请先登录",
  },
});

/**
 * This plugin signs and verifies the login token.
 *
 * @see {@link https://github.com/fastify/fastify-jwt}
 */
export default jwt;
