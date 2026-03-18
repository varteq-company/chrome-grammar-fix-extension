# Chrome Grammar Fix Extension

Chrome extension (Manifest V3) that adds a small fix button to text fields on any site.  
Clicking the button sends text to your configured LLM API and replaces it with grammar-corrected output.

## What It Does

- Injects a bottom-right fix icon into:
  - `textarea`
  - `input[type="text" | "search" | "email" | "url"]`
  - `contenteditable` elements
- Sends text to an OpenAI-compatible API (`/chat/completions`)
- Replaces original text with corrected text
- Provides popup settings:
  - API URL (default `https://api.openai.com/v1`)
  - model
  - token
- Validates settings on save (`GET /models`) and shows detailed errors
- Stores token encrypted in `chrome.storage.local` (AES-GCM + PBKDF2)

## Project Structure

```text
manifest.json
background/
  service-worker.js
content/
  content.js
  content.css
popup/
  popup.html
  popup.css
  popup.js
utils/
  crypto.js
  storage.js
icons/
  icon16.png
  icon48.png
  icon128.png
```

## Setup (Local Development)

1. Clone the repo:

```bash
git clone https://gitlab.varteq.com/incubator/chrome_fixgrammarextension.git
cd chrome_fixgrammarextension
```

2. Open Chrome extensions page:
   - Navigate to `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select this project folder

3. Configure the extension:
   - Click extension icon in toolbar
   - Set API URL, model, and token
   - Click **Save Settings**
   - Validation must pass before config is saved

## Usage

1. Focus any supported text field on a page.
2. Click the fix icon in the field’s bottom-right corner.
3. Wait for response (spinner is shown).
4. Text is replaced with corrected content.

## API Compatibility

Expected endpoints (OpenAI-compatible):

- `GET {apiUrl}/models`
- `POST {apiUrl}/chat/completions`

If your provider uses a different schema/path, validation or correction may fail until adapter logic is added.

## Security Notes

- Token is encrypted before writing to `chrome.storage.local`.
- Token is only used in the service worker (not in page context).
- This improves local-at-rest secrecy but is not equivalent to hardware-backed secret storage.

## Contributing

### Branch and commit flow

1. Create feature branch:

```bash
git checkout -b feat/short-description
```

2. Make your changes.

3. Load/reload unpacked extension in Chrome and test manually:
   - save valid/invalid config
   - verify detailed validation errors
   - verify grammar fix works on textarea + contenteditable + dynamic page elements

4. Commit with clear message:

```bash
git add .
git commit -m "feat: add ..."
```

5. Push and open Merge Request:

```bash
git push -u origin feat/short-description
```

### Contribution guidelines

- Keep Manifest V3-compatible code.
- Do not expose tokens to content scripts or page JS.
- Keep provider error handling explicit and user-readable.
- Preserve behavior for dynamic pages (MutationObserver/ResizeObserver flows).

## Roadmap

- Provider adapters for non-OpenAI APIs
- Per-site enable/disable toggle
- Better UI states in popup (save button loading state, inline field errors)
- Optional selection-only grammar fix
