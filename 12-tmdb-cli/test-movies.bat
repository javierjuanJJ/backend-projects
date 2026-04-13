@echo off
REM ============================================================
REM test-movies.bat
REM Batería de pruebas para la CLI movies.js
REM Cubre: aciertos OK | fallos esperados WARN | errores ERR
REM Uso: test-movies.bat
REM ============================================================

setlocal enabledelayedexpansion

REM Contadores
set PASS=0
set FAIL=0

echo.
echo ==========================================
echo   BLOQUE 1 - ACIERTOS ESPERADOS (exit 0)
echo ==========================================
echo.

call :run_test "Tipo 'playing' valido"  0 "node movies.js --type playing"
call :run_test "Tipo 'popular' valido"  0 "node movies.js --type popular"
call :run_test "Tipo 'top' valido"      0 "node movies.js --type top"
call :run_test "Tipo 'upcoming' valido" 0 "node movies.js --type upcoming"

echo.
echo ==========================================
echo   BLOQUE 2 - FALLOS CONTROLADOS (exit 1)
echo ==========================================
echo.

call :run_test "Sin argumentos"                 1 "node movies.js"
call :run_test "Sin valor tras --type"          1 "node movies.js --type"
call :run_test "Tipo inexistente 'trending'"    1 "node movies.js --type trending"
call :run_test "Tipo con mayusculas 'PLAYING'"  1 "node movies.js --type PLAYING"
call :run_test "Tipo con mayusculas 'Popular'"  1 "node movies.js --type Popular"
call :run_test "Argumento desconocido --filter" 1 "node movies.js --filter playing"
call :run_test "Numero como tipo"               1 "node movies.js --type 123"
call :run_test "Caracter especial como tipo"    1 "node movies.js --type @popular"

echo.
echo ==========================================
echo   BLOQUE 3 - ERRORES DE ENTORNO (exit 1)
echo ==========================================
echo.

REM Guarda el token original para restaurarlo al final
set ORIGINAL_TOKEN=%TMDB_TOKEN%

set TMDB_TOKEN=token_falso
call :run_test "Token invalido en TMDB_TOKEN" 1 "node movies.js --type popular"

set TMDB_TOKEN=
call :run_test "Token vacio en TMDB_TOKEN"    1 "node movies.js --type top"

REM Restaura el token original
set TMDB_TOKEN=%ORIGINAL_TOKEN%

REM ============================================================
REM RESUMEN FINAL
REM ============================================================
echo.
echo ==========================================
echo   RESUMEN DE PRUEBAS
echo ==========================================
echo   OK  Pasados : %PASS%
echo   ERR Fallados: %FAIL%
set /a TOTAL=%PASS%+%FAIL%
echo   Total   : %TOTAL%
echo ==========================================
echo.

if %FAIL%==0 ( exit /b 0 ) else ( exit /b 1 )

REM ============================================================
REM :run_test  descripcion  exit_esperado  comando
REM ============================================================
:run_test
set DESC=%~1
set EXPECTED=%~2
set CMD=%~3

echo ----------------------------------------
echo TEST: %DESC%
echo CMD : %CMD%

REM Ejecuta el comando y captura el exit code
%CMD% >nul 2>&1
set ACTUAL=%ERRORLEVEL%

if %ACTUAL%==%EXPECTED% (
  echo RESULTADO: OK  ^(exit %ACTUAL% como esperado^)
  set /a PASS+=1
) else (
  echo RESULTADO: FALLO ^(esperado %EXPECTED%, obtenido %ACTUAL%^)
  set /a FAIL+=1
)
echo.
goto :eof
