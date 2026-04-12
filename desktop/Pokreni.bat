@echo off
title Salon Manager PRO — launcher
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Instaliraj Node.js LTS sa https://nodejs.org i pokreni ponovo.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Prvi put: npm install u ovom folderu desktop...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
call npm start
if errorlevel 1 pause
