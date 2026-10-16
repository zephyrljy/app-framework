#!/usr/bin/env bash
set -euo pipefail

server=wb
remote_dir='~/app-framework'
cd "$(dirname "$0")/.."

echo "==> 构建产物"
pnpm build:docker

echo "==> 构建 linux/amd64 镜像"
docker build --platform linux/amd64 -t app-framework:local .

echo "==> 上传镜像"
docker save app-framework:local | gzip | ssh "$server" "gunzip | docker load"

echo "==> 上传配置"
ssh "$server" "mkdir -p $remote_dir/deploy"
scp compose.yaml "$server:$remote_dir/"
scp deploy/.env.production "$server:$remote_dir/deploy/"
ssh "$server" "chmod 600 $remote_dir/deploy/.env.production"

echo "==> 执行迁移并重启服务"
ssh "$server" "cd $remote_dir && docker compose run --rm app-framework node apps/server/dist/scripts/migrate.js && docker compose up -d --no-build --force-recreate && docker image prune -f"

echo "==> 等待健康检查"
for attempt in $(seq 1 30); do
  status=$(ssh "$server" "cd $remote_dir && docker inspect -f '{{.State.Health.Status}}' \$(docker compose ps -q app-framework)")
  if [ "$status" = "healthy" ]; then
    echo "服务已就绪：$status"
    exit 0
  fi
  if [ "$status" = "unhealthy" ]; then
    break
  fi
  sleep 3
done

echo "服务未通过健康检查：$status" >&2
ssh "$server" "cd $remote_dir && docker compose logs --tail 50"
exit 1
