param([bool]$Execute = $false)

# Carregar mapeamento de arquivo para prefixo
$fileMapping = @{
    "angular.json" = "ana-ang"
    "css.json" = "ana-css"
    "debugging-frontend.json" = "ana-deb"
    "html.json" = "ana-htm"
    "react.json" = "ana-rea"
    "responsividade.json" = "ana-res"
    "figma.json" = "ana-fig"
    "micro-front-end.json" = "ana-mic"
    "boas-praticas.json" = "ana-boa"
    "javascript.json" = "ana-jav"
    "typescript.json" = "ana-typ"
    "ci-cd.json" = "ana-cic"
    "code-review.json" = "ana-cod"
    "devops.json" = "ana-dev"
    "scrum.json" = "ana-scr"
    "testes-unitarios.json" = "ana-tes"
    "versionamento.json" = "ana-ver"
    "entrevista-tecnica.json" = "ana-ent"
    "autenticacao.json" = "ana-aut"
    "criptografia.json" = "ana-cri"
    "hardware.json" = "inf-har"
    "internet.json" = "inf-int"
    "sistemasOperacionais.json" = "inf-sis"
    "editorTexto.json" = "inf-edi"
    "planilhas.json" = "inf-pla"
    "redes.json" = "inf-red"
    "raciocinio-logico.json" = "mat-rac"
    "algebra.json" = "mat-alg"
    "equacoes.json" = "mat-equ"
    "geometria.json" = "mat-geo"
    "porcentagem.json" = "mat-por"
    "proporcao.json" = "mat-pro"
    "razao.json" = "mat-raz"
    "regraTres.json" = "mat-reg"
    "gramatica.json" = "port-gra"
    "ortografia.json" = "port-ort"
    "semantica.json" = "port-sem"
    "coerencia.json" = "port-coe"
    "coesao.json" = "port-ces"
    "interpretacao.json" = "port-int"
    "redacao.json" = "port-red"
}

# Caminho base
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$basePath = Join-Path $scriptDir "..\src\assets\data\areas"
$basePath = Resolve-Path $basePath -ErrorAction SilentlyContinue

if (-not (Test-Path $basePath)) {
    Write-Host "ERRO: Pasta 'areas' nao encontrada" -ForegroundColor Red
    exit 1
}

$totalMigrated = 0
$fileCount = 0

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MIGRACAO PARA NOVO SISTEMA DE IDs" -ForegroundColor Cyan
Write-Host "Formato: ana-xyz1001 (com prefixo de arquivo)" -ForegroundColor Cyan
if ($Execute) {
    Write-Host "MODO: EXECUTANDO (dados serao alterados)" -ForegroundColor Green
} else {
    Write-Host "MODO: SIMULACAO (dados nao serao alterados)" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Processar cada arquivo
$allFiles = Get-ChildItem -Path $basePath -Recurse -Filter "*.json"

foreach ($file in $allFiles) {
    $fileName = $file.Name
    
    # Pular se nao estiver no mapeamento
    if (-not $fileMapping.ContainsKey($fileName)) {
        continue
    }

    $newPrefix = $fileMapping[$fileName]

    try {
        $filePath = $file.FullName
        $jsonContent = Get-Content $filePath -Raw
        $json = $jsonContent | ConvertFrom-Json

        if (-not $json.questions -or $json.questions.Count -eq 0) {
            continue
        }

        $questionsProcessed = $json.questions.Count

        # Converter IDs - cada arquivo comeca do 1001
        for ($i = 0; $i -lt $json.questions.Count; $i++) {
            $newId = $newPrefix + [string](1001 + $i)
            $json.questions[$i].id = $newId
        }

        if ($Execute) {
            $json | ConvertTo-Json -Depth 10 | Set-Content $filePath -Force
            Write-Host "  [OK] $fileName → $($fileMapping[$fileName])1001~$(($fileMapping[$fileName]))$([string](1000 + $questionsProcessed)) | $questionsProcessed questoes" -ForegroundColor Green
        } else {
            Write-Host "  [SIM] $fileName → $($fileMapping[$fileName])1001~$(($fileMapping[$fileName]))$([string](1000 + $questionsProcessed)) | $questionsProcessed questoes" -ForegroundColor Yellow
        }
        
        $totalMigrated += $questionsProcessed
        $fileCount++
    }
    catch {
        Write-Host "  [ERRO] $fileName : $($_.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUMO:" -ForegroundColor Cyan
Write-Host "  Arquivos processados: $fileCount" -ForegroundColor White
Write-Host "  Questoes migradas: $totalMigrated" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if (-not $Execute) {
    Write-Host ""
    Write-Host "Para executar a migracao:" -ForegroundColor Yellow
    Write-Host "  .\Migration-ToFilePrefix.ps1 -Execute `$true" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Migracao para novo sistema concluida!" -ForegroundColor Green
}
