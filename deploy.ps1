# ===============================================
# 🚀 SCRIPT DE DEPLOY AUTOMÁTICO - SOWLFY
# ===============================================

Write-Host "🚀 Iniciando deploy do SOWLFY..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Diretório correto verificado" -ForegroundColor Green

# 2. Limpar cache e node_modules antigos
Write-Host ""
Write-Host "🧹 Limpando cache..." -ForegroundColor Yellow
if (Test-Path ".angular") {
    Remove-Item -Recurse -Force .angular
    Write-Host "   ✓ .angular removido" -ForegroundColor Gray
}

# 3. Instalar dependências
Write-Host ""
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas" -ForegroundColor Green

# 4. Build de produção
Write-Host ""
Write-Host "🔨 Compilando para produção..." -ForegroundColor Yellow
ng build --configuration production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao compilar!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build de produção concluído" -ForegroundColor Green

# 5. Verificar tamanho dos arquivos
Write-Host ""
Write-Host "📊 Tamanho do bundle:" -ForegroundColor Yellow
Get-ChildItem "dist\buzz_developter" -Recurse | Measure-Object -Property Length -Sum | ForEach-Object {
    $size = [math]::Round($_.Sum / 1MB, 2)
    Write-Host "   Total: $size MB" -ForegroundColor Gray
}

# 6. Commit das alterações
Write-Host ""
Write-Host "📝 Commit das alterações..." -ForegroundColor Yellow
git add .
git commit -m "deploy: production ready with subscription system"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Nada para commitar (tudo já está no git)" -ForegroundColor Yellow
}

# 7. Push para GitHub
Write-Host ""
Write-Host "⬆️  Enviando para GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: Erro ao fazer push. Verifique suas credenciais." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOY PREPARADO COM SUCESSO!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  FRONTEND (Vercel):" -ForegroundColor White
Write-Host "   vercel --prod" -ForegroundColor Gray
Write-Host "   ou" -ForegroundColor Gray
Write-Host "   - Acesse: https://vercel.com/new" -ForegroundColor Gray
Write-Host "   - Importe o repositório GitHub" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  BACKEND (Railway):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   railway up" -ForegroundColor Gray
Write-Host "   ou" -ForegroundColor Gray
Write-Host "   - Acesse: https://railway.app/new" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Leia o guia completo:" -ForegroundColor White
Write-Host "   code DEPLOY.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 URLs após deploy:" -ForegroundColor Yellow
Write-Host "   Frontend: https://seu-app.vercel.app" -ForegroundColor Gray
Write-Host "   Backend:  https://seu-backend.railway.app" -ForegroundColor Gray
Write-Host ""
