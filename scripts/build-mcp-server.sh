#!/bin/bash
set -e

REPO_URL="https://github.com/idolaman/Agentboard.git"
CACHE_DIR=".mcp-build-cache"
MCP_SRC="$CACHE_DIR/mcp_based_chat_detection_extension"
OUTPUT_DIR="resources/mcp-server"

echo "🚀 Building MCP Server..."

# Clone or pull the repository
if [ -d "$CACHE_DIR/.git" ]; then
  echo "📥 Pulling latest changes..."
  git -C "$CACHE_DIR" pull --quiet
else
  echo "📦 Cloning repository..."
  git clone --depth 1 "$REPO_URL" "$CACHE_DIR"
fi

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Bundle with esbuild (CommonJS format, .cjs extension to avoid ESM detection)
echo "📦 Bundling with esbuild..."
npx esbuild "$MCP_SRC/src/server.ts" \
  --bundle \
  --platform=node \
  --format=cjs \
  --minify \
  --outfile="$OUTPUT_DIR/server.cjs"

echo "✅ MCP Server built successfully: $OUTPUT_DIR/server.cjs"

