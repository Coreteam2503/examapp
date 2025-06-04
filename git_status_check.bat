@echo off
echo Checking Git Status...
cd /d "C:\Users\jcupp\coderepos\examApp"
git status
echo.
echo Current Branch:
git branch
echo.
echo Remote branches:
git branch -r
pause
