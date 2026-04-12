# Otključava dolazne konekcije na portove 3000 (Next.js) i 5000 (API) u Windows Firewall-u,
# da drugi PC i telefon u istoj mrezi mogu da pristupe aplikaciji.
#
# Pokretanje: desni klik na PowerShell -> "Run as administrator", pa:
#   cd "D:\2026\Salon Manager PRO (SaaS)"
#   .\scripts\windows-allow-salon-lan.ps1
#
# Ili iz korena: npm run lan:firewall  (i dalje mora biti Administrator terminal)

$ErrorActionPreference = "Stop"

function Test-Administrator {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  return $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
  Write-Host ""
  Write-Host "OVA SKRIPTA MORA BITI POKRENUTA KAO ADMINISTRATOR." -ForegroundColor Red
  Write-Host "Zatvori ovaj prozor, desni klik na PowerShell / Terminal -> Run as administrator,"
  Write-Host "pa ponovo pokreni skriptu."
  Write-Host ""
  exit 1
}

$ports = @(3000, 5000)
foreach ($port in $ports) {
  $name = "Salon Manager PRO - dev TCP $port"
  $existing = Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "[OK] Pravilo vec postoji: $name"
    continue
  }
  New-NetFirewallRule `
    -DisplayName $name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $port `
    -Profile Any `
    -Description "Lokalni razvoj Salon Manager PRO (Next + API). Mozete obrisati pravilo kad vise ne treba."
  Write-Host "[+] Kreirano pravilo: $name"
}

Write-Host ""
Write-Host "=== Proveri da je WiFi/ethernet u Windowsu 'Private' mreza ===" -ForegroundColor Cyan
Write-Host "Podesavanja -> Mreza i internet -> (tvoja mreza) -> Tip profila: Privatna"
Write-Host ""
Write-Host "=== Na drugom uredjaju otvori (zameni IP) ===" -ForegroundColor Cyan

$ifaces = @(Get-NetIPConfiguration | Where-Object {
  $null -ne $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up"
})
foreach ($cfg in $ifaces) {
  $ip = $cfg.IPv4Address.IPAddress
  if ($ip -and $ip -notlike "169.254.*") {
    Write-Host "  Web:    http://${ip}:3000"
    Write-Host "  API:    http://${ip}:5000/health"
    Write-Host "  Booking npr: http://${ip}:3000/book/TVOJ-SLUG"
    Write-Host ""
  }
}

if ($ifaces.Count -eq 0) {
  Write-Host "  (nije nadjen aktivni adapter sa gateway-em - pokreni ipconfig)"
  ipconfig | Select-String "IPv4"
}

Write-Host "=== Ako i dalje ne radi ===" -ForegroundColor Yellow
Write-Host "1. Router: iskljuci 'AP isolation' / 'Client isolation' na WiFi-ju."
Write-Host "2. Oba uredjaja moraju biti u ISTOJ mrezi (isti WiFi ili isti LAN)."
Write-Host "3. Ne koristi localhost na telefonu - samo IP racunara iznad."
Write-Host ""
