FROM node:24-bookworm-slim

ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY output/docker/server ./apps/server
COPY apps/web/dist ./apps/web/dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(e => { console.error(e); process.exit(1); })"

CMD ["node", "apps/server/dist/server.js"]
