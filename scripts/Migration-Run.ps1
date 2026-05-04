param([bool]$Execute = $false)

# Mapeia areas, prefixos e IDs iniciais
$AreaMap = @{
    "analise-desenvolvimento-sistemas" = @{ prefix = "ana"; startId = 1001 }
    "informatica-geral" = @{ prefix = "inf"; startId = 3001 }
    "matematica" = @{ prefix = "mat"; startId = 5001 }
    "portugues" = @{ prefix = "port"; startId = 7001 }
}

# Caminho relativo para a pasta 'areas'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$basePath = Join-Path $scriptDir "..\src\assets\data\areas"
$basePath = Resolve-Path $basePath -ErrorAction SilentlyContinue

if (-not (Test-Path $basePath)) {
    Write-Host "ERRO: Pasta 'areas' nao encontrada em $basePath" -ForegroundColor Red
    exit 1
}

$totalMigrated = 0
$fileCount = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SISTEMA DE MIGRACAO DE IDs" -ForegroundColor Cyan
if ($Execute) {
    Write-Host "MODO: EXECUTANDO (dados serao alterados)" -ForegroundColor Green
} else {
    Write-Host "MODO: SIMULACAO (dados nao serao alterados)" -ForegroundColor Yellow
}
Write-Host "BasePath: $basePath" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Processar cada area
foreach ($areaKey in $AreaMap.Keys) {
    $areaPath = Join-Path $basePath $areaKey
    
    if (-not (Test-Path $areaPath)) {
        continue
    }

    $areaConfig = $AreaMap[$areaKey]
    $prefix = $areaConfig.prefix
    $currentId = $areaConfig.startId

    Write-Host "Area: $areaKey (prefixo: $prefix, inicio: $currentId)" -ForegroundColor Cyan

    # Encontrar todos os arquivos JSON recursivamente
    $jsonFiles = @(Get-ChildItem -Path $areaPath -Recurse -Filter "*.json")
    Write-Host "  Arquivos encontrados: $($jsonFiles.Count)" -ForegroundColor Gray

    foreach ($file in $jsonFiles) {
        try {
            $filePath = $file.FullName
            $jsonContent = Get-Content $filePath -Raw
            $json = $jsonContent | ConvertFrom-Json

            if (-not $json.questions -or $json.questions.Count -eq 0) {
                continue
            }

            $questionsProcessed = $json.questions.Count

            # Converter IDs
            for ($i = 0; $i -lt $json.questions.Count; $i++) {
                $json.questions[$i].id = "$prefix$currentId"
                $currentId++
            }

            if ($Execute) {
                # Gravar arquivo apenas em modo Execute
                $json | ConvertTo-Json -Depth 10 | Set-Content $filePath -Force
                Write-Host "  [OK] $(Split-Path $filePath -Leaf) | $questionsProcessed questoes" -ForegroundColor Green
            } else {
                Write-Host "  [SIM] $(Split-Path $filePath -Leaf) | $questionsProcessed questoes" -ForegroundColor Yellow
            }
            
            $totalMigrated += $questionsProcessed
            $fileCount++
        }
        catch {
            Write-Host "  [ERRO] $(Split-Path $file -Leaf): $($_.Message)" -ForegroundColor Red
        }
    }

    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA OPERACAO:" -ForegroundColor Cyan
Write-Host "  Arquivos processados: $fileCount" -ForegroundColor White
Write-Host "  Questoes migradas: $totalMigrated" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if (-not $Execute) {
    Write-Host ""
    Write-Host "Para executar a migracao:" -ForegroundColor Yellow
    Write-Host "  .\Migration-Run.ps1 -Execute `$true" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Migracao concluida com sucesso!" -ForegroundColor Green
}
