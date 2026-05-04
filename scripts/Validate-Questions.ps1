#!/usr/bin/env pwsh
<#
.SYNOPSIS
Valida integridade de questões: IDs duplicados, IDs inválidos, estrutura JSON

.PARAMETER FixDuplicates
Se $true, tenta corrigir IDs duplicados automaticamente

.PARAMETER Verbose
Mostra detalhes de cada arquivo processado

.EXAMPLE
.\Validate-Questions.ps1
.\Validate-Questions.ps1 -FixDuplicates $true -Verbose
#>

param(
    [bool]$FixDuplicates = $false,
    [bool]$Verbose = $false
)

$ErrorActionPreference = "Continue"

$basePath = "$PSScriptRoot\..\src\assets\data\areas"
$logFile = "$PSScriptRoot\validation-log-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').txt"

$stats = @{
    totalFiles = 0
    totalQuestions = 0
    duplicateIds = 0
    invalidIds = 0
    structureErrors = 0
    filesWithErrors = 0
}

function Log-Message {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $logFile -Value $Message
}

function Validate-QuestionId {
    param([string]$Id)
    
    $validPatterns = @(
        "^ana\d{4}$",      # ana1001-1999
        "^inf\d{4}$",      # inf3001-3999
        "^mat\d{4}$",      # mat5001-5999
        "^port\d{4}$"      # port7001-7999
    )
    
    foreach ($pattern in $validPatterns) {
        if ($Id -match $pattern) {
            return $true
        }
    }
    
    return $false
}

Log-Message "🔍 Validando questões..." "Cyan"
Log-Message "Data: $(Get-Date)" "Cyan"
Log-Message "Modo: $(if($FixDuplicates) { 'COM CORREÇÃO' } else { 'LEITURA' })" $(if($FixDuplicates) { "Yellow" } else { "Green" })
Log-Message "`n"

$jsonFiles = Get-ChildItem -Path $basePath -Recurse -Filter "*.json"
$allIds = @{}  # Rastrear todos os IDs

foreach ($file in $jsonFiles) {
    $stats.totalFiles++
    $relativePath = $file.FullName.Replace($basePath, "").TrimStart("\")
    $fileHasErrors = $false

    try {
        $json = Get-Content $file -Raw | ConvertFrom-Json

        if (-not $json.questions) {
            if ($Verbose) {
                Log-Message "   ⏭️  $relativePath (sem questões)" "Gray"
            }
            continue
        }

        $fileIds = @{}
        $fileErrors = @()

        foreach ($question in $json.questions) {
            $stats.totalQuestions++
            $id = $question.id -as [string]

            # Validar formato do ID
            if (-not (Validate-QuestionId -Id $id)) {
                $stats.invalidIds++
                $fileHasErrors = $true
                $fileErrors += "   ❌ ID inválido: $id (esperado: anaXXXX, infXXXX, matXXXX ou portXXXX)"
            }

            # Verificar duplicata no arquivo
            if ($fileIds.ContainsKey($id)) {
                $stats.duplicateIds++
                $fileHasErrors = $true
                $fileErrors += "   ⚠️  ID DUPLICADO NESTE ARQUIVO: $id"
            }
            else {
                $fileIds[$id] = $true
            }

            # Verificar duplicata global
            if ($allIds.ContainsKey($id)) {
                $stats.duplicateIds++
                $fileHasErrors = $true
                $fileErrors += "   🔴 ID DUPLICADO GLOBALMENTE: $id (já existe em outro arquivo!)"
            }
            else {
                $allIds[$id] = $relativePath
            }

            # Validar estrutura
            if (-not $question.question) {
                $stats.structureErrors++
                $fileHasErrors = $true
                $fileErrors += "   📝 Question text ausente para ID: $id"
            }

            if (-not $question.options -or $question.options.Count -lt 2) {
                $stats.structureErrors++
                $fileHasErrors = $true
                $fileErrors += "   📋 Options inválidas para ID: $id (mínimo 2)"
            }

            if (-not $question.correct) {
                $stats.structureErrors++
                $fileHasErrors = $true
                $fileErrors += "   ✓ Correct answer ausente para ID: $id"
            }
        }

        if ($fileHasErrors) {
            $stats.filesWithErrors++
            Log-Message "❌ $relativePath" "Red"
            foreach ($error in $fileErrors) {
                Log-Message $error "Red"
            }
            Log-Message ""
        }
        elseif ($Verbose) {
            Log-Message "✅ $relativePath | $($json.questions.Count) questões OK" "Green"
        }
    }
    catch {
        $stats.filesWithErrors++
        Log-Message "❌ ERRO ao processar $relativePath : $_" "Red"
        Log-Message ""
    }
}

# Relatório Final
Log-Message "`n" "White"
Log-Message "📊 RELATÓRIO FINAL:" "Cyan"
Log-Message "Arquivos processados: $($stats.totalFiles)" "White"
Log-Message "Questões totais: $($stats.totalQuestions)" "White"
Log-Message "IDs duplicados: $($stats.duplicateIds)" $(if($stats.duplicateIds -eq 0) { "Green" } else { "Red" })
Log-Message "IDs inválidos: $($stats.invalidIds)" $(if($stats.invalidIds -eq 0) { "Green" } else { "Red" })
Log-Message "Erros de estrutura: $($stats.structureErrors)" $(if($stats.structureErrors -eq 0) { "Green" } else { "Red" })
Log-Message "Arquivos com erros: $($stats.filesWithErrors)" $(if($stats.filesWithErrors -eq 0) { "Green" } else { "Red" })
Log-Message "`nLog completo: $logFile" "Cyan"

if ($stats.duplicateIds -eq 0 -and $stats.invalidIds -eq 0 -and $stats.structureErrors -eq 0) {
    Log-Message "`n✅ Todas as questões estão válidas!" "Green"
    exit 0
}
else {
    Log-Message "`n⚠️  Existem problemas a corrigir" "Yellow"
    exit 1
}
