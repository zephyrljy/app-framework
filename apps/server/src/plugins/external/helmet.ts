import helmet from "@fastify/helmet";

export const autoConfig = {
  // The app is also served over plain HTTP, e.g. http://localhost:3000 from Docker
  contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
};

/**
 * This plugin sets the basic security headers.
 *
 * @see {@link https://github.com/fastify/fastify-helmet}
 */
export default helmet;
