@echo off
call npm run db:migrate:local
if errorlevel 1 exit /b 1
call npm run preview
