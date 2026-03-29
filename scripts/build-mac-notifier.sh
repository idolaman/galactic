#!/bin/bash
set -euo pipefail

APP_NAME="Galactic Notifier"
PROJECT_FILE="macos/GalacticNotifier.xcodeproj"
OUTPUT_DIR="resources/mac-notifier"
DERIVED_DATA_DIR=".build-cache/galactic-notifier"
BUILT_APP_DIR="$DERIVED_DATA_DIR/Build/Products/Release/$APP_NAME.app"
DESTINATION_APP_DIR="$OUTPUT_DIR/$APP_NAME.app"

echo "🚀 Building macOS notifier helper..."

rm -rf "$DERIVED_DATA_DIR"
rm -rf "$DESTINATION_APP_DIR"
mkdir -p "$OUTPUT_DIR"

xcodebuild \
  -project "$PROJECT_FILE" \
  -scheme "$APP_NAME" \
  -configuration Release \
  -derivedDataPath "$DERIVED_DATA_DIR" \
  -destination "generic/platform=macOS" \
  CODE_SIGNING_ALLOWED=NO \
  build

ditto "$BUILT_APP_DIR" "$DESTINATION_APP_DIR"

echo "✅ macOS notifier built: $DESTINATION_APP_DIR"
