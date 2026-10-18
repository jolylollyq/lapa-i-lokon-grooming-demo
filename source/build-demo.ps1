$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'node_modules/typescript/bin/tsc') -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node (Join-Path $PSScriptRoot 'node_modules/vite/bin/vite.js') build
exit $LASTEXITCODE
