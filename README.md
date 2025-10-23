# OData Batch Grabber (Chrome Extension)

Captures network calls that contain `$batch` (anywhere after the OData root) and displays the substring found between `/sap/opu/odata` and the first `$batch`.

## Features
- Monitors network requests via background service worker (Manifest V3)
- Extracts and stores unique matches
- Badge shows the number of captured items
- Popup lists results with one-click copy and Clear

## Install (Load Unpacked)
1. Build requirements: none. This is a pure MV3 extension (no bundling).
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top right).
4. Click "Load unpacked" and select this folder: `odata_grabber`.
5. The extension icon will appear in the toolbar. Pin it if desired.

## Usage
1. Visit a site that makes OData batch calls.
2. When a request URL contains `$batch`, the extension:
   - Extracts the substring between `/sap/opu/odata` and the first `$batch`.
   - Stores the unique result and updates the badge count.
3. Click the extension icon to open the popup and see captured items.
4. Use the Copy button to copy any item. Click Clear to reset.
5. Open Settings from the popup (Settings button) or via the extension’s Details → Extension options. The Settings page is blank for now.

## Examples
For a URL like:
```
https://example.company.com/sap/opu/odata/SOME_SERVICE;v=0001/$batch?saml2=disabled
```
The extracted value will be:
```
/SOME_SERVICE;v=0001/
```

## Permissions
- `webRequest`: to observe completed network requests (non-blocking)
- `storage`: to persist matches
- `host_permissions: <all_urls>` to match on any domain

## Notes
- Incognito: if needed, open extension Details and enable "Allow in Incognito".
- Requests are captured when the URL contains `$batch` anywhere after `/sap/opu/odata`.
- The substring excludes the `/sap/opu/odata` prefix and the trailing `$batch`.
