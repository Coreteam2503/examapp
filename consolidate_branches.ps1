# PowerShell script to consolidate branches - keep 2nine, delete 2eight
# Usage: .\consolidate_branches.ps1

Write-Host "Branch Consolidation Script" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green

# Check current status
Write-Host "`nCurrent branch status:" -ForegroundColor Cyan
git branch -a

Write-Host "`nCurrent working directory status:" -ForegroundColor Cyan
git status

# Get current branch
$currentBranch = git symbolic-ref --short HEAD
Write-Host "`nCurrently on branch: $currentBranch" -ForegroundColor Yellow

# Step 1: Switch to 2nine
Write-Host "`nSwitching to 2nine branch..." -ForegroundColor Cyan
git checkout 2nine

# Step 2: Check if 2eight exists and merge if needed
$branchExists = git branch --list "2eight"
if ($branchExists) {
    Write-Host "`n2eight branch found. Checking for differences..." -ForegroundColor Yellow
    
    # Check if there are differences between the branches
    $diff = git diff 2nine..2eight
    if ($diff) {
        Write-Host "Differences found between 2eight and 2nine." -ForegroundColor Yellow
        Write-Host "Merging 2eight into 2nine..." -ForegroundColor Cyan
        git merge 2eight --no-edit
        
        # Push updated 2nine
        Write-Host "Pushing updated 2nine to GitHub..." -ForegroundColor Cyan
        git push origin 2nine
    } else {
        Write-Host "No differences between branches." -ForegroundColor Green
    }
    
    # Step 3: Delete 2eight locally
    Write-Host "`nDeleting 2eight branch locally..." -ForegroundColor Cyan
    git branch -d 2eight
    
    # Step 4: Delete 2eight from GitHub
    Write-Host "Deleting 2eight branch from GitHub..." -ForegroundColor Cyan
    git push origin --delete 2eight
    
    Write-Host "`n✅ Successfully consolidated into 2nine and deleted 2eight!" -ForegroundColor Green
} else {
    Write-Host "`n2eight branch not found locally." -ForegroundColor Yellow
    
    # Check if it exists on remote
    $remoteBranch = git branch -r --list "origin/2eight"
    if ($remoteBranch) {
        Write-Host "2eight exists on GitHub. Deleting from remote..." -ForegroundColor Cyan
        git push origin --delete 2eight
        Write-Host "✅ Deleted 2eight from GitHub!" -ForegroundColor Green
    } else {
        Write-Host "2eight doesn't exist on remote either." -ForegroundColor Green
    }
}

Write-Host "`nFinal branch status:" -ForegroundColor Cyan
git branch -a

Write-Host "`n🎉 Branch consolidation complete!" -ForegroundColor Green
Write-Host "You're now on the 2nine branch with all changes consolidated." -ForegroundColor Yellow
