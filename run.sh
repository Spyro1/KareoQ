#!/bin/bash

# Ez a szkript egyszerre indítja el a frontendet és a backendet
# fejlesztési módban.

# --- Backend indítása (Python/Uvicorn) ---

echo "--- Backend indítása (Python/Uvicorn) ---"

# Navigálás a backend mappába
cd backend

# Virtuális környezet aktiválása (feltételezve, hogy Linux/macOS a shell)
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Hiba: A 'venv' vagy '.venv' mappa nem található a 'backend' könyvtárban. Kérem, hozzon létre egy virtuális környezetet!"
    exit 1
fi

# Uvicorn szerver indítása háttérben (&) és a Process ID (PID) mentése
# A --host 0.0.0.0 beállítása gyakori a konténerizált környezetben vagy hálózati eléréshez.
# A --reload opció bekapcsolva van, ahogy kérte.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend elindítva a háttérben (PID: $BACKEND_PID). (Tipp: Általában http://localhost:8000)"

# Navigálás vissza a gyökérkönyvtárba
cd ..

# --- Leállítási mechanizmus beállítása ---
# A TRAP megfogja a Ctrl+C (SIGINT) vagy a leállítási (SIGTERM) jelet,
# és futtatja a kill parancsot a háttérben futó backend folyamaton.
trap "echo '... Leállító szkript futása...'; kill $BACKEND_PID; wait $BACKEND_PID 2>/dev/null; echo 'Backend leállítva.'; exit 0" INT TERM

# --- Frontend indítása (React/npm) ---

echo ""
echo "--- Frontend indítása (npm start) ---"

# Navigálás a frontend mappába és npm start futtatása
cd frontend
npm start
FRONTEND_EXIT_CODE=$?

# Visszatérés a gyökérkönyvtárba, és leállítjuk a backendet.
cd ..

# A frontend kilépett, leállítjuk a háttérfolyamatot.
echo ""
echo "Frontend folyamat leállt (Exit kód: $FRONTEND_EXIT_CODE). A Backend leállítása..."
kill $BACKEND_PID 2>/dev/null
wait $BACKEND_PID 2>/dev/null # Várjuk meg a backend leállását

echo "A szkript befejeződött."
exit $FRONTEND_EXIT_CODE