param(
  [Parameter(Mandatory = $true)]
  [string]$TargetPath,

  [Parameter(Mandatory = $true)]
  [string]$ClonePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPng,

  [Parameter(Mandatory = $true)]
  [string]$OutputJson
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$targetResolved = (Resolve-Path -LiteralPath $TargetPath).Path
$cloneResolved = (Resolve-Path -LiteralPath $ClonePath).Path
$target = [System.Drawing.Bitmap]::new($targetResolved)
$clone = [System.Drawing.Bitmap]::new($cloneResolved)

try {
  $width = [Math]::Max($target.Width, $clone.Width)
  $height = [Math]::Max($target.Height, $clone.Height)
  $panelGap = 12
  $labelHeight = 28
  $white = [System.Drawing.Color]::FromArgb(255, 255, 255)

  $diff = [System.Drawing.Bitmap]::new($width, $height)
  $changed = 0L
  $sumDelta = 0L

  for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
      $left = if ($x -lt $target.Width -and $y -lt $target.Height) { $target.GetPixel($x, $y) } else { $white }
      $right = if ($x -lt $clone.Width -and $y -lt $clone.Height) { $clone.GetPixel($x, $y) } else { $white }
      $delta = [Math]::Abs($left.R - $right.R) + [Math]::Abs($left.G - $right.G) + [Math]::Abs($left.B - $right.B)
      $sumDelta += $delta
      if ($delta -gt 24) {
        $changed++
        $intensity = [Math]::Min(255, [Math]::Max(70, [int]($delta / 3)))
        $diff.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $intensity, 32, 32))
      } else {
        $diff.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 245, 247, 250))
      }
    }
  }

  $canvasWidth = ($width * 3) + ($panelGap * 2)
  $canvasHeight = $height + $labelHeight
  $canvas = [System.Drawing.Bitmap]::new($canvasWidth, $canvasHeight)
  $graphics = [System.Drawing.Graphics]::FromImage($canvas)
  $graphics.Clear($white)

  $font = [System.Drawing.Font]::new('Arial', 11, [System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(60, 72, 96))
  $graphics.DrawString('target', $font, $brush, 8, 6)
  $graphics.DrawString('clone', $font, $brush, $width + $panelGap + 8, 6)
  $graphics.DrawString('diff mask', $font, $brush, ($width * 2) + ($panelGap * 2) + 8, 6)
  $graphics.DrawImage($target, 0, $labelHeight, $target.Width, $target.Height)
  $graphics.DrawImage($clone, $width + $panelGap, $labelHeight, $clone.Width, $clone.Height)
  $graphics.DrawImage($diff, ($width * 2) + ($panelGap * 2), $labelHeight, $width, $height)

  $outputDirectory = Split-Path -Parent $OutputPng
  if ($outputDirectory) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
  }
  $canvas.Save($OutputPng, [System.Drawing.Imaging.ImageFormat]::Png)

  $jsonDirectory = Split-Path -Parent $OutputJson
  if ($jsonDirectory) {
    New-Item -ItemType Directory -Force -Path $jsonDirectory | Out-Null
  }

  $total = [double]($width * $height)
  $result = [ordered]@{
    target = $targetResolved
    clone = $cloneResolved
    output = (Resolve-Path -LiteralPath $OutputPng).Path
    width = $width
    height = $height
    changedPixels = $changed
    totalPixels = [int64]$total
    changedRatio = if ($total -gt 0) { $changed / $total } else { 0 }
    meanDelta = if ($total -gt 0) { $sumDelta / ($total * 3) } else { 0 }
    deltaThreshold = 24
  }
  $result | ConvertTo-Json -Depth 3 | Set-Content -Encoding UTF8 -LiteralPath $OutputJson
  $result | ConvertTo-Json -Depth 3
} finally {
  if ($graphics) { $graphics.Dispose() }
  if ($font) { $font.Dispose() }
  if ($brush) { $brush.Dispose() }
  if ($canvas) { $canvas.Dispose() }
  if ($diff) { $diff.Dispose() }
  if ($target) { $target.Dispose() }
  if ($clone) { $clone.Dispose() }
}
