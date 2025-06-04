# PowerShell script to commit and push latest changes including task 30, 31 and compilation fix
# Usage: .\commit_latest_changes.ps1

Write-Host "ExamApp - Committing Latest Changes" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Navigate to project directory
Set-Location "C:\Users\jcupp\coderepos\examApp"

# Check current branch
$currentBranch = git symbolic-ref --short HEAD 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
} else {
    Write-Host "Not in a git repository or git not available" -ForegroundColor Red
    exit 1
}

# Show current status
Write-Host "`nChecking git status..." -ForegroundColor Cyan
git status

# Check if there are any changes
$changes = git status --porcelain 2>$null
if ($changes) {
    Write-Host "`nFound changes to commit:" -ForegroundColor Green
    git status --short
    
    Write-Host "`nAdding all changes..." -ForegroundColor Cyan
    git add .
    
    # Create a comprehensive commit message
    $commitMessage = @"
🔧 Fix AdminOverview compilation error and update tasks

- Fixed experimental decimal syntax error in AdminOverview.js
- Replaced < character with HTML entity &lt; in metric display
- Updated tasks.json with new task #54 for compilation fix
- Includes latest changes from tasks 30 & 31 (Admin Dashboard and Analytics)

Tasks completed:
- Task #30: Admin Dashboard Frontend Layout ✅
- Task #31: Admin Analytics Components ✅  
- Task #54: Fix AdminOverview Compilation Error ✅

This resolves the Babel parsing issue and ensures clean builds.
"@
    
    Write-Host "`nCommitting with message:" -ForegroundColor Cyan
    Write-Host $commitMessage -ForegroundColor Gray
    
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Changes committed successfully!" -ForegroundColor Green
        
        # Ask if user wants to push
        Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
            Write-Host "🔗 Changes are now available on the $currentBranch branch" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            Write-Host "You may need to pull first or check your network connection" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    }
} else {
    Write-Host "`nNo changes to commit." -ForegroundColor Yellow
    Write-Host "Working directory is clean." -ForegroundColor Green
}

Write-Host "`nCurrent repository status:" -ForegroundColor Cyan
git log --oneline -5
Write-Host "`nBranches:" -ForegroundColor Cyan
git branch -v
