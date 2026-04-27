param(
    [switch]$SeedDemo
)

$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$venvDir = Join-Path $backendDir "venv"
$pythonExe = Join-Path $venvDir "Scripts\python.exe"

function Get-PythonBootstrapCommand {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        return "py -3.12"
    }

    if (Get-Command python -ErrorAction SilentlyContinue) {
        return "python"
    }

    throw "Python was not found. Install Python 3.12 and try again."
}

function Invoke-PowerShellWindow {
    param(
        [string]$WorkingDirectory,
        [string]$Title,
        [string]$Command
    )

    Start-Process powershell -WorkingDirectory $WorkingDirectory -ArgumentList @(
        "-NoExit",
        "-Command",
        "`$host.UI.RawUI.WindowTitle = '$Title'; $Command"
    )
}

if (-not (Test-Path $backendDir)) {
    throw "Backend directory not found: $backendDir"
}

if (-not (Test-Path $frontendDir)) {
    throw "Frontend directory not found: $frontendDir"
}

if (-not (Test-Path $pythonExe)) {
    $pythonBootstrap = Get-PythonBootstrapCommand
    Write-Host "Creating backend virtual environment..."
    Push-Location $backendDir
    try {
        Invoke-Expression "$pythonBootstrap -m venv venv"
    } finally {
        Pop-Location
    }
}

Write-Host "Installing backend dependencies..."
& $pythonExe -m pip install -r (Join-Path $backendDir "requirements.txt")

Write-Host "Applying database migrations..."
Push-Location $backendDir
try {
    & $pythonExe manage.py migrate

    if ($SeedDemo) {
        Write-Host "Seeding demo data..."
        & $pythonExe manage.py seed_demo
    }
} finally {
    Pop-Location
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found. Install Node.js and npm, then try again."
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies..."
    Push-Location $frontendDir
    try {
        npm install
    } finally {
        Pop-Location
    }
}

$redisReady = $false
try {
    $redisReady = Test-NetConnection -ComputerName "127.0.0.1" -Port 6379 -InformationLevel Quiet
} catch {
    $redisReady = $false
}

if (-not $redisReady) {
    Write-Warning "Redis or Memurai does not appear to be running on 127.0.0.1:6379. Payout processing may remain on hold."
}

Write-Host "Starting backend services..."
& (Join-Path $backendDir "start-dev.ps1")

Write-Host "Starting frontend dev server..."
Invoke-PowerShellWindow -WorkingDirectory $frontendDir -Title "PlaytoPay Frontend" -Command "npm run dev"

Write-Host ""
Write-Host "Project startup complete."
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host "Backend API: http://127.0.0.1:8000"
if ($SeedDemo) {
    Write-Host "Demo data was reseeded for this run."
}
