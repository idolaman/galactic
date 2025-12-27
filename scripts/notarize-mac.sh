#!/usr/bin/env bash
set -euo pipefail

dmg="$(ls -t release/Galactic-*-arm64.dmg 2>/dev/null | head -n1 || true)"
if [ -z "$dmg" ]; then
  echo "No arm64 DMG found in release/"
  exit 1
fi

app="$(ls -td release/mac-arm64/*.app 2>/dev/null | head -n1 || true)"
if [ -z "$app" ]; then
  echo "No app bundle found in release/mac-arm64/"
  exit 1
fi

notary_args=()
if [ -n "${APPLE_KEYCHAIN_PROFILE-}" ]; then
  notary_args+=(--keychain-profile "$APPLE_KEYCHAIN_PROFILE")
elif [ -n "${APPLE_API_KEY-}" ] && [ -n "${APPLE_API_KEY_ID-}" ] && [ -n "${APPLE_API_ISSUER-}" ]; then
  notary_args+=(--key "$APPLE_API_KEY" --key-id "$APPLE_API_KEY_ID" --issuer "$APPLE_API_ISSUER")
else
  echo "Missing notarization credentials. Set APPLE_KEYCHAIN_PROFILE or APPLE_API_KEY/APPLE_API_KEY_ID/APPLE_API_ISSUER."
  exit 1
fi

xcrun notarytool submit "$dmg" "${notary_args[@]}" --wait
xcrun stapler staple "$dmg"
xcrun stapler staple "$app"
