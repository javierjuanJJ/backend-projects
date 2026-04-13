#!/usr/bin/env bash
# =============================================================================
#  test_tasks.sh  —  Suite de pruebas para task-tracker-cli
#  Uso: bash test_tasks.sh
#  Requiere: Node.js instalado y este script en la misma carpeta que index.js
# =============================================================================

# ── Colores ──────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

PASS=0
FAIL=0
TOTAL=0

# ── Helpers ───────────────────────────────────────────────────────────────────

# run_test <descripción> <expect_exit_0|expect_exit_1> <comando...>
#   expect_exit_0 → esperamos éxito (exit code 0)
#   expect_exit_1 → esperamos error  (exit code != 0)
run_test() {
    local desc="$1"
    local expect="$2"
    shift 2

    TOTAL=$((TOTAL + 1))
    OUTPUT=$("$@" 2>&1)
    EXIT_CODE=$?

    if [ "$expect" = "expect_exit_0" ] && [ $EXIT_CODE -eq 0 ]; then
        echo -e "  ${GREEN}✔ PASS${RESET}  $desc"
        echo -e "         ${CYAN}↳ $OUTPUT${RESET}"
        PASS=$((PASS + 1))
    elif [ "$expect" = "expect_exit_1" ] && [ $EXIT_CODE -ne 0 ]; then
        echo -e "  ${GREEN}✔ PASS${RESET}  $desc  ${YELLOW}(error esperado)${RESET}"
        echo -e "         ${CYAN}↳ $OUTPUT${RESET}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}✘ FAIL${RESET}  $desc"
        echo -e "         ${CYAN}↳ $OUTPUT${RESET}"
        FAIL=$((FAIL + 1))
    fi
}

# ── Preparar entorno limpio ───────────────────────────────────────────────────
echo -e "\n${BOLD}═══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}   TASK TRACKER CLI — Suite de Pruebas              ${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}\n"

# Borrar tasks.json si existe para partir de cero
rm -f tasks.json

# =============================================================================
echo -e "${BOLD}▶ 1. Errores de validación (deben fallar)${RESET}"
# =============================================================================

run_test "Sin argumentos"                     expect_exit_1  node index.js
run_test "Acción inexistente"                 expect_exit_1  node index.js volar
run_test "add sin descripción"                expect_exit_1  node index.js add
run_test "add con demasiados argumentos"      expect_exit_1  node index.js add "A" "B"
run_test "update sin argumentos"              expect_exit_1  node index.js update
run_test "update solo con ID (sin desc)"      expect_exit_1  node index.js update abc-123
run_test "delete sin ID"                      expect_exit_1  node index.js delete
run_test "mark-in-progress sin ID"            expect_exit_1  node index.js mark-in-progress
run_test "mark-done sin ID"                   expect_exit_1  node index.js mark-done
run_test "list con status inválido"           expect_exit_1  node index.js list volando
run_test "list con dos argumentos"            expect_exit_1  node index.js list todo done

# =============================================================================
echo -e "\n${BOLD}▶ 2. Operaciones exitosas — ADD${RESET}"
# =============================================================================

run_test "add tarea 1: 'Revisar pull requests'"   expect_exit_0  node index.js add "Revisar pull requests"
run_test "add tarea 2: 'Escribir tests'"          expect_exit_0  node index.js add "Escribir tests"
run_test "add tarea 3: 'Actualizar documentación'" expect_exit_0 node index.js add "Actualizar documentación"

# =============================================================================
echo -e "\n${BOLD}▶ 3. Operaciones exitosas — LIST${RESET}"
# =============================================================================

run_test "list todas las tareas"         expect_exit_0  node index.js list
run_test "list filtro 'todo'"            expect_exit_0  node index.js list todo
run_test "list filtro 'in-progress' (vacío es OK)"  expect_exit_0  node index.js list in-progress
run_test "list filtro 'done'      (vacío es OK)"    expect_exit_0  node index.js list done

# =============================================================================
echo -e "\n${BOLD}▶ 4. Operaciones exitosas — UPDATE, MARK y DELETE${RESET}"
# =============================================================================

# Extraemos el ID de la primera tarea del JSON
ID1=$(node -e "const fs=require('fs'); const t=JSON.parse(fs.readFileSync('tasks.json')); console.log(t[0].id);")
ID2=$(node -e "const fs=require('fs'); const t=JSON.parse(fs.readFileSync('tasks.json')); console.log(t[1].id);")
ID3=$(node -e "const fs=require('fs'); const t=JSON.parse(fs.readFileSync('tasks.json')); console.log(t[2].id);")

echo -e "     ${CYAN}IDs capturados → ID1=$ID1  ID2=$ID2  ID3=$ID3${RESET}"

run_test "update descripción de tarea 1"   expect_exit_0  node index.js update "$ID1" "Revisar PRs urgentes"
run_test "mark-in-progress tarea 1"        expect_exit_0  node index.js mark-in-progress "$ID1"
run_test "mark-done tarea 2"               expect_exit_0  node index.js mark-done "$ID2"
run_test "delete tarea 3"                  expect_exit_0  node index.js delete "$ID3"

# =============================================================================
echo -e "\n${BOLD}▶ 5. Errores sobre IDs inexistentes${RESET}"
# =============================================================================

FAKE_ID="00000000-0000-0000-0000-000000000000"

run_test "update con ID que no existe"          expect_exit_1  node index.js update "$FAKE_ID" "Nueva descripción"
run_test "delete con ID que no existe"          expect_exit_1  node index.js delete "$FAKE_ID"
run_test "mark-in-progress con ID inexistente"  expect_exit_1  node index.js mark-in-progress "$FAKE_ID"
run_test "mark-done con ID inexistente"         expect_exit_1  node index.js mark-done "$FAKE_ID"

# =============================================================================
echo -e "\n${BOLD}▶ 6. Estado final de las tareas${RESET}"
# =============================================================================

run_test "list todas (estado final)"      expect_exit_0  node index.js list
run_test "list solo 'in-progress'"        expect_exit_0  node index.js list in-progress
run_test "list solo 'done'"               expect_exit_0  node index.js list done
run_test "list solo 'todo' (debe quedar vacío)" expect_exit_0 node index.js list todo

# =============================================================================
echo -e "\n${BOLD}═══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}   RESULTADO FINAL${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}"
echo -e "   Total : $TOTAL"
echo -e "   ${GREEN}✔ Pasados : $PASS${RESET}"
echo -e "   ${RED}✘ Fallidos: $FAIL${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════${RESET}\n"

[ $FAIL -eq 0 ] && exit 0 || exit 1
