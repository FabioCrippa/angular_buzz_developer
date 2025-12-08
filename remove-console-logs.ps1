# Script para remover todos os console.logs do projeto

$projectPath = "c:\Users\cripp\projetos-andamento\angular_buzz_developer\src\app"
$filesModified = 0
$linesRemoved = 0

Get-ChildItem -Path $projectPath -Recurse -Filter "*.ts" | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Encoding UTF8
    $newContent = @()
    $modified = $false
    
    foreach ($line in $content) {
        # Verifica se a linha contém console.log, console.warn ou console.error
        if ($line -match '^\s*console\.(log|warn|error)\(') {
            $linesRemoved++
            $modified = $true
            # Não adiciona a linha (remove ela)
        } else {
            $newContent += $line
        }
    }
    
    if ($modified) {
        # Remove linhas em branco consecutivas (mais de 2)
        $finalContent = @()
        $emptyLineCount = 0
        
        foreach ($line in $newContent) {
            if ($line -match '^\s*$') {
                $emptyLineCount++
                if ($emptyLineCount -le 2) {
                    $finalContent += $line
                }
            } else {
                $emptyLineCount = 0
                $finalContent += $line
            }
        }
        
        $finalContent | Set-Content $filePath -Encoding UTF8
        $filesModified++
        Write-Host "✅ $($_.Name) - Removidas linhas com console.*"
    }
}

Write-Host ""
Write-Host "Resumo:"
Write-Host "   Arquivos modificados: $filesModified"
Write-Host "   Linhas removidas: $linesRemoved"
Write-Host "   Limpeza concluida!"
