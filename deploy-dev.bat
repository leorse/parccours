@echo off
cd /d "%~dp0"
node scripts/deploy.js dev
pause
