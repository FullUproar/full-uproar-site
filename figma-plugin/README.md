# Full Uproar Figma Importer Plugin

Import Full Uproar website pages directly into Figma using the html.to.design API.

## Setup

### 1. Add API Key to Environment

Add your html.to.design API key to your `.env.local`:

```env
HTML_TO_DESIGN_API_KEY=your_api_key_here
```

### 2. Install Plugin in Figma

1. Open Figma Desktop app
2. Go to **Plugins** → **Development** → **Import plugin from manifest**
3. Navigate to this `figma-plugin` folder and select `manifest.json`
4. The plugin "Full Uproar Importer" will appear in your plugins

### 3. Use the Plugin

1. Open any Figma file
2. Right-click → **Plugins** → **Development** → **Full Uproar Importer**
3. Enter URLs to import (one per line) or use quick-add buttons
4. Click **Import to Figma**

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch for changes
npm run watch
```

## How It Works

1. Plugin UI sends URLs to the Full Uproar backend (`/api/admin/figma/html-to-design`)
2. Backend fetches HTML from each URL
3. Backend sends HTML to html.to.design API
4. API returns Figma-compatible model + images
5. Plugin paints the model to the Figma canvas

## Troubleshooting

### "API key not configured"
- Ensure `HTML_TO_DESIGN_API_KEY` is set in your environment variables
- Restart the dev server after adding the key

### "Cannot connect to backend"
- For local dev: Use `http://localhost:3000` as backend URL
- For production: Use `https://fulluproar.com`
- Ensure you're logged in as admin (API requires admin permission)

### Images not loading
- Some images may require additional CORS handling
- Check browser console for specific errors
