param([int]$FrontendPort = 3000, [int]$BackendPort = 8000)
$ErrorActionPreference = 'Stop'
$repoPath = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $repoPath '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) {
    # Reuse the existing repository-level environment after relocating this app.
    $pythonPath = Join-Path (Split-Path -Parent (Split-Path -Parent $repoPath)) '.venv/Scripts/python.exe'
}
if (-not (Test-Path -LiteralPath $pythonPath)) { throw '먼저 README의 Python 가상환경 설치를 실행하세요.' }
$env:BACKEND_URL = "http://127.0.0.1:$BackendPort"
$apiProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--app-dir','backend','--host','127.0.0.1','--port',"$BackendPort") -WorkingDirectory $repoPath -WindowStyle Hidden -PassThru
try {
    Push-Location (Split-Path -Parent (Split-Path -Parent $repoPath))
    npm run dev -- --port $FrontendPort
} finally {
    Pop-Location
    if (-not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id }
}
