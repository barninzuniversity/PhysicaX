$ErrorActionPreference = 'Stop'
Write-Output "start"
try {
  $path = "C:\Users\ibzao\Downloads\guide.pdf"
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $null = [Windows.Storage.StorageFile, Windows.Storage, ContentType=WindowsRuntime]
  $null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType=WindowsRuntime]
  $null = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType=WindowsRuntime]
  $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
  $null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType=WindowsRuntime]
  $null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType=WindowsRuntime]
  $null = [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType=WindowsRuntime]
  function Await($asyncOp) {
      return [System.WindowsRuntimeSystemExtensions]::AsTask($asyncOp).GetAwaiter().GetResult()
  }
  $storageFile = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path))
  Write-Output "got file"
  $pdf = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($storageFile))
  Write-Output "pages: $($pdf.PageCount)"
  $page = $pdf.GetPage(0)
  $stream = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
  $options = New-Object Windows.Data.Pdf.PdfPageRenderOptions
  $options.DestinationWidth = 2000
  $options.DestinationHeight = 2000
  Await ($page.RenderToStreamAsync($stream, $options)) | Out-Null
  Write-Output "rendered"
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream))
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync())
  if ($bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Gray8) {
      $bitmap = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert($bitmap, [Windows.Graphics.Imaging.BitmapPixelFormat]::Gray8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Ignore)
  }
  $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  $result = Await ($ocrEngine.RecognizeAsync($bitmap))
  Write-Output "chars: $($result.Text.Length)"
  Write-Output $result.Text
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  Write-Output $_.Exception.ToString()
}
Write-Output "end"
