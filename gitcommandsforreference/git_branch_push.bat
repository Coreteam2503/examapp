@echo off
echo ExamApp - Creating New Branch and Pushing Changes
echo ===============================================

echo Checking current status...
git status

echo.
echo Current branch:
git branch

echo.
set /p branch_name="Enter new branch name (e.g., feature/input-validation): "

if "%branch_name%"=="" (
    echo Branch name is required!
    pause
    exit /b 1
)

echo.
echo Creating new branch: %branch_name%
git checkout -b %branch_name%

echo.
echo Adding all changes...
git add .

echo.
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg=WIP: Updates for task #45 - Input validation and sanitization
)

echo.
echo Committing changes...
git commit -m "%commit_msg%"

echo.
echo Pushing to remote repository...
git push -u origin %branch_name%

echo.
echo ✅ Successfully created branch '%branch_name%' and pushed changes!
echo 🔗 You can now create a pull request on GitHub

pause
