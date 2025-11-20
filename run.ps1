<#
.SYNOPSIS
Elindítja a backendet (Python/Uvicorn) háttérben, majd a frontendet (npm start) az előtérben.
A backend leáll a szkript befejezésekor vagy Ctrl+C megszakításkor.
#>

# Set console output encoding to UTF-8 to display Hungarian characters correctly
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# --- Függvény a backend folyamat leállítására ---
function Stop-Backend {
    param(
        [Parameter(Mandatory=$true)]
        [int]$PID
    )
    if (Get-Process -Id $PID -ErrorAction SilentlyContinue) {
        Write-Host "`nFrontend folyamat leállt. A Backend leállítása (PID: $PID)..." -ForegroundColor Yellow
        Stop-Process -Id $PID -Force
        # Várjuk meg a leállást, de ne fagyjunk le, ha már leállt
        1..10 | ForEach-Object {
            if (-not (Get-Process -Id $PID -ErrorAction SilentlyContinue)) {
                break
            }
            Start-Sleep -Milliseconds 200
        }
        Write-Host "Backend leállítva." -ForegroundColor Yellow
    }
}

# --- Backend indítása (Python/Uvicorn) ---

Write-Host "--- Backend indítása (Python/Uvicorn) ---" -ForegroundColor Cyan

# Virtuális környezet aktiválási szkriptjének útvonala
$VenvPath = $null
if (Test-Path -Path "backend\venv\Scripts\Activate.ps1") {
    $VenvPath = "backend\venv\Scripts\Activate.ps1"
} elseif (Test-Path -Path "backend\.venv\Scripts\Activate.ps1") {
    $VenvPath = "backend\.venv\Scripts\Activate.ps1"
}

if ($VenvPath -eq $null) {
    Write-Error "Hiba: A 'venv' vagy '.venv' mappa nem található a 'backend' könyvtárban, vagy az 'Activate.ps1' hiányzik. Kérem, hozzon létre egy virtuális környezetet!"
    exit 1
}

# Aktiváljuk a környezetet (ezt egy új PowerShellell sessionben kell megtenni,
# de mivel az uvicorn-t indítjuk, egyszerűbb a teljes parancsot futtatni a venv-ben lévő futtatható fájllal.)

# Indítjuk az Uvicorn-t egy új, háttérben futó folyamatként (Start-Process)
# A teljes elérési utat használjuk a Python venv-ben lévő uvicornhoz
$UvicornPath = "backend\venv\Scripts\uvicorn.exe"
if (-not (Test-Path -Path $UvicornPath)) {
    # Próbáljuk ki a .venv elérési utat
    $UvicornPath = "backend\.venv\Scripts\uvicorn.exe"
    if (-not (Test-Path -Path $UvicornPath)) {
        Write-Error "Hiba: Az 'uvicorn.exe' nem található a virtuális környezetben. Telepítse a pip install uvicorn parancssal."
        exit 1
    }
}

$BackendArgs = "app.main:app --reload --host 0.0.0.0 --port 8000"

# Indítás az uvicorn futtatható fájljával a venv-ből
$BackendProcess = Start-Process -FilePath $UvicornPath -ArgumentList $BackendArgs -NoNewWindow -PassThru

# PID mentése
$BACKEND_PID = $BackendProcess.Id
Write-Host "Backend elindítva a háttérben (PID: $BACKEND_PID). (Tipp: Általában http://localhost:8000)" -ForegroundColor Green

# --- Trap beállítása Ctrl+C-re (kimenet tisztítása a szkript végén) ---
# Ha a felhasználó megszakítja a szkriptet (Ctrl+C), ez a blokk lefut.
trap {
    Stop-Backend -PID $BACKEND_PID
    exit 0
} ([System.Console]::CancelKeyPress)

# --- Frontend indítása (React/npm) ---

Write-Host "`n--- Frontend indítása (npm start) ---" -ForegroundColor Cyan

# Navigálás a frontend mappába és npm start futtatása az előtérben
Push-Location -Path "frontend"
try {
    # Futtassuk az npm parancsot. Az 'npm start' blokkolja a szkriptet, amíg a felhasználó le nem állítja.
    npm start
    $FRONTEND_EXIT_CODE = $LASTEXITCODE
}
finally {
    # Navigálás vissza a gyökérkönyvtárba
    Pop-Location
}

# --- Tisztítás ---
# Ez a rész lefut, ha az npm start leállt (nem Ctrl+C-vel, hanem pl. hibával, vagy a felhasználó kilépett a futó process-ből).
Stop-Backend -PID $BACKEND_PID

exit $FRONTEND_EXIT_CODE