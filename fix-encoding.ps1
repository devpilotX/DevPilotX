# Fix encoding corruption in snippets/single.ejs and category.ejs
# Corrupted bytes from double-encoding UTF-8 through Windows-1252:
# <- (U+2190) E2 86 90 -> corrupted to C3 A2 E2 80 A0 C2 90
# -> (U+2192) E2 86 92 -> corrupted to C3 A2 E2 80 A0 E2 80 99

function Replace-Bytes {
    param([byte[]]$data, [byte[]]$search, [byte[]]$replace)
    $result = [System.Collections.Generic.List[byte]]::new()
    $i = 0
    while ($i -lt $data.Length) {
        $match = $true
        if ($i + $search.Length -le $data.Length) {
            for ($j = 0; $j -lt $search.Length; $j++) {
                if ($data[$i + $j] -ne $search[$j]) { $match = $false; break }
            }
        } else { $match = $false }
        if ($match) {
            foreach ($b in $replace) { $result.Add($b) }
            $i += $search.Length
        } else {
            $result.Add($data[$i])
            $i++
        }
    }
    return $result.ToArray()
}

# Bytes for the context we want to replace in single.ejs
# "â† Previous" -> "Previous"  (prev nav direction)
# The garbled <- arrow: C3 A2 E2 80 A0 C2 90
$garbledLeft  = [byte[]]@(0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xC2, 0x90)
# The garbled -> arrow: C3 A2 E2 80 A0 E2 80 99
$garbledRight = [byte[]]@(0xC3, 0xA2, 0xE2, 0x80, 0xA0, 0xE2, 0x80, 0x99)

$emptyBytes = [byte[]]@()

# Fix single.ejs
$singleFile = 'C:\Users\dipan\OneDrive\Desktop\value-codes\views\snippets\single.ejs'
$data = [System.IO.File]::ReadAllBytes($singleFile)
Write-Host "single.ejs size before: $($data.Length)"

# First check what bytes are after "Next " to know which garbled arrow is used
$nextIdx = -1
for ($i = 0; $i -lt $data.Length - 5; $i++) {
    if ($data[$i] -eq 0x4E -and $data[$i+1] -eq 0x65 -and $data[$i+2] -eq 0x78 -and $data[$i+3] -eq 0x74 -and $data[$i+4] -eq 0x20) {
        $nextIdx = $i
        $nextBytes = $data[($i+5)..($i+14)]
        Write-Host "After 'Next ': $($nextBytes | ForEach-Object { '{0:X2}' -f $_ })"
        break
    }
}

# Remove garbled left arrow (before " Previous")
$data = Replace-Bytes $data $garbledLeft $emptyBytes
# Remove garbled right arrow (after "Next ")
$data = Replace-Bytes $data $garbledRight $emptyBytes

Write-Host "single.ejs size after: $($data.Length)"
[System.IO.File]::WriteAllBytes($singleFile, $data)
Write-Host "single.ejs fixed!"

# Fix category.ejs
$catFile = 'C:\Users\dipan\OneDrive\Desktop\value-codes\views\snippets\category.ejs'
$data = [System.IO.File]::ReadAllBytes($catFile)
Write-Host "category.ejs size before: $($data.Length)"
$data = Replace-Bytes $data $garbledLeft $emptyBytes
$data = Replace-Bytes $data $garbledRight $emptyBytes
Write-Host "category.ejs size after: $($data.Length)"
[System.IO.File]::WriteAllBytes($catFile, $data)
Write-Host "category.ejs fixed!"
