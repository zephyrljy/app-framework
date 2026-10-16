import fastifyStatic, { type FastifyStaticOptions } from "@fastify/static";
import path from "node:path";

export const autoConfig: FastifyStaticOptions = {
  root: path.join(import.meta.dirname, "../../../../web/dist"),
  cacheControl: false,
  setHeaders: (reply, filePath) => {
    // Built assets have content hashes in their names, index.html must be revalidated to pick up new builds
    reply.header(
      "cache-control",
      filePath.includes(`${path.sep}assets${path.sep}`)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    );
  },
};

/**
 * This plugin serves the built web app.
 *
 * @see {@link https://github.com/fastify/fastify-static}
 */
export default fastifyStatic;
