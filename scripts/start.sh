#!/bin/bash
set -e
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "请编辑 .env 填入 API Key"
fi

npm run dev
