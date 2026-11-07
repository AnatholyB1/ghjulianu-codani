// Tiny TS/TSX loader for local verification scripts (no esbuild/tsx in this repo).
// Usage: node --conditions=react-server --import ./scripts/ts-register.mjs <script>
// Handles: extensionless relative imports, the `@/` alias, `.ts/.tsx` transpilation (JSX automatic).
import { register } from 'node:module';
register(new URL('./ts-loader-hooks.mjs', import.meta.url));
