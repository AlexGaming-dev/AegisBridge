param(
  [string]$Owner = "AlexGaming-Dev",
  [string]$Repo = "AegisBridge"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$wikiSource = Join-Path $projectRoot "wiki"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "$Repo.wiki"

function Get-WikiRemoteCandidates {
  param(
    [string]$ProjectRoot,
    [string]$Owner,
    [string]$Repo
  )

  $candidates = New-Object System.Collections.Generic.List[string]
  $originUrl = $null

  Push-Location $ProjectRoot
  try {
    try {
      $originUrl = (git remote get-url origin 2>$null).Trim()
    } catch {
      $originUrl = $null
    }
  } finally {
    Pop-Location
  }

  if (-not [string]::IsNullOrWhiteSpace($originUrl)) {
    if ($originUrl -match '^git@github\.com:(.+)/(.+)\.git$') {
      $candidates.Add("git@github.com:$($matches[1])/$($matches[2]).wiki.git")
      $candidates.Add("https://github.com/$($matches[1])/$($matches[2]).wiki.git")
    } elseif ($originUrl -match '^https://github\.com/(.+)/(.+)\.git$') {
      $candidates.Add("https://github.com/$($matches[1])/$($matches[2]).wiki.git")
      $candidates.Add("git@github.com:$($matches[1])/$($matches[2]).wiki.git")
    }
  }

  $candidates.Add("https://github.com/$Owner/$Repo.wiki.git")
  $candidates.Add("git@github.com:$Owner/$Repo.wiki.git")

  return ($candidates | Select-Object -Unique)
}

function Clone-WikiRepository {
  param(
    [string[]]$Candidates,
    [string]$TargetDir
  )

  foreach ($remote in $Candidates) {
    Write-Host "Cloning wiki repository: $remote"
    git clone $remote $TargetDir
    if ($LASTEXITCODE -eq 0) {
      return $remote
    }

    if (Test-Path $TargetDir) {
      Remove-Item -Recurse -Force $TargetDir
    }
  }

  throw "Could not clone wiki repository. On GitHub, the wiki git repository is often created only after the first wiki page is saved in the web UI. Open the Wiki tab, create and save an initial Home page, then run this script again. Also ensure your Git credentials can access the repository (HTTPS credential helper or SSH key)."
}

if (-not (Test-Path $wikiSource)) {
  throw "Wiki source folder not found: $wikiSource"
}

if (Test-Path $tempDir) {
  Remove-Item -Recurse -Force $tempDir
}

$wikiRemoteCandidates = Get-WikiRemoteCandidates -ProjectRoot $projectRoot -Owner $Owner -Repo $Repo
$usedRemote = Clone-WikiRepository -Candidates $wikiRemoteCandidates -TargetDir $tempDir
Write-Host "Using wiki remote: $usedRemote"

if (-not (Test-Path $tempDir)) {
  throw "Wiki clone target directory was not created: $tempDir"
}

Write-Host "Copying wiki pages..."
Get-ChildItem -Path $wikiSource -File -Filter *.md | ForEach-Object {
  Copy-Item $_.FullName (Join-Path $tempDir $_.Name) -Force
}

Set-Location $tempDir

if (-not (git config user.name)) {
  git config user.name "AegisBridge Bot"
}
if (-not (git config user.email)) {
  git config user.email "noreply@users.noreply.github.com"
}

git add .
$changes = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($changes)) {
  git commit -m "docs(wiki): sync wiki pages from repository"
  git push origin HEAD
  Write-Host "Wiki published successfully."
} else {
  Write-Host "No wiki changes to publish."
}
