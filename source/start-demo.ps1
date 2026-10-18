$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'node_modules/vite/bin/vite.js') --host 127.0.0.1
