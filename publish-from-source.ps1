$ErrorActionPreference = 'Stop'

$sourcePath = Join-Path $PSScriptRoot 'source'
$distPath = Join-Path $sourcePath 'dist'
$rootAssetPath = Join-Path $PSScriptRoot 'assets'

Push-Location $sourcePath
try {
    & (Join-Path $sourcePath 'build-demo.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'Source build failed.' }
} finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $distPath -PathType Container)) {
    throw 'The source build did not create the dist folder.'
}

Get-ChildItem -LiteralPath $distPath -Force | ForEach-Object {
    $destinationPath = Join-Path $PSScriptRoot $_.Name
    if ($_.PSIsContainer) {
        New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        Get-ChildItem -LiteralPath $_.FullName -Force | ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Recurse -Force
        }
    } else {
        Copy-Item -LiteralPath $_.FullName -Destination $destinationPath -Force
    }
}

$currentBundles = @(
    Get-ChildItem -LiteralPath (Join-Path $distPath 'assets') -File |
        Where-Object { $_.Name -match '^index-.*\.(js|css)$' } |
        ForEach-Object { $_.Name }
)

if (Test-Path -LiteralPath $rootAssetPath -PathType Container) {
    Get-ChildItem -LiteralPath $rootAssetPath -File |
        Where-Object { $_.Name -match '^index-.*\.(js|css)$' -and $_.Name -notin $currentBundles } |
        Remove-Item -Force
}
