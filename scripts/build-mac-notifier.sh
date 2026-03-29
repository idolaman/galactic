#!/bin/bash
set -euo pipefail

APP_NAME="Galactic Notifier"
PROJECT_FILE="macos/GalacticNotifier.xcodeproj"
OUTPUT_DIR="resources/mac-notifier"
DERIVED_DATA_DIR=".build-cache/galactic-notifier"
BUILT_APP_DIR="$DERIVED_DATA_DIR/Build/Products/Release/$APP_NAME.app"
DESTINATION_APP_DIR="$OUTPUT_DIR/$APP_NAME.app"
SOURCE_FILE="macos/GalacticNotifier/main.swift"
PLIST_FILE="macos/GalacticNotifier/Info.plist"
CONTENTS_DIR="$DESTINATION_APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
TMP_DIR="$(mktemp -d)"
MODULE_CACHE_DIR=".build-cache/swift-module-cache"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT

echo "🚀 Building macOS notifier helper..."

rm -rf "$DERIVED_DATA_DIR"
rm -rf "$DESTINATION_APP_DIR"
mkdir -p "$OUTPUT_DIR"

build_with_xcodebuild() {
  local log_file="$TMP_DIR/xcodebuild.log"
  if xcodebuild \
    -project "$PROJECT_FILE" \
    -scheme "$APP_NAME" \
    -configuration Release \
    -derivedDataPath "$DERIVED_DATA_DIR" \
    -destination "generic/platform=macOS" \
    CODE_SIGNING_ALLOWED=NO \
    build >"$log_file" 2>&1; then
    ditto "$BUILT_APP_DIR" "$DESTINATION_APP_DIR"
    return 0
  fi

  cat "$log_file" >&2
  return 1
}

build_with_swiftc() {
  mkdir -p "$MODULE_CACHE_DIR"
  mkdir -p "$MACOS_DIR"

  compile_arch() {
    local target="$1"
    local output="$2"

    xcrun --sdk macosx swiftc \
      "$SOURCE_FILE" \
      -module-cache-path "$MODULE_CACHE_DIR" \
      -target "$target" \
      -framework AppKit \
      -framework UserNotifications \
      -o "$output"
  }

  local arm64_binary="$TMP_DIR/galactic-notifier-arm64"
  local x64_binary="$TMP_DIR/galactic-notifier-x64"
  local universal_binary="$MACOS_DIR/$APP_NAME"

  compile_arch "arm64-apple-macos12.0" "$arm64_binary"
  compile_arch "x86_64-apple-macos12.0" "$x64_binary"

  lipo -create "$arm64_binary" "$x64_binary" -output "$universal_binary"
  chmod +x "$universal_binary"
  cp "$PLIST_FILE" "$CONTENTS_DIR/Info.plist"
}

if ! build_with_xcodebuild; then
  echo "⚠️ xcodebuild failed; falling back to swiftc helper build." >&2
  build_with_swiftc
fi

echo "✅ macOS notifier built: $DESTINATION_APP_DIR"
