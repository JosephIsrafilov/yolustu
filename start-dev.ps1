param(
    [switch]$Seed,
    [ValidateSet("webpack", "turbo")]
    [string]$FrontendBundler = "webpack",
    [switch]$NoFrontend,
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$InfraOnly,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Require-Command {
    param(
        [string]$Name,
        [string]$Hint
    )
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "[error] '$Name' not found. $Hint"
    }
}

function Ensure-FrontendEnv {
    param([string]$FrontendDir)

    $envPath = Join-Path $FrontendDir ".env.local"
    $examplePath = Join-Path $FrontendDir ".env.example"

    if (-not (Test-Path $envPath)) {
        if (Test-Path $examplePath) {
            Copy-Item -Path $examplePath -Destination $envPath
            Write-Step "[frontend] Created frontend/.env.local from .env.example"
        } else {
            New-Item -Path $envPath -ItemType File -Force | Out-Null
            Write-Step "[frontend] Created empty frontend/.env.local"
        }
    }

    $required = [ordered]@{
        "NEXT_PUBLIC_DATA_MODE" = "api"
        "NEXT_PUBLIC_API_URL" = "http://localhost:8000/api/v1"
        "NEXT_PUBLIC_WS_URL" = "ws://localhost:8000"
    }

    $lines = Get-Content -Path $envPath -ErrorAction SilentlyContinue
    if ($null -eq $lines) {
        $lines = @()
    }

    foreach ($key in $required.Keys) {
        $pattern = "^\s*$([regex]::Escape($key))\s*="
        $existing = $lines | Where-Object { $_ -match $pattern } | Select-Object -First 1
        if (-not $existing) {
            $lines += "$key=$($required[$key])"
            Write-Step "[frontend] Added missing $key to frontend/.env.local"
            continue
        }

        $currentValue = ($existing -replace "^\s*$([regex]::Escape($key))\s*=\s*", "").Trim()
        if ($currentValue -ne $required[$key]) {
            Write-Warn "[warn] frontend/.env.local has $key=$currentValue (expected $($required[$key])). Keeping user value."
        }
    }

    Set-Content -Path $envPath -Value $lines
}

function Start-DevProcessWindow {
    param(
        [string]$Title,
        [string]$Command
    )

    $arguments = @(
        "-NoExit",
        "-Command",
        "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    )

    Start-Process -FilePath "powershell.exe" -ArgumentList $arguments | Out-Null
}

function Test-PortListening {
    param([int]$Port)

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        if ($connections) {
            return $true
        }
    } catch {
        # Fallback for environments where Get-NetTCPConnection is not available.
    }

    $pattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+\d+\s*$"
    $listeners = netstat -ano -p tcp | Select-String -Pattern $pattern
    return ($listeners | Measure-Object).Count -gt 0
}

$exclusiveModes = @()
if ($FrontendOnly) { $exclusiveModes += "FrontendOnly" }
if ($BackendOnly) { $exclusiveModes += "BackendOnly" }
if ($InfraOnly) { $exclusiveModes += "InfraOnly" }
if ($Full) { $exclusiveModes += "Full" }

if ($exclusiveModes.Count -gt 1) {
    throw "[error] Use only one of -FrontendOnly, -BackendOnly, -InfraOnly, -Full."
}

if ($NoFrontend -and $FrontendOnly) {
    throw "[error] -NoFrontend cannot be combined with -FrontendOnly."
}

if ($NoFrontend -and $Full) {
    throw "[error] -NoFrontend cannot be combined with -Full."
}

$runInfra = $true
$runBackend = $true
$runFrontend = $true

if ($FrontendOnly) {
    $runInfra = $false
    $runBackend = $false
    $runFrontend = $true
} elseif ($BackendOnly) {
    $runInfra = $true
    $runBackend = $true
    $runFrontend = $false
} elseif ($InfraOnly) {
    $runInfra = $true
    $runBackend = $false
    $runFrontend = $false
} elseif ($Full) {
    $runInfra = $true
    $runBackend = $true
    $runFrontend = $true
}

if ($NoFrontend) {
    $runFrontend = $false
}

if ($Seed -and -not $runBackend) {
    Write-Warn "[warn] -Seed was provided, but backend is disabled in this mode. Seed will be skipped."
}

$repoRoot = $PSScriptRoot
if (-not $repoRoot) {
    throw "[error] Unable to detect script directory."
}
Set-Location -Path $repoRoot

$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

Write-Step "[check] Running from $repoRoot"
Write-Step "[mode] Infra=$runInfra Backend=$runBackend Frontend=$runFrontend FrontendBundler=$FrontendBundler"

if ($runInfra -or $runBackend) {
    Require-Command -Name "docker" -Hint "Install Docker Desktop and ensure it is on PATH."
    Write-Step "[check] Docker found"

    try {
        docker info *> $null
    } catch {
        throw "[error] Docker daemon is not running. Start Docker Desktop first."
    }

    try {
        docker compose version *> $null
    } catch {
        throw "[error] 'docker compose' is not available. Update Docker Desktop / Compose plugin."
    }
}

if ($runFrontend) {
    Require-Command -Name "node" -Hint "Install Node.js 20+."
    Require-Command -Name "npm" -Hint "Install npm (bundled with Node.js)."
    Write-Step "[check] Node/npm found"

    Ensure-FrontendEnv -FrontendDir $frontendDir

    if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
        Write-Step "[frontend] node_modules not found, running npm install"
        Push-Location $frontendDir
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "[error] npm install failed"
            }
        } finally {
            Pop-Location
        }
    }
}

$venvPython = $null
if ($runBackend) {
    Require-Command -Name "python" -Hint "Install Python 3.11+."
    Write-Step "[check] Python found"

    $venvDirCandidates = @(
        (Join-Path $backendDir "venv"),
        (Join-Path $backendDir ".venv")
    )
    $venvDir = $venvDirCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $venvDir) {
        throw "[error] Backend virtual environment not found at backend/venv or backend/.venv."
    }

    $venvPython = Join-Path $venvDir "Scripts\python.exe"
    if (-not (Test-Path $venvPython)) {
        throw "[error] Python executable not found in backend venv: $venvPython"
    }
    Write-Step "[check] Backend venv found at $venvDir"
}

if ($runInfra) {
    Write-Step "[infra] Starting Docker services (db, redis)"
    docker compose up -d db redis
    if ($LASTEXITCODE -ne 0) {
        throw "[error] Failed to start Docker services"
    }
}

if ($runBackend -and $runInfra) {
    Write-Step "[infra] Stopping Docker backend container if it exists"
    docker compose stop backend *> $null
}

if ($runBackend) {
    Write-Step "[backend] Running migrations"
    $migrationSucceeded = $false
    for ($attempt = 1; $attempt -le 20; $attempt++) {
        Push-Location $backendDir
        try {
            & $venvPython -m alembic upgrade head
            if ($LASTEXITCODE -eq 0) {
                $migrationSucceeded = $true
                break
            }
        } catch {
            # Retry while DB is still starting.
        } finally {
            Pop-Location
        }
        Write-Warn "[backend] Migration attempt $attempt/20 failed, waiting for database..."
        Start-Sleep -Seconds 3
    }

    if (-not $migrationSucceeded) {
        throw "[error] Alembic migration failed after multiple attempts."
    }

    if ($Seed) {
        Write-Step "[backend] Running seed.py"
        Push-Location $backendDir
        try {
            & $venvPython seed.py
            if ($LASTEXITCODE -ne 0) {
                throw "[error] seed.py failed"
            }
        } finally {
            Pop-Location
        }
    }
}

$startedFrontend = $false
$startedBackend = $false
$skippedFrontendPortBusy = $false

if ($runBackend) {
    $backendCommand = "Set-Location '$backendDir'; & '$venvPython' -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    Write-Step "[backend] Starting API"
    Start-DevProcessWindow -Title "Yolmates Backend" -Command $backendCommand
    $startedBackend = $true
}

if ($runFrontend) {
    if (Test-PortListening -Port 3000) {
        Write-Warn "[frontend] Port 3000 is already in use. Skipping frontend startup to avoid duplicate dev server."
        $skippedFrontendPortBusy = $true
    } else {
        $frontendScript = if ($FrontendBundler -eq "webpack") { "dev:lowmem" } else { "dev" }
        $frontendCommand = "Set-Location '$frontendDir'; npm run $frontendScript"
        Write-Step "[frontend] Starting Next.js via npm run $frontendScript"
        Start-DevProcessWindow -Title "Yolmates Frontend" -Command $frontendCommand
        $startedFrontend = $true
    }
}

if ($startedBackend) {
    Write-Step "[done] Backend:  http://localhost:8000"
    Write-Step "[done] API docs: http://localhost:8000/docs"
}

if ($startedFrontend) {
    Write-Step "[done] Frontend: http://localhost:3000"
} elseif ($runFrontend -and $skippedFrontendPortBusy) {
    Write-Step "[done] Frontend launch skipped because port 3000 is busy."
}

if ($runBackend) {
    if ($Seed) {
        Write-Step "[done] Seed was executed."
    } else {
        Write-Step "[done] Seed skipped (use -Seed to run it)."
    }
}
