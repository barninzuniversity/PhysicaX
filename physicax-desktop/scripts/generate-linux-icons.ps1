param(
  [string]$OutputDir = (Join-Path (Split-Path -Parent $PSScriptRoot) "build\icons")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Color([int]$A, [int]$R, [int]$G, [int]$B) {
  return [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

$masterSize = 1024
$bitmap = New-Object System.Drawing.Bitmap $masterSize, $masterSize
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear((New-Color 0 0 0 0))

$iconPath = New-RoundedRectanglePath -X 72 -Y 72 -Width 880 -Height 880 -Radius 190

$backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.PointF 72, 72),
  (New-Object System.Drawing.PointF 952, 952),
  (New-Color 255 8 17 44),
  (New-Color 255 27 82 172)
)
$blend = New-Object System.Drawing.Drawing2D.ColorBlend
$blend.Colors = @(
  (New-Color 255 8 17 44),
  (New-Color 255 22 59 128),
  (New-Color 255 18 122 196)
)
$blend.Positions = @(0.0, 0.55, 1.0)
$backgroundBrush.InterpolationColors = $blend
$graphics.FillPath($backgroundBrush, $iconPath)

$borderPen = New-Object System.Drawing.Pen((New-Color 90 255 255 255), 10)
$graphics.DrawPath($borderPen, $iconPath)

$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(126, 106, 790, 690)
$glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
$glowBrush.CenterColor = (New-Color 140 61 216 255)
$glowBrush.SurroundColors = @((New-Color 0 61 216 255))
$graphics.FillPath($glowBrush, $glowPath)

$graphics.TranslateTransform($masterSize / 2, $masterSize / 2)
$graphics.RotateTransform(-26)

$orbitPen = New-Object System.Drawing.Pen((New-Color 220 111 232 255), 42)
$orbitPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$orbitPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawEllipse($orbitPen, -320, -135, 640, 270)

$orbitPenInner = New-Object System.Drawing.Pen((New-Color 110 255 255 255), 14)
$graphics.DrawEllipse($orbitPenInner, -320, -135, 640, 270)

$dotBrush = New-Object System.Drawing.SolidBrush (New-Color 255 190 248 255)
$graphics.FillEllipse($dotBrush, 190, -34, 74, 74)

$graphics.ResetTransform()

$coreShadow = New-Object System.Drawing.SolidBrush (New-Color 75 5 14 34)
$graphics.FillEllipse($coreShadow, 296, 268, 430, 430)

$corePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$corePath.AddEllipse(320, 292, 380, 380)
$coreBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($corePath)
$coreBrush.CenterColor = (New-Color 255 32 201 240)
$coreBrush.SurroundColors = @((New-Color 255 14 80 182))
$graphics.FillPath($coreBrush, $corePath)

$coreHighlight = New-Object System.Drawing.SolidBrush (New-Color 105 255 255 255)
$graphics.FillEllipse($coreHighlight, 374, 340, 118, 118)

$font = New-Object System.Drawing.Font("Segoe UI Semibold", 300, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$textRect = New-Object System.Drawing.RectangleF(0, 520, $masterSize, 260)
$textShadowBrush = New-Object System.Drawing.SolidBrush (New-Color 80 4 12 30)
$textBrush = New-Object System.Drawing.SolidBrush (New-Color 255 244 251 255)
$stringFormat = New-Object System.Drawing.StringFormat
$stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
$stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$graphics.DrawString("PX", $font, $textShadowBrush, (New-Object System.Drawing.RectangleF(0, 536, $masterSize, 260)), $stringFormat)
$graphics.DrawString("PX", $font, $textBrush, $textRect, $stringFormat)

$accentPen = New-Object System.Drawing.Pen((New-Color 135 255 255 255), 12)
$graphics.DrawArc($accentPen, 212, 162, 560, 320, 200, 72)

[System.IO.Directory]::CreateDirectory($OutputDir) | Out-Null

$sizes = @(16, 24, 32, 48, 64, 96, 128, 256, 512)
foreach ($size in $sizes) {
  $resized = New-Object System.Drawing.Bitmap $size, $size
  $resizedGraphics = [System.Drawing.Graphics]::FromImage($resized)
  $resizedGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $resizedGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $resizedGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $resizedGraphics.DrawImage($bitmap, 0, 0, $size, $size)
  $target = Join-Path $OutputDir ("{0}x{0}.png" -f $size)
  $resized.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $resizedGraphics.Dispose()
  $resized.Dispose()
}

$masterTarget = Join-Path $OutputDir "icon.png"
$bitmap.Save($masterTarget, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()
$font.Dispose()
$stringFormat.Dispose()
$textBrush.Dispose()
$textShadowBrush.Dispose()
$accentPen.Dispose()
$coreHighlight.Dispose()
$coreBrush.Dispose()
$corePath.Dispose()
$coreShadow.Dispose()
$dotBrush.Dispose()
$orbitPenInner.Dispose()
$orbitPen.Dispose()
$glowBrush.Dispose()
$glowPath.Dispose()
$borderPen.Dispose()
$backgroundBrush.Dispose()
$iconPath.Dispose()

Write-Output "Linux icon set generated in $OutputDir"
