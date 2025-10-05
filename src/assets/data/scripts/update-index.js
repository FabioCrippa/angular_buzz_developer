const fs = require('fs');
const path = require('path');

console.log('📊 Atualizando index.json...\n');

// Carregar index atual
const indexPath = './index.json';
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

// Contar questões por área
let totalQuestions = 0;
let totalSubjects = 0;
const areas = ['desenvolvimento-web', 'metodologias', 'design', 'seguranca'];

areas.forEach(area => {
  if (fs.existsSync(`./${area}`)) {
    const files = fs.readdirSync(`./${area}`).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(area, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.questions) {
        totalQuestions += data.questions.length;
        totalSubjects++;
        console.log(`✅ ${area}/${file}: ${data.questions.length} questões`);
      }
    });
  }
});

// Atualizar index
indexData.stats.totalQuestions = totalQuestions;
indexData.stats.totalSubjects = totalSubjects;
indexData.stats.totalAreas = areas.length;
indexData.stats.lastUpdated = new Date().toISOString().split('T')[0];

// Salvar index atualizado
fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');

console.log(`\n📊 Index atualizado!`);
console.log(`📈 Total: ${totalQuestions} questões em ${totalSubjects} disciplinas`);