# Security Audit Script
# This script runs various security and lint checks for the project.
# It can be invoked via `npm run audit`.

# Exit on any error
$ErrorActionPreference = "Stop"

Write-Host "Running npm audit..."
npm audit

Write-Host "Running ESLint lint..."
npm run lint

# Optional: Secret scanning with trufflehog (if installed)
if (Get-Command trufflehog -ErrorAction SilentlyContinue) {
    Write-Host "Running trufflehog secret scan..."
    trufflehog .
} else {
    Write-Host "trufflehog not installed; skipping secret scan."
}

# Optional: Docker image scanning (if Dockerfile exists)
if (Test-Path "Dockerfile") {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        Write-Host "Scanning Docker image..."
        docker build -t temp-image .
        docker scan temp-image
    } else {
        Write-Host "Docker not available; skipping Docker scan."
    }
}

Write-Host "Security audit completed successfully."
