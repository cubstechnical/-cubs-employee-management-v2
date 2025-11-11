#!/usr/bin/env bash

set -euo pipefail

echo "=== Codemagic pre-build: remove Capacitor server.url if present ==="

# 1) ensure node is available
node -v || { echo "Node missing"; exit 1; }

# Try JSON first (common in many repos)
JSON_CONFIG="capacitor.config.json"
TS_CONFIG="capacitor.config.ts"

if [ -f "$JSON_CONFIG" ]; then
  echo "Found $JSON_CONFIG; removing server.url if present..."
  node -e "
const fs = require('fs');
const p = '$JSON_CONFIG';
const raw = fs.readFileSync(p, 'utf8');
let cfg = JSON.parse(raw);
if (cfg.server) {
  if (cfg.server.url) {
    console.log('Removing server.url ->', cfg.server.url);
    delete cfg.server.url;
  } else {
    console.log('No server.url present.');
  }
  if (Object.keys(cfg.server).length === 0) {
    delete cfg.server;
    console.log('Removed empty server block.');
  }
} else {
  console.log('No server block present.');
}
fs.writeFileSync(p, JSON.stringify(cfg, null, 2));
console.log('Updated', p);
"
  echo "=== $JSON_CONFIG after modification ==="
  cat "$JSON_CONFIG" || true
  echo "======================================"
elif [ -f "$TS_CONFIG" ]; then
  echo "Found $TS_CONFIG; attempting to remove any server.url patterns via sed..."
  # This removes common patterns where url is defined inside a server block
  # Safe no-op if pattern not present
  sed -i.bak -E "s/url:\\s*'[^']*'\\s*,?//g" "$TS_CONFIG" || true
  sed -i.bak -E "s/url:\\s*\"[^\"]*\"\\s*,?//g" "$TS_CONFIG" || true
  # Optionally remove empty server: {} if it becomes empty (best-effort)
  sed -i.bak -E "s/server:\\s*\\{\\s*\\}\\s*,?/ /g" "$TS_CONFIG" || true
  echo "=== $TS_CONFIG after modification (diff vs .bak) ==="
  diff -u "$TS_CONFIG.bak" "$TS_CONFIG" || true
  echo "==================================================="
else
  echo "WARNING: Neither $JSON_CONFIG nor $TS_CONFIG found. Ensure Capacitor config exists at repo root."
fi

echo "Running npx cap sync android && npx cap sync ios"
npx cap sync android || true
npx cap sync ios || true

echo "Pre-build script finished successfully."


