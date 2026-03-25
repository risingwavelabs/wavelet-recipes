# Wavelet Recipes

Ready-to-run examples for [Wavelet](https://github.com/risingwavelabs/wavelet) -- the reactive backend for agents and apps.

Each recipe is a self-contained project. Install, run, open the browser. Data generates automatically.

## Recipes

| Recipe | Description |
|---|---|
| [saas-dashboard](saas-dashboard/) | Real-time SaaS revenue dashboard with per-tenant filtering |

## Quick Start

```bash
# Install RisingWave
curl -L https://risingwave.com/sh | sh

# Clone and run a recipe
git clone https://github.com/risingwavelabs/wavelet-recipes.git
cd wavelet-recipes/saas-dashboard
npm install
npx wavelet dev --config wavelet.config.ts &
node seed.js &
open index.html
```

## Adding a Recipe

Each recipe directory contains:

- `wavelet.config.ts` -- streams, views, JWT config
- `index.html` -- frontend that subscribes to views
- `seed.js` -- data generator that feeds the streams
- `README.md` -- what the recipe demonstrates

## License

Apache 2.0. See [LICENSE](./LICENSE).
