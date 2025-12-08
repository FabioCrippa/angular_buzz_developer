# Script seguro para remover apenas console.log, console.warn, console.error SOZINHOS na linha

$files = @(
    "src\app\pages\quizz\quizz.component.ts",
    "src\app\shared\components\premium-upgrade-dialog\premium-upgrade-dialog.component.ts"
)

$removed = 0

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Encoding UTF8
        $newContent = @()
        
        foreach ($line in $content) {
            # Remove APENAS se a linha for EXCLUSIVAMENTE console.log/warn/error
            if ($line -match '^\s*console\.(log|warn|error)\([^)]*\);\s*$') {
                $removed++
                # Pula esta linha (não adiciona)
            } else {
                $newContent += $line
            }
        }
        
        $newContent | Set-Content $fullPath -Encoding UTF8
        Write-Host "OK: $file"
    }
}

Write-Host "Removidos: $removed console.logs"
