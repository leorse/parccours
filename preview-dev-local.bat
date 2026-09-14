@echo off
call npm run db:migrate:dev:local
if errorlevel 1 exit /b 1
call npm run preview:dev
