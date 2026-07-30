$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$demoAssets = @(
    @{ Id = "ember_after_midnight"; Background = "#3A1715"; Accent = "#F4D28A"; Frequency = 196.00 },
    @{ Id = "satin_window"; Background = "#5B2B25"; Accent = "#E7B9A2"; Frequency = 220.00 },
    @{ Id = "slow_bloom"; Background = "#49352E"; Accent = "#D7A85B"; Frequency = 174.61 },
    @{ Id = "hallway_echo"; Background = "#2F2523"; Accent = "#C1A58B"; Frequency = 164.81 },
    @{ Id = "honey_static"; Background = "#6A351D"; Accent = "#F0C66B"; Frequency = 207.65 },
    @{ Id = "velvet_receiver"; Background = "#512835"; Accent = "#E6B083"; Frequency = 233.08 },
    @{ Id = "blue_hour_vinyl"; Background = "#272B35"; Accent = "#C6A56A"; Frequency = 146.83 },
    @{ Id = "quiet_side_of_rain"; Background = "#313838"; Accent = "#D4C19B"; Frequency = 155.56 },
    @{ Id = "velvet_weather"; Background = "#50372C"; Accent = "#E8C792"; Frequency = 185.00 },
    @{ Id = "candle_smoke"; Background = "#332826"; Accent = "#D8B68A"; Frequency = 138.59 }
)

$coverDirectory = Join-Path $PSScriptRoot "..\public\assets\covers"
$audioDirectory = Join-Path $PSScriptRoot "..\public\assets\audio"
New-Item -ItemType Directory -Force -Path $coverDirectory, $audioDirectory | Out-Null

function New-DemoCover {
    param(
        [hashtable]$Asset,
        [string]$OutputPath
    )

    $bitmap = [Drawing.Bitmap]::new(320, 320)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $background = [Drawing.ColorTranslator]::FromHtml($Asset.Background)
    $accent = [Drawing.ColorTranslator]::FromHtml($Asset.Accent)
    $graphics.Clear($background)

    $softAccent = [Drawing.Color]::FromArgb(72, $accent)
    $faintAccent = [Drawing.Color]::FromArgb(28, $accent)
    $graphics.FillEllipse([Drawing.SolidBrush]::new($softAccent), 46, 46, 228, 228)
    $graphics.DrawEllipse([Drawing.Pen]::new($accent, 3), 74, 74, 172, 172)
    $graphics.FillEllipse([Drawing.SolidBrush]::new($background), 122, 122, 76, 76)

    for ($lineIndex = 0; $lineIndex -lt 7; $lineIndex++) {
        $offset = 34 + ($lineIndex * 41)
        $graphics.DrawLine([Drawing.Pen]::new($faintAccent, 1), $offset, 0, $offset - 54, 320)
    }

    $bitmap.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

function New-DemoAudio {
    param(
        [hashtable]$Asset,
        [string]$OutputPath
    )

    $sampleRate = 22050
    $durationSeconds = 6
    $sampleCount = $sampleRate * $durationSeconds
    $dataSize = $sampleCount * 2
    $stream = [IO.File]::Create($OutputPath)
    $writer = [IO.BinaryWriter]::new($stream)

    $writer.Write([Text.Encoding]::ASCII.GetBytes("RIFF"))
    $writer.Write(36 + $dataSize)
    $writer.Write([Text.Encoding]::ASCII.GetBytes("WAVEfmt "))
    $writer.Write(16)
    $writer.Write([int16]1)
    $writer.Write([int16]1)
    $writer.Write($sampleRate)
    $writer.Write($sampleRate * 2)
    $writer.Write([int16]2)
    $writer.Write([int16]16)
    $writer.Write([Text.Encoding]::ASCII.GetBytes("data"))
    $writer.Write($dataSize)

    for ($sampleIndex = 0; $sampleIndex -lt $sampleCount; $sampleIndex++) {
        $time = $sampleIndex / $sampleRate
        $fadeIn = [Math]::Min(1, $time / 0.12)
        $fadeOut = [Math]::Min(1, ($durationSeconds - $time) / 0.35)
        $envelope = $fadeIn * $fadeOut
        $fundamental = [Math]::Sin(2 * [Math]::PI * $Asset.Frequency * $time)
        $warmHarmonic = [Math]::Sin(2 * [Math]::PI * ($Asset.Frequency * 1.5) * $time)
        $subTone = [Math]::Sin(2 * [Math]::PI * ($Asset.Frequency / 2) * $time)
        $sample = [int16](32767 * 0.19 * $envelope * (($fundamental * 0.62) + ($warmHarmonic * 0.23) + ($subTone * 0.15)))
        $writer.Write($sample)
    }

    $writer.Dispose()
    $stream.Dispose()
}

foreach ($demoAsset in $demoAssets) {
    New-DemoCover $demoAsset (Join-Path $coverDirectory "$($demoAsset.Id).png")
    New-DemoAudio $demoAsset (Join-Path $audioDirectory "$($demoAsset.Id).wav")
}
