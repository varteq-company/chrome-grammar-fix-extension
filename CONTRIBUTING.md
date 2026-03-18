# Contributing Guide

Thanks for contributing to Chrome Grammar Fix Extension.

## Development Setup

1. Fork the repository on GitHub.
2. Clone your fork:

```bash
git clone https://github.com/<your-user>/chrome-grammar-fix-extension.git
cd chrome_fixgrammarextension
npm install
npm run build
```

3. Load extension in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select `dist` folder

## Workflow

1. Create a branch:

```bash
git checkout -b feat/short-description
```

2. Implement and test manually:
   - popup save validation
   - grammar fix on textarea/contenteditable/input
   - dynamic page behavior (elements added after load)
   - Gmail compose has one grammar button only
   - icon stays attached while scrolling

3. Run automated checks:

```bash
npm run build
npm test
```

4. Commit with clear message:

```bash
git add .
git commit -m "feat: short description"
```

5. Push and open a Pull Request.

## Code Expectations

- Keep Manifest V3 compatibility.
- Do not expose API tokens to content scripts or page scripts.
- Keep error messages clear and actionable for users.
- Preserve existing behavior unless change is explicit in PR description.
