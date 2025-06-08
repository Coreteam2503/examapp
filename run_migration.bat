@echo off
cd /d "C:\Users\jcupp\coderepos\Future\examApp\backend"
npx knex migrate:latest
npx knex seed:run
pause
