$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$NodeWingetId = 'OpenJS.NodeJS.LTS'
$MkcertWingetId = 'FiloSottile.mkcert'
$DockerDownloadUrl = 'https://www.docker.com/products/docker-desktop/'
$WingetFlags = @('--exact', '--silent', '--accept-package-agreements', '--accept-source-agreements')

Set-Location $RepoRoot

function Get-PinnedVersion([string] $Tool) {
  $MiseToml = Get-Content (Join-Path $RepoRoot 'mise.toml') -Raw
  if ($MiseToml -match "(?m)^$Tool = `"([^`"]+)`"") {
    return $Matches[1]
  }
  throw "mise.toml pins no $Tool version"
}

function Test-Command([string] $Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Update-SessionPath {
  $Machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $User = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$Machine;$User"
}

function Invoke-Checked([string] $Command, [string[]] $Arguments) {
  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Assert-Docker {
  if (-not (Test-Command 'docker')) {
    throw "Docker Desktop is missing. Install it from $DockerDownloadUrl, start it, then run this script again."
  }
  docker info *> $null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is not running. Start it, wait until it says it is running, then run this script again.'
  }
}

function Assert-Winget {
  if (-not (Test-Command 'winget')) {
    throw 'winget is missing. Install "App Installer" from the Microsoft Store, then run this script again.'
  }
}

function Install-Node([string] $Major) {
  $Current = if (Test-Command 'node') { (node --version).TrimStart('v').Split('.')[0] } else { '' }
  if ($Current -eq $Major) {
    Write-Host "node: $(node --version) already installed"
    return
  }
  $Version = winget show --id $NodeWingetId --versions --accept-source-agreements |
    Where-Object { $_.Trim() -match "^$Major\.\d+\.\d+$" } |
    ForEach-Object { $_.Trim() } |
    Sort-Object { [version] $_ } -Descending |
    Select-Object -First 1
  if (-not $Version) {
    throw "winget has no Node.js $Major release under $NodeWingetId"
  }
  Write-Host "node: installing $Version"
  Invoke-Checked 'winget' (@('install', '--id', $NodeWingetId, '--version', $Version) + $WingetFlags)
  Update-SessionPath
}

function Install-Mkcert {
  if (Test-Command 'mkcert') {
    Write-Host 'mkcert: already installed'
    return
  }
  Write-Host 'mkcert: installing'
  Invoke-Checked 'winget' (@('install', '--id', $MkcertWingetId) + $WingetFlags)
  Update-SessionPath
}

function Install-Pnpm([string] $Version) {
  $Current = if (Test-Command 'pnpm') { pnpm --version } else { '' }
  if ($Current -eq $Version) {
    Write-Host "pnpm: $Version already installed"
    return
  }
  Write-Host "pnpm: installing $Version"
  Invoke-Checked 'npm' @('install', '--global', "pnpm@$Version")
  Update-SessionPath
}

Assert-Docker
Assert-Winget
Install-Node (Get-PinnedVersion 'node')
Install-Mkcert
Install-Pnpm (Get-PinnedVersion 'pnpm')
Invoke-Checked 'node' @('tools/dev.ts', 'setup')
