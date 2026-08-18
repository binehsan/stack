const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's default sourceExts doesn't include `mjs`, but lucide-react-native
// ships its ESM build as .mjs files (see dist/esm/lucide-react-native.mjs,
// which re-exports every icon from its own .mjs file) — without this,
// bundling fails to resolve any of those icon imports.
config.resolver.sourceExts.push('mjs');

module.exports = config;
