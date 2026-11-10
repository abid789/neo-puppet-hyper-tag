// scripts/patch-rollup.cjs
// Ensures Rollup falls back to @rollup/wasm-node when Windows Application Control blocks native DLLs.

const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

try {
  if (fs.existsSync(targetPath)) {
    let content = fs.readFileSync(targetPath, 'utf8');
    if (!content.includes('@rollup/wasm-node/dist/native.js')) {
      content = content.replace(
        'const nativeModule = requireWithFriendlyError(',
        `let nativeModule;\ntry { nativeModule = requireWithFriendlyError(`,
      );
      content = content.replace(
        'existsSync(path.join(__dirname, localName)) ? localName : `@rollup/rollup-${packageBase}`\n);',
        `existsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`\n  );\n} catch (_err) {\n  nativeModule = require('@rollup/wasm-node/dist/native.js');\n}`,
      );
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log('[patch-rollup] Successfully patched Rollup native.js for WASM fallback.');
    }
  }
} catch (err) {
  console.warn('[patch-rollup] Notice:', err.message);
}
