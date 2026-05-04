#!/usr/bin/env pwsh
<#
.SYNOPSIS
Migra IDs de questões para novo formato: ana1001, inf3001, mat5001, port7001

.DESCRIPTION
Converte todos os IDs de questões de um número aleatório para o padrão prefixado:
- ana1001-1999: Análise e Desenvolvimento de Sistemas
- inf3001-3999: Informática Geral
- mat5001-5999: Matemática
- port7001-7999: Português

.PARAMETER DryRun
Se $true, apenas mostra o que seria alterado sem fazer mudanças

.EXAMPLE
.\Migrate-QuestionIds.ps1
.\Migrate-QuestionIds.ps1 -DryRun $true
#>

param(
    [bool]$DryRun = $false
)

$ErrorActionPreference = "Stop"

# Mapeamento de áreas
$AreaMap = @{
    "analise-desenvolvimento-sistemas" = @{ prefix = "ana"; startId = 1001 }
    "informatica-geral" = @{ prefix = "inf"; startId = 3001 }
    "matematica" = @{ prefix = "mat"; startId = 5001 }
    "portugues" = @{ prefix = "port"; startId = 7001 }
}

$basePath = "$PSScriptRoot\..\src\assets\data\areas"
$logFile = "$PSScriptRoot\migration-log-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"
$migratedCount = 0
$errors = @()

function Log-Message {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $logFile -Value $Message
}

Log-Message "🔄 Iniciando migração de IDs de questões..." "Cyan"
Log-Message "Data: $(Get-Date)" "Cyan"
Log-Message "Modo: $(if($DryRun) { 'DRY RUN (sem alterações)' } else { 'PRODUÇÃO' })" $(if($DryRun) { "Yellow" } else { "Green" })
Log-Message "`n" "White"

# Processar cada área
foreach ($areaKey in $AreaMap.Keys) {
    $areaPath = Join-Path $basePath $areaKey
    
    if (-not (Test-Path $areaPath)) {
        Log-Message "⚠️  Área não encontrada: $areaPath" "Yellow"
        continue
    }

    $areaConfig = $AreaMap[$areaKey]
    $prefix = $areaConfig.prefix
    $currentId = $areaConfig.startId

    Log-Message "Processando area: $areaKey (prefixo: $prefix)" "Cyan"

    # Encontrar todos os JSONs nesta area
    $jsonFiles = Get-ChildItem -Path $areaPath -Recurse -Filter "*.json"

    foreach ($file in $jsonFiles) {
        try {
            $json = Get-Content $file -Raw | ConvertFrom-Json

            if (-not $json.questions) {
                continue
            }

            $oldIds = $json.questions | ForEach-Object { $_.id }
            $questionsProcessed = 0

            # Atualizar IDs das questões
            foreach ($question in $json.questions) {
                $oldId = $question.id
                $question.id = "$prefix$currentId"
                $currentId++
                $questionsProcessed++
            }

            if ($questionsProcessed -gt 0) {
                $relativePath = $file.FullName.Replace($basePath, "").TrimStart("\")
                
                if ($DryRun) {
                    Log-Message "   [DRY RUN] Arquivo: $relativePath | $questionsProcessed questões atualizadas" "Yellow"
                } else {
                    $json | ConvertTo-Json -Depth 10 | Set-Content $file
                    Log-Message "   ✅ Arquivo: $relativePath | $questionsProcessed questões atualizadas" "Green"
                    $migratedCount += $questionsProcessed
                }
            }
        }
        catch {
            $errorMsg = "   ❌ Erro ao processar $($file.Name): $_"
            Log-Message $errorMsg "Red"
            $errors += $errorMsg
        }
    }

    Log-Message ""
}

Log-Message "`n" "White"
Log-Message "📊 RESUMO:" "Cyan"
Log-Message "Questões migradas: $migratedCount" $(if($migratedCount -gt 0) { "Green" } else { "Yellow" })
Log-Message "Erros encontrados: $($errors.Count)" $(if($errors.Count -eq 0) { "Green" } else { "Red" })
Log-Message "Log salvo em: $logFile" "Cyan"
Log-Message "`n" "White"

if ($DryRun) {
    Log-Message "⚠️  Para executar a migração de verdade, execute:" "Yellow"
    Log-Message "   .\Migrate-QuestionIds.ps1 -DryRun `$false" "Yellow"
}
else {
    Log-Message "✅ Migração concluída com sucesso!" "Green"
}

if ($errors.Count -gt 0) {
    Log-Message "`n❌ ERROS:" "Red"
    foreach ($error in $errors) {
        Log-Message $error "Red"
    }
}
