# Comprehensive encoding corruption fix
# Repairs double-encoded UTF-8 characters caused by PowerShell ANSI re-encoding

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

# Replacement table: [garbled bytes] -> [correct bytes]
# Each entry: @{ old=[byte[]]; new=[byte[]] }
$replacements = @(
    # em dash — (U+2014) UTF-8: E2 80 94 -> Win1252: â€" -> re-UTF8: C3 A2 E2 82 AC E2 80 9D
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9D); new=[System.Text.Encoding]::UTF8.GetBytes(' | ') },
    # en dash – (U+2013) UTF-8: E2 80 93 -> Win1252: â€" -> re-UTF8: C3 A2 E2 82 AC E2 80 9C
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C); new=[System.Text.Encoding]::UTF8.GetBytes(' | ') },
    # single right angle quotation mark › (U+203A) -> garbled: C3 A2 E2 82 AC C2 BA
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0xBA); new=[System.Text.Encoding]::UTF8.GetBytes('/') },
    # <- arrow (U+2190) -> garbled: C3 A2 E2 80 A0 C2 90
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xC2,0x90); new=[byte[]]@() },
    # -> arrow (U+2192) -> garbled: C3 A2 E2 80 A0 E2 80 99
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x99); new=[byte[]]@() }
)

# Files to process (all 31 EJS files + CSS/JS that may have been affected)
$files = Get-ChildItem -Path 'C:\Users\dipan\OneDrive\Desktop\value-codes\views' -Recurse -Include '*.ejs' |
    Select-Object -ExpandProperty FullName

$files += Get-ChildItem -Path 'C:\Users\dipan\OneDrive\Desktop\value-codes\public\css' -Recurse -Include '*.css' |
    Select-Object -ExpandProperty FullName

$files += Get-ChildItem -Path 'C:\Users\dipan\OneDrive\Desktop\value-codes\public\js' -Recurse -Include '*.js' |
    Select-Object -ExpandProperty FullName

$totalFixed = 0

foreach ($file in $files) {
    $data = [System.IO.File]::ReadAllBytes($file)
    $originalSize = $data.Length

    foreach ($rep in $replacements) {
        $data = Replace-Bytes $data $rep.old $rep.new
    }

    if ($data.Length -ne $originalSize) {
        [System.IO.File]::WriteAllBytes($file, $data)
        $diff = $originalSize - $data.Length
        Write-Host "Fixed: $([System.IO.Path]::GetFileName($file)) (-$diff bytes)"
        $totalFixed++
    }
}

Write-Host ""
Write-Host "Total files fixed: $totalFixed"
