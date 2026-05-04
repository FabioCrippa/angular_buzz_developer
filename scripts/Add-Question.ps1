#!/usr/bin/env pwsh
<#
.SYNOPSIS
Adiciona uma nova questão com ID automático correto

.PARAMETER Area
Área da questão: "analise", "informatica", "matematica", "portugues"

.PARAMETER JsonFile
Caminho relativo ou absoluto do arquivo JSON

.PARAMETER Question
Texto da questão

.PARAMETER Options
Array com opções (será usado template)

.EXAMPLE
.\Add-Question.ps1 -Area analise -JsonFile "src/assets/data/areas/analise-desenvolvimento-sistemas/fundamentos-programacao/javascript.json" -Interactive

#>

param(
    [ValidateSet("analise", "informatica", "matematica", "portugues")]
    [string]$Area = "analise",
    [string]$JsonFile,
    [switch]$Interactive
)

$ErrorActionPreference = "Stop"

# Mapeamento de áreas
$AreaMap = @{
    "analise" = @{ prefix = "ana"; range = "1001-1999" }
    "informatica" = @{ prefix = "inf"; range = "3001-3999" }
    "matematica" = @{ prefix = "mat"; range = "5001-5999" }
    "portugues" = @{ prefix = "port"; range = "7001-7999" }
}

function Get-NextQuestionId {
    param([string]$Area, [string]$JsonFile)

    $areaConfig = $AreaMap[$Area]
    $prefix = $areaConfig.prefix
    $fullPath = if ([System.IO.Path]::IsPathRooted($JsonFile)) { $JsonFile } else { Join-Path $PSScriptRoot "..\$JsonFile" }

    if (-not (Test-Path $fullPath)) {
        Write-Host "Arquivo nao encontrado: $fullPath" -ForegroundColor Red
        return $null
    }

    $json = Get-Content $fullPath -Raw | ConvertFrom-Json
    
    if (-not $json.questions) {
        return "$prefix$(1001)"
    }

    # Encontrar próximo ID (assume que já estão prefixados)
    $maxId = 0
    foreach ($q in $json.questions) {
        $idStr = $q.id -as [string]
        if ($idStr.StartsWith($prefix)) {
            $numPart = [int]($idStr.Substring($prefix.Length))
            if ($numPart -gt $maxId) {
                $maxId = $numPart
            }
        }
    }

    $nextId = if ($maxId -eq 0) { 1001 } else { $maxId + 1 }
    return "$prefix$nextId"
}

function Show-TemplateForCopilot {
    param([string]$Area, [string]$NextId)

    $areaName = @{
        "analise" = "Análise e Desenvolvimento de Sistemas"
        "informatica" = "Informática Geral"
        "matematica" = "Matemática"
        "portugues" = "Português"
    }[$Area]

    Write-Host "`n" -ForegroundColor White
    Write-Host "✅ PRÓXIMO ID DISPONÍVEL: $NextId (Área: $areaName)" -ForegroundColor Green
    Write-Host "`n📋 TEMPLATE PARA COPILOT:" -ForegroundColor Cyan
    Write-Host "=" * 80 -ForegroundColor Cyan

    $template = @"
Gere uma questão para $areaName com a estrutura abaixo. 
Use EXATAMENTE este formato JSON:

{
  "id": "$NextId",
  "question": "[ESCREVA A PERGUNTA AQUI]",
  "options": [
    {
      "id": 1,
      "name": "[OPÇÃO A - CORRETA OU NÃO]",
      "alias": "a"
    },
    {
      "id": 2,
      "name": "[OPÇÃO B]",
      "alias": "b"
    },
    {
      "id": 3,
      "name": "[OPÇÃO C]",
      "alias": "c"
    }
  ],
  "correct": "a",
  "category": "[CATEGORIA/TÓPICO]",
  "explanation": "[EXPLICAÇÃO DA RESPOSTA CORRETA]"
}

Requisitos:
- ID: $NextId (obrigatório)
- Minimum 3 opções, máximo 4
- Escolha apenas UMA letra como correta (a, b, c ou d)
- Explicação clara e educativa
"@

    Write-Host $template -ForegroundColor White
    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host "`n💡 APÓS GERAR NO COPILOT:" -ForegroundColor Yellow
    Write-Host "1. Copie apenas o JSON (sem formatação extra)" -ForegroundColor Yellow
    Write-Host "2. Cole no seu editor no arquivo JSON" -ForegroundColor Yellow
    Write-Host "3. Salve o arquivo" -ForegroundColor Yellow
    Write-Host "4. Execute: .\Validate-Questions.ps1" -ForegroundColor Yellow
}

# Main
if ([string]::IsNullOrEmpty($JsonFile)) {
    Write-Host "❌ JsonFile é obrigatório" -ForegroundColor Red
    Write-Host "`nExemplo de uso:" -ForegroundColor Cyan
    Write-Host '.\Add-Question.ps1 -Area analise -JsonFile "src/assets/data/areas/analise-desenvolvimento-sistemas/fundamentos-programacao/javascript.json"' -ForegroundColor Green
    exit 1
}

$nextId = Get-NextQuestionId -Area $Area -JsonFile $JsonFile

if ($null -eq $nextId) {
    exit 1
}

Show-TemplateForCopilot -Area $Area -NextId $nextId
