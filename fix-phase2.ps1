# Phase 2: Fix remaining encoding corruption patterns

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

$dotdotdot = [System.Text.Encoding]::UTF8.GetBytes('...')

$replacements = @(
    # garbled ellipsis ... (U+2026): C3 A2 E2 82 AC C2 A6 -> "..."
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x82,0xAC,0xC2,0xA6); new=$dotdotdot },
    # garbled upper-right arrow ↗ (U+2197): C3 A2 E2 80 A0 E2 80 94 -> remove
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x94); new=[byte[]]@() },
    # garbled up arrow ↑ (U+2191): C3 A2 E2 80 A0 E2 80 98 -> remove
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x98); new=[byte[]]@() },
    # garbled down arrow ↓ (U+2193): C3 A2 E2 80 A0 E2 80 9C -> remove
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x9C); new=[byte[]]@() },
    # garbled return arrow ↵ (U+21B5): C3 A2 E2 80 A0 C2 B5 -> remove
    @{ old=[byte[]]@(0xC3,0xA2,0xE2,0x80,0xA0,0xC2,0xB5); new=[byte[]]@() },
    # garbled cmd symbol ⌘ (U+2318): C3 A2 C5 92 CB 9C -> remove
    @{ old=[byte[]]@(0xC3,0xA2,0xC5,0x92,0xCB,0x9C); new=[byte[]]@() }
)

$files = Get-ChildItem -Path 'C:\Users\dipan\OneDrive\Desktop\value-codes\views' -Recurse -Include '*.ejs' |
    Select-Object -ExpandProperty FullName

$totalFixed = 0
foreach ($file in $files) {
    $data = [System.IO.File]::ReadAllBytes($file)
    $orig = $data.Length
    foreach ($rep in $replacements) {
        $data = Replace-Bytes $data $rep.old $rep.new
    }
    if ($data.Length -ne $orig) {
        [System.IO.File]::WriteAllBytes($file, $data)
        Write-Host "Fixed: $([System.IO.Path]::GetFileName($file)) (-$($orig - $data.Length) bytes)"
        $totalFixed++
    }
}
Write-Host "Total: $totalFixed files fixed"
