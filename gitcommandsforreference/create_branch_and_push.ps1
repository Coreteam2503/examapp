# PowerShell script to create a new branch and push recent changes
# Usage: .\create_branch_and_push.ps1

Write-Host "ExamApp - Creating New Branch and Pushing Changes" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Get current branch
$currentBranch = git symbolic-ref --short HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Cyan
git status --porcelain

$hasChanges = git status --porcelain
if ($hasChanges) {
    Write-Host "`nUncommitted changes detected!" -ForegroundColor Yellow
    
    # Show changes
    Write-Host "`nCurrent changes:" -ForegroundColor Cyan
    git status
    
    # Ask user for branch name
    $branchName = Read-Host "`nEnter new branch name (e.g., 'feature/input-validation', 'fix/quiz-interface', 'security/validation-updates')"
    
    if ($branchName) {
        Write-Host "`nCreating new branch: $branchName" -ForegroundColor Green
        
        # Create and checkout new branch
        git checkout -b $branchName
        
        # Add all changes
        Write-Host "Adding all changes..." -ForegroundColor Cyan
        git add .
        
        # Ask for commit message
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if (-not $commitMessage) {
            $commitMessage = "WIP: Updates for task #45 - Input validation and sanitization"
        }
        
        # Commit changes
        Write-Host "Committing changes..." -ForegroundColor Cyan
        git commit -m "$commitMessage"
        
        # Push to remote
        Write-Host "Pushing to remote repository..." -ForegroundColor Cyan
        git push -u origin $branchName
        
        Write-Host "`n✅ Successfully created branch '$branchName' and pushed changes!" -ForegroundColor Green
        Write-Host "🔗 You can now create a pull request on GitHub" -ForegroundColor Yellow
    } else {
        Write-Host "Branch name is required. Exiting..." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`nNo uncommitted changes found." -ForegroundColor Yellow
    Write-Host "Current working directory is clean." -ForegroundColor Green
    
    # Still offer to create a new branch
    $createBranch = Read-Host "Do you want to create a new branch anyway? (y/N)"
    if ($createBranch -eq 'y' -or $createBranch -eq 'Y') {
        $branchName = Read-Host "Enter new branch name"
        if ($branchName) {
            git checkout -b $branchName
            git push -u origin $branchName
            Write-Host "✅ Created and pushed new branch: $branchName" -ForegroundColor Green
        }
    }
}

Write-Host "`nCurrent branch status:" -ForegroundColor Cyan
git branch -v
