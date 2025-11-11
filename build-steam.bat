@echo off
echo ========================================
echo Million Card Game - Steam Build Script
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist steam_builds rmdir /s /q steam_builds
echo Previous builds cleaned.
echo.

echo [2/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed.
echo.

echo [3/4] Building for Steam (Windows x64)...
call npm run build-win-steam
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Build completed successfully.
echo.

echo [4/4] Verifying build output...
if not exist "dist\win-unpacked\Million Card Game.exe" (
    echo ERROR: Executable not found!
    pause
    exit /b 1
)

if not exist "dist\win-unpacked\ffmpeg.dll" (
    echo WARNING: ffmpeg.dll not found in build!
    echo Attempting to copy from Electron distribution...
    
    if exist "node_modules\electron\dist\ffmpeg.dll" (
        copy "node_modules\electron\dist\ffmpeg.dll" "dist\win-unpacked\ffmpeg.dll"
        echo ffmpeg.dll copied successfully.
    ) else (
        echo ERROR: Cannot locate ffmpeg.dll
        echo Please check your Electron installation.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Your Steam-ready build is located at:
echo   %cd%\dist\win-unpacked\
echo.
echo Build contents:
dir "dist\win-unpacked" /b
echo.
echo Next steps:
echo 1. Test the executable: dist\win-unpacked\Million Card Game.exe
echo 2. Update steam_app_build.vdf with your App ID and Depot ID
echo 3. Upload to Steam using SteamCMD or the Steamworks SDK
echo.
echo For detailed instructions, see STEAM_BUILD_GUIDE.md
echo.

pause
