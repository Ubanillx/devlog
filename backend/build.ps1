# DevLog Backend Cross-Compile Script for Linux
# Usage: .\build.ps1 [arch]
# arch: amd64 (default), arm64

param(
    [string]$Arch = "amd64"
)

$ErrorActionPreference = "Stop"

# Validate architecture
$validArchs = @("amd64", "arm64")
if ($Arch -notin $validArchs) {
    Write-Host "Invalid architecture: $Arch" -ForegroundColor Red
    Write-Host "Valid options: $($validArchs -join ', ')" -ForegroundColor Yellow
    exit 1
}

# Output filename
$outputName = "devlog-server-linux-$Arch"

Write-Host "Building for Linux/$Arch..." -ForegroundColor Cyan

# Set environment and build
$env:GOOS = "linux"
$env:GOARCH = $Arch
$env:CGO_ENABLED = "0"

try {
    go build -ldflags="-s -w" -o $outputName .
    
    if ($LASTEXITCODE -eq 0) {
        $fileInfo = Get-Item $outputName
        $sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "`n✓ Build successful!" -ForegroundColor Green
        Write-Host "  Output: $outputName" -ForegroundColor White
        Write-Host "  Size:   $sizeMB MB" -ForegroundColor White
    } else {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
} finally {
    # Reset environment
    Remove-Item Env:GOOS -ErrorAction SilentlyContinue
    Remove-Item Env:GOARCH -ErrorAction SilentlyContinue
    Remove-Item Env:CGO_ENABLED -ErrorAction SilentlyContinue
}
