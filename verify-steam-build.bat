@echo off
echo ========================================
echo Steam Build Verification Tool
echo ========================================
echo.

set "BUILD_DIR=dist\win-unpacked"

if not exist "%BUILD_DIR%" (
    echo ERROR: Build directory not found!
    echo Please run build-steam.bat first.
    pause
    exit /b 1
)

echo Checking required files...
echo.

set "ALL_OK=1"

REM Check for main executable
if exist "%BUILD_DIR%\Million Card Game.exe" (
    echo [OK] Million Card Game.exe found
) else (
    echo [FAIL] Million Card Game.exe NOT FOUND
    set "ALL_OK=0"
)

REM Check for critical DLLs
if exist "%BUILD_DIR%\ffmpeg.dll" (
    echo [OK] ffmpeg.dll found
) else (
    echo [FAIL] ffmpeg.dll NOT FOUND - This will cause Steam review failure!
    set "ALL_OK=0"
)

if exist "%BUILD_DIR%\libEGL.dll" (
    echo [OK] libEGL.dll found
) else (
    echo [WARN] libEGL.dll not found
)

if exist "%BUILD_DIR%\libGLESv2.dll" (
    echo [OK] libGLESv2.dll found
) else (
    echo [WARN] libGLESv2.dll not found
)

REM Check for resources
if exist "%BUILD_DIR%\resources" (
    echo [OK] resources folder found
) else (
    echo [FAIL] resources folder NOT FOUND
    set "ALL_OK=0"
)

if exist "%BUILD_DIR%\resources\app.asar" (
    echo [OK] app.asar found
) else (
    echo [FAIL] app.asar NOT FOUND
    set "ALL_OK=0"
)

echo.
echo ========================================
echo File size check:
echo ========================================
for %%F in ("%BUILD_DIR%\Million Card Game.exe") do echo Executable: %%~zF bytes
for %%F in ("%BUILD_DIR%\ffmpeg.dll") do echo ffmpeg.dll: %%~zF bytes
for %%F in ("%BUILD_DIR%\resources\app.asar") do echo app.asar: %%~zF bytes

echo.
echo ========================================
if "%ALL_OK%"=="1" (
    echo [SUCCESS] All critical files present!
    echo Your build is ready for Steam upload.
) else (
    echo [FAILURE] Some critical files are missing!
    echo Please rebuild using build-steam.bat
)
echo ========================================
echo.

pause
