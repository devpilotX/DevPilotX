# Fix remaining encoding corruption - phase 2
# Additional patterns not caught by phase 1

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
    return ,$result.ToArray()
}

# First, inspect the apis/single.ejs to find the arrow bytes
$apiFile = 'C:\Users\dipan\OneDrive\Desktop\value-codes\views\apis\single.ejs'
$data = [System.IO.File]::ReadAllBytes($apiFile)
# Find "Website" to locate the arrow
for ($i = 0; $i -lt $data.Length - 7; $i++) {
    # "Website" = 57 65 62 73 69 74 65
    if ($data[$i] -eq 0x57 -and $data[$i+1] -eq 0x65 -and $data[$i+2] -eq 0x62) {
        Write-Host "Found 'Web' at $i, next bytes:"
        $nextBytes = $data[($i+7)..($i+17)]
        Write-Host ($nextBytes | ForEach-Object { '{0:X2}' -f $_ }) -Separator ' '
        break
    }
}

# Find "ellipsis" pattern in regex-builder.ejs
$regexFile = 'C:\Users\dipan\OneDrive\Desktop\value-codes\views\tools\regex-builder.ejs'
$data2 = [System.IO.File]::ReadAllBytes($regexFile)
for ($i = 0; $i -lt $data2.Length - 4; $i++) {
    # Find "here" followed by garbled chars
    if ($data2[$i] -eq 0x68 -and $data2[$i+1] -eq 0x65 -and $data2[$i+2] -eq 0x72 -and $data2[$i+3] -eq 0x65) {
        Write-Host "Found 'here' at $i, next 5 bytes:"
        $nextBytes = $data2[($i+4)..($i+8)]
        Write-Host ($nextBytes | ForEach-Object { '{0:X2}' -f $_ }) -Separator ' '
        break
    }
}
