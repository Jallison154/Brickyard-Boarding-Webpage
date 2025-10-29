# PowerShell script to download images from Wix site
$url = "https://springcorgis.wixsite.com/brickyard-kennels"
$imageDir = "resources\images"

# Create directory if it doesn't exist
if (-not (Test-Path $imageDir)) {
    New-Item -ItemType Directory -Path $imageDir -Force | Out-Null
}

Write-Host "Fetching page content..."
try {
    # Fetch the webpage
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -ErrorAction Stop
    
    # Extract image URLs from HTML
    $html = $response.Content
    $imgUrls = [regex]::Matches($html, 'https?://[^\s"<>]+\.(jpg|jpeg|png|webp)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    
    Write-Host "Found $($imgUrls.Count) potential images"
    
    $downloaded = 0
    
    foreach ($match in $imgUrls) {
        $imgUrl = $match.Value
        
        # Skip small/sprite images
        if ($imgUrl -match 'icon|logo|sprite|button|avatar') {
            continue
        }
        
        # Look for wixstatic images
        if ($imgUrl -notmatch 'wixstatic\.com') {
            continue
        }
        
        try {
            # Get filename from URL
            $uri = [System.Uri]$imgUrl
            $filename = Split-Path $uri.AbsolutePath -Leaf
            
            # If no filename, create one
            if (-not $filename -or $filename -eq '/') {
                $filename = "image_$downloaded.jpg"
            }
            
            # Clean filename
            $filename = $filename -replace '[^\w\.-]', '_'
            
            $filePath = Join-Path $imageDir $filename
            
            # Skip if already downloaded
            if (Test-Path $filePath) {
                continue
            }
            
            Write-Host "Downloading: $filename..."
            Invoke-WebRequest -Uri $imgUrl -OutFile $filePath -ErrorAction Stop
            
            $downloaded++
            Write-Host "  Saved: $filePath"
            
            if ($downloaded -ge 10) {
                Write-Host "Downloaded 10 images, stopping..."
                break
            }
            
        } catch {
            # Skip errors silently
            continue
        }
    }
    
    Write-Host ""
    Write-Host "Download complete!"
    Write-Host "Downloaded: $downloaded images"
    Write-Host "Saved to: $imageDir"
    
} catch {
    Write-Host "Error fetching page: $_"
}
