#!/bin/bash

# ============================================================
# test-movies.sh
# Batería de pruebas para la CLI movies.js
# Cubre: aciertos ✅ | fallos esperados ⚠️ | errores ❌
# Uso: bash test-movies.sh
# ============================================================

# Colores para la salida en terminal
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

# Contadores de resultados
PASS=0
FAIL=0
ERROR=0

# ------------------------------------------------------------
# Función helper: ejecuta un comando y comprueba el exit code
#   $1 = descripción del test
#   $2 = exit code esperado (0 = éxito, 1 = fallo controlado)
#   $3 = comando a ejecutar (como string)
# ------------------------------------------------------------
run_test() {
  local description="$1"
  local expected_exit="$2"
  local command="$3"

  echo -e "${CYAN}────────────────────────────────────────${RESET}"
  echo -e "🧪  TEST: ${description}"
  echo -e "    CMD:  ${command}"

  # Ejecuta el comando y captura salida + exit code
  output=$(eval "$command" 2>&1)
  actual_exit=$?

  echo -e "    OUT:  ${output:0:120}"   # muestra los primeros 120 chars

  if [ "$actual_exit" -eq "$expected_exit" ]; then
    echo -e "    ${GREEN}✅  RESULTADO: OK (exit $actual_exit como esperado)${RESET}"
    ((PASS++))
  else
    echo -e "    ${RED}❌  RESULTADO: FALLO (esperado exit $expected_exit, obtenido $actual_exit)${RESET}"
    ((FAIL++))
  fi

  echo ""
}

# ============================================================
# BLOQUE 1 — ACIERTOS ✅
# Tipos válidos con --type correcto → exit 0
# ============================================================
echo -e "\n${GREEN}══════════════════════════════════════════${RESET}"
echo -e "${GREEN}  BLOQUE 1 · ACIERTOS ESPERADOS (exit 0)  ${RESET}"
echo -e "${GREEN}══════════════════════════════════════════${RESET}\n"

run_test "Tipo 'playing' válido"   0 "node movies.js --type playing"
run_test "Tipo 'popular' válido"   0 "node movies.js --type popular"
run_test "Tipo 'top' válido"       0 "node movies.js --type top"
run_test "Tipo 'upcoming' válido"  0 "node movies.js --type upcoming"

# ============================================================
# BLOQUE 2 — FALLOS CONTROLADOS ⚠️
# Entradas incorrectas que la app debe rechazar → exit 1
# ============================================================
echo -e "\n${YELLOW}══════════════════════════════════════════${RESET}"
echo -e "${YELLOW}  BLOQUE 2 · FALLOS CONTROLADOS (exit 1)  ${RESET}"
echo -e "${YELLOW}══════════════════════════════════════════${RESET}\n"

run_test "Sin argumentos"                          1 "node movies.js"
run_test "Sin valor tras --type"                   1 "node movies.js --type"
run_test "Tipo inexistente 'trending'"             1 "node movies.js --type trending"
run_test "Tipo con mayúsculas 'PLAYING'"           1 "node movies.js --type PLAYING"
run_test "Tipo con mayúsculas 'Popular'"           1 "node movies.js --type Popular"
run_test "Tipo vacío (string vacío)"               1 "node movies.js --type ''"
run_test "Argumento desconocido --filter"          1 "node movies.js --filter playing"
run_test "Número como tipo"                        1 "node movies.js --type 123"
run_test "Carácter especial como tipo"             1 "node movies.js --type @popular"
run_test "Tipo con espacios"                       1 "node movies.js --type 'now playing'"

# ============================================================
# BLOQUE 3 — ERRORES DE ENTORNO ❌
# Simula token inválido o ausente → la API devuelve 401/error
# ============================================================
echo -e "\n${RED}══════════════════════════════════════════${RESET}"
echo -e "${RED}  BLOQUE 3 · ERRORES DE ENTORNO (exit 1)  ${RESET}"
echo -e "${RED}══════════════════════════════════════════${RESET}\n"

run_test "Token inválido en TMDB_TOKEN"   1 "TMDB_TOKEN=token_falso node movies.js --type popular"
run_test "Token vacío en TMDB_TOKEN"      1 "TMDB_TOKEN='' node movies.js --type top"
run_test "Sin variable TMDB_TOKEN"        1 "TMDB_TOKEN= node movies.js --type upcoming"

# ============================================================
# RESUMEN FINAL
# ============================================================
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "  RESUMEN DE PRUEBAS"
echo -e "${CYAN}══════════════════════════════════════════${RESET}"
echo -e "  ${GREEN}✅  Pasados : ${PASS}${RESET}"
echo -e "  ${RED}❌  Fallados: ${FAIL}${RESET}"
echo -e "  Total   : $((PASS + FAIL))"
echo -e "${CYAN}══════════════════════════════════════════${RESET}\n"

# Exit code global: 0 si todos pasaron, 1 si alguno falló
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
