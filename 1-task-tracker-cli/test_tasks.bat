@echo off
:: =============================================================================
::  test_tasks.bat  —  Suite de pruebas para task-tracker-cli
::  Uso: test_tasks.bat  (desde la carpeta donde está index.js)
::  Requiere: Node.js instalado y en el PATH
:: =============================================================================
setlocal enabledelayedexpansion

set PASS=0
set FAIL=0
set TOTAL=0

echo.
echo ===================================================
echo    TASK TRACKER CLI -- Suite de Pruebas
echo ===================================================
echo.

:: Limpiar estado anterior
if exist tasks.json del tasks.json

:: =============================================================================
echo [1] Errores de validacion (deben fallar)
echo ---------------------------------------------------

call :run_test "Sin argumentos"                     fail  node index.js
call :run_test "Accion inexistente"                 fail  node index.js volar
call :run_test "add sin descripcion"                fail  node index.js add
call :run_test "add con demasiados argumentos"      fail  node index.js add "A" "B"
call :run_test "update sin argumentos"              fail  node index.js update
call :run_test "update solo con ID sin descripcion" fail  node index.js update abc-123
call :run_test "delete sin ID"                      fail  node index.js delete
call :run_test "mark-in-progress sin ID"            fail  node index.js mark-in-progress
call :run_test "mark-done sin ID"                   fail  node index.js mark-done
call :run_test "list con status invalido"           fail  node index.js list volando
call :run_test "list con dos argumentos"            fail  node index.js list todo done

:: =============================================================================
echo.
echo [2] Operaciones exitosas -- ADD
echo ---------------------------------------------------

call :run_test "add tarea 1: Revisar pull requests"       ok  node index.js add "Revisar pull requests"
call :run_test "add tarea 2: Escribir tests"              ok  node index.js add "Escribir tests"
call :run_test "add tarea 3: Actualizar documentacion"    ok  node index.js add "Actualizar documentacion"

:: =============================================================================
echo.
echo [3] Operaciones exitosas -- LIST
echo ---------------------------------------------------

call :run_test "list todas las tareas"                    ok  node index.js list
call :run_test "list filtro todo"                         ok  node index.js list todo
call :run_test "list filtro in-progress (vacio es OK)"    ok  node index.js list in-progress
call :run_test "list filtro done (vacio es OK)"           ok  node index.js list done

:: =============================================================================
echo.
echo [4] Operaciones exitosas -- UPDATE, MARK y DELETE
echo ---------------------------------------------------

:: Extraer IDs reales del tasks.json
for /f "delims=" %%i in ('node -e "const fs=require('fs');const t=JSON.parse(fs.readFileSync('tasks.json'));console.log(t[0].id);"') do set ID1=%%i
for /f "delims=" %%i in ('node -e "const fs=require('fs');const t=JSON.parse(fs.readFileSync('tasks.json'));console.log(t[1].id);"') do set ID2=%%i
for /f "delims=" %%i in ('node -e "const fs=require('fs');const t=JSON.parse(fs.readFileSync('tasks.json'));console.log(t[2].id);"') do set ID3=%%i

echo      IDs capturados:
echo        ID1 = !ID1!
echo        ID2 = !ID2!
echo        ID3 = !ID3!
echo.

call :run_test "update descripcion de tarea 1"   ok  node index.js update "!ID1!" "Revisar PRs urgentes"
call :run_test "mark-in-progress tarea 1"        ok  node index.js mark-in-progress "!ID1!"
call :run_test "mark-done tarea 2"               ok  node index.js mark-done "!ID2!"
call :run_test "delete tarea 3"                  ok  node index.js delete "!ID3!"

:: =============================================================================
echo.
echo [5] Errores sobre IDs inexistentes
echo ---------------------------------------------------

set FAKE_ID=00000000-0000-0000-0000-000000000000

call :run_test "update con ID que no existe"           fail  node index.js update "%FAKE_ID%" "Nueva descripcion"
call :run_test "delete con ID que no existe"           fail  node index.js delete "%FAKE_ID%"
call :run_test "mark-in-progress con ID inexistente"   fail  node index.js mark-in-progress "%FAKE_ID%"
call :run_test "mark-done con ID inexistente"          fail  node index.js mark-done "%FAKE_ID%"

:: =============================================================================
echo.
echo [6] Estado final de las tareas
echo ---------------------------------------------------

call :run_test "list todas (estado final)"              ok  node index.js list
call :run_test "list solo in-progress"                  ok  node index.js list in-progress
call :run_test "list solo done"                         ok  node index.js list done
call :run_test "list solo todo (debe quedar vacio)"     ok  node index.js list todo

:: =============================================================================
echo.
echo ===================================================
echo    RESULTADO FINAL
echo ===================================================
echo    Total   : %TOTAL%
echo    Pasados : %PASS%
echo    Fallidos: %FAIL%
echo ===================================================
echo.

if %FAIL% EQU 0 ( exit /b 0 ) else ( exit /b 1 )

:: =============================================================================
:: Subrutina: run_test <descripcion> <ok|fail> <comando...>
:: =============================================================================
:run_test
set DESC=%~1
set EXPECT=%~2
shift
shift

:: Construir el comando desde los argumentos restantes
set CMD=%1
:build_cmd
shift
if "%1"=="" goto exec_cmd
set CMD=%CMD% %1
goto build_cmd

:exec_cmd
set /a TOTAL+=1

:: Ejecutar y capturar salida + exit code
for /f "delims=" %%o in ('%CMD% 2^>^&1') do set OUTPUT=%%o
set EXIT_CODE=%ERRORLEVEL%

if /i "%EXPECT%"=="ok" (
    if %EXIT_CODE% EQU 0 (
        echo   [PASS] %DESC%
        echo          ^> !OUTPUT!
        set /a PASS+=1
    ) else (
        echo   [FAIL] %DESC%
        echo          ^> !OUTPUT!
        set /a FAIL+=1
    )
) else (
    if %EXIT_CODE% NEQ 0 (
        echo   [PASS] %DESC%  (error esperado)
        echo          ^> !OUTPUT!
        set /a PASS+=1
    ) else (
        echo   [FAIL] %DESC%
        echo          ^> !OUTPUT!
        set /a FAIL+=1
    )
)
goto :eof
