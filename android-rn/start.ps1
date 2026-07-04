# Expo startup script - redirects .expo cache to project folder
# Usage:  .\start.ps1

$ErrorActionPreference = "Stop"

$projectDir = $PSScriptRoot
if (-not $projectDir) { $projectDir = (Get-Location).Path }

$expoHome = Join-Path -Path $projectDir -ChildPath ".expo"
$env:EXPO_HOME = $expoHome
$env:EXPO_NO_CACHE = "1"
$env:EXPO_NO_TELEMETRY = "1"

$traeNode = "C:\Users\Admin\AppData\Roaming\TRAE SOLO CN\ModularData\ai-agent\vm\tools\node"
if (Test-Path -LiteralPath $traeNode) {
    $env:PATH = "$traeNode;" + $env:PATH
}

Write-Host "Project dir: $projectDir" -ForegroundColor Cyan
Write-Host "Expo home:   $env:EXPO_HOME" -ForegroundColor Cyan
Write-Host "Starting Expo..." -ForegroundColor Cyan
Write-Host ""

npx expo start
