# migrate-frontend-to-monorepo.ps1
# Run from workspace root in PowerShell. Review variables before running.

$FRONTEND_DIR = "frontend"
$BACKUP_DIR = "frontend.local"
$TMP_DIR = "frontend.tmp"
$FRONTEND_REMOTE = "https://github.com/apcedgalauran/Mini-Aternos.git"  # existing frontend repo (updated)
$NEW_REMOTE = Read-Host "Enter new monorepo remote URL (or leave blank to skip push)"

Write-Host "`n-- Safety checks --`n"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git is not installed or not in PATH. Install Git before running this script."
  exit 1
}

if (-not (Test-Path $FRONTEND_DIR)) {
  Write-Error "Directory '$FRONTEND_DIR' not found. Abort."
  exit 1
}

if (Test-Path "$FRONTEND_DIR\.git") {
  Write-Host "Found nested git repo at $FRONTEND_DIR/.git (expected)."
} else {
  Write-Warning "No .git found inside '$FRONTEND_DIR'. The subtree import will still attempt to proceed but may not preserve local frontend history."
  $proceed = Read-Host "Continue? (y/n)"
  if ($proceed -ne "y") { exit 1 }
}

# Confirm
Write-Host "`nAbout to:"
Write-Host "- Copy '$FRONTEND_DIR' -> '$BACKUP_DIR'"
Write-Host "- Rename '$FRONTEND_DIR' -> '$TMP_DIR' to allow subtree import"
Write-Host "- Init root repo (if needed), add remote $FRONTEND_REMOTE and run git subtree add"
Write-Host "- Copy any local changes back from '$BACKUP_DIR' into 'frontend' and commit"
Write-Host "- Optionally push to remote: $NEW_REMOTE"
$ok = Read-Host "Type 'CONFIRM' to proceed"
if ($ok -ne "CONFIRM") { Write-Host "Aborted by user."; exit 0 }

# Backup
Write-Host "`nBacking up frontend..."
if (Test-Path $BACKUP_DIR) {
  Write-Warning "'$BACKUP_DIR' already exists. Aborting to avoid overwrite."
  exit 1
}
Copy-Item -Recurse -Force $FRONTEND_DIR $BACKUP_DIR

# Move out of the way
Rename-Item -Path $FRONTEND_DIR -NewName $TMP_DIR

# Initialize root repo if needed
$rootIsRepo = (& git rev-parse --is-inside-work-tree) 2>$null
if ($LASTEXITCODE -ne 0 -or $rootIsRepo -ne 'true') {
  Write-Host "`nInitializing root git repository..."
  git init
  git add .
  git commit -m "Initial import of root workspace (frontend handled separately)" 2>$null
} else {
  Write-Host "Root already a git repo. Make sure working tree is clean or committed."
  $st = git status --porcelain
  if ($st) {
    Write-Host "Working tree has changes. It's recommended to commit them now. Continuing anyway."
  }
}

# Add frontend remote and fetch
Write-Host "`nAdding remote for frontend and fetching..."
git remote remove frontend-remote 2>$null
git remote add frontend-remote $FRONTEND_REMOTE
git fetch frontend-remote --tags

# Determine branch to import from backup (frontend.local)
$branch = (& git -C $BACKUP_DIR rev-parse --abbrev-ref HEAD) 2>$null
if (-not $branch) { $branch = "master" }
Write-Host "Detected frontend branch: $branch"

# Import with subtree
Write-Host "`nImporting frontend history into subdirectory 'frontend' via git subtree..."
git subtree add --prefix=frontend frontend-remote $branch
if ($LASTEXITCODE -ne 0) {
  Write-Error "git subtree add failed. Restore state from '$BACKUP_DIR' and retry. Aborting."
  Rename-Item -Path $TMP_DIR -NewName $FRONTEND_DIR -ErrorAction SilentlyContinue
  exit 1
}

# Copy back local edits from backup
Write-Host "`nRestoring local frontend files from backup..."
Copy-Item -Recurse -Force "$BACKUP_DIR\*" frontend\

git add frontend
git commit -m "Apply local workspace frontend changes" 2>$null

# Configure and push to new remote if provided
if ($NEW_REMOTE -and $NEW_REMOTE.Trim() -ne "") {
  Write-Host "`nSetting new origin remote and pushing..."
  git remote remove origin 2>$null
  git remote add origin $NEW_REMOTE
  # detect root branch
  $rootBranch = (& git rev-parse --abbrev-ref HEAD) 2>$null
  if (-not $rootBranch) { $rootBranch = "master" }
  git push -u origin $rootBranch
}

Write-Host "`nMigration finished. Verify history with 'git log --oneline --graph --all -- frontend' and inspect files."
Write-Host "Backups: '$BACKUP_DIR' and '$TMP_DIR' remain. Remove them only after verification."
