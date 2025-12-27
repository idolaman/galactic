# Building for Release

## Prerequisites

1. **Developer ID Certificate** - Install "Developer ID Application" certificate in your Keychain

2. **Store notarization credentials** (one-time setup):
   ```bash
   xcrun notarytool store-credentials galactic-notary \
     --key /path/to/AuthKey_XXXXXX.p8 \
     --key-id YOUR_KEY_ID \
     --issuer YOUR_ISSUER_ID
   ```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build unsigned (for local testing) |
| `npm run release` | Build, sign, and notarize (for distribution) |

## Environment Variables

### For Code Signing (electron-builder)

| Variable | Description |
|----------|-------------|
| `CSC_NAME` | Name of the certificate (e.g., "Developer ID Application: Your Name (TEAM_ID)") |
| `CSC_LINK` | Path to .p12 certificate file (alternative to CSC_NAME) |
| `CSC_KEY_PASSWORD` | Password for .p12 file (if using CSC_LINK) |

### For Notarization (alternative to keychain profile)

| Variable | Description |
|----------|-------------|
| `APPLE_API_KEY` | Path to App Store Connect API key (.p8 file) |
| `APPLE_API_KEY_ID` | API Key ID from App Store Connect |
| `APPLE_API_ISSUER` | Issuer ID from App Store Connect |

Or use keychain profile (recommended):

| Variable | Description |
|----------|-------------|
| `APPLE_KEYCHAIN_PROFILE` | Name of stored keychain profile |

## Getting Credentials

### Developer ID Certificate
1. Open Xcode > Settings > Accounts
2. Manage Certificates > Add "Developer ID Application"

### App Store Connect API Key
1. Go to [App Store Connect > Users and Access > Keys](https://appstoreconnect.apple.com/access/api)
2. Generate an API key with "Developer" access
3. Download the `.p8` file and note the Key ID and Issuer ID
