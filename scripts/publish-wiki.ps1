param(
  [string]$Owner = "AlexGaming-Dev",
  [string]$Repo = "AegisBridge"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$wikiSource = Join-Path $projectRoot "wiki"
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "$Repo.wiki"
$wikiRemote = "https://github.com/$Owner/$Repo.wiki.git"

if (-not (Test-Path $wikiSource)) {
  throw "Wiki source folder not found: $wikiSource"
}

if (Test-Path $tempDir) {
  Remove-Item -Recurse -Force $tempDir
}

Write-Host "Cloning wiki repository: $wikiRemote"
git clone $wikiRemote $tempDir

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
  git push origin master
  Write-Host "Wiki published successfully."
} else {
  Write-Host "No wiki changes to publish."
}
