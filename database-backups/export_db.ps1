# ============================================================
# AJL Tours - Full DB Export via API
# Saves everything to JSON files in an "export" folder
# Usage: .\export_db.ps1
# ============================================================

$BASE_URL = "https://ajl-tours-backend.vercel.app"
$OUT_DIR  = ".\db_export_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

New-Item -ItemType Directory -Path $OUT_DIR -Force | Out-Null
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  AJL Tours - Database Export" -ForegroundColor Cyan
Write-Host "  Output folder: $OUT_DIR" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# ── Helper: fetch and save ──────────────────────────────────
function Fetch-And-Save {
    param(
        [string]$Label,
        [string]$Url,
        [string]$File
    )
    Write-Host "Fetching $Label ..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
        $json = $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 20
        $json | Out-File -FilePath "$OUT_DIR\$File" -Encoding UTF8
        $count = ($response.Content | ConvertFrom-Json) | Measure-Object | Select-Object -ExpandProperty Count
        Write-Host " OK  ($count records)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " FAILED: $_" -ForegroundColor Red
        return $false
    }
}

# ── 1. Tours ────────────────────────────────────────────────
$toursOk = Fetch-And-Save "Tours" "$BASE_URL/api/tours" "tours.json"

# ── 2. Per-tour detail (itinerary etc.) ─────────────────────
if ($toursOk) {
    Write-Host ""
    Write-Host "Fetching per-tour details..." -ForegroundColor Yellow
    $toursRaw = (Invoke-WebRequest -Uri "$BASE_URL/api/tours" -UseBasicParsing).Content | ConvertFrom-Json
    $detailedTours = @()
    foreach ($tour in $toursRaw) {
        $tid = if ($tour._id) { $tour._id } else { $tour.id }
        Write-Host "  -> $($tour.name) [$tid]" -NoNewline
        try {
            $detail = (Invoke-WebRequest -Uri "$BASE_URL/api/tours/$tid" -UseBasicParsing).Content | ConvertFrom-Json
            $detailedTours += $detail
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " (skipped: $_)" -ForegroundColor DarkYellow
            $detailedTours += $tour  # fallback to list data
        }
    }
    $detailedTours | ConvertTo-Json -Depth 20 | Out-File -FilePath "$OUT_DIR\tours_detailed.json" -Encoding UTF8
    Write-Host "  Saved tours_detailed.json" -ForegroundColor Cyan
}

# ── 3. Bookings ─────────────────────────────────────────────
Write-Host ""
Fetch-And-Save "Bookings" "$BASE_URL/api/bookings" "bookings.json"

# ── 4. Booking stats ────────────────────────────────────────
Fetch-And-Save "Booking Stats" "$BASE_URL/api/bookings/stats" "booking_stats.json"

# ── 5. Divisions (from tour data) ───────────────────────────
Write-Host ""
Write-Host "Extracting Divisions from tour data..." -NoNewline
if ($toursOk) {
    $toursRaw2 = (Invoke-WebRequest -Uri "$BASE_URL/api/tours" -UseBasicParsing).Content | ConvertFrom-Json
    $divisions = $toursRaw2 | Where-Object { $_.division } | ForEach-Object { $_.division } | Sort-Object { $_._id } -Unique
    $divisions | ConvertTo-Json -Depth 10 | Out-File -FilePath "$OUT_DIR\divisions.json" -Encoding UTF8
    Write-Host " OK  ($($divisions.Count) divisions)" -ForegroundColor Green
} else {
    Write-Host " SKIPPED (tours failed)" -ForegroundColor DarkYellow
}

# ── 6. Summary manifest ─────────────────────────────────────
Write-Host ""
Write-Host "Writing manifest..." -NoNewline
$manifest = @{
    exportedAt  = (Get-Date -Format "o")
    baseUrl     = $BASE_URL
    files       = @(
        "tours.json"
        "tours_detailed.json"
        "bookings.json"
        "booking_stats.json"
        "divisions.json"
    )
    tourCount   = if ($toursOk) { $toursRaw.Count } else { 0 }
}
$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath "$OUT_DIR\manifest.json" -Encoding UTF8
Write-Host " OK" -ForegroundColor Green

# ── Done ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Export complete!" -ForegroundColor Green
Write-Host "  Folder: $OUT_DIR" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Get-ChildItem $OUT_DIR | Format-Table Name, Length -AutoSize
