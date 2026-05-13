const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = xlsx.readFile(path.join(__dirname, '../../arquivos/1. EMEB BENTO ELOI GARCIA.xlsx'));
const sheetNames = workbook.SheetNames.filter(name => !name.includes('CONSOLIDADO') && (name.startsWith('5º') || name.startsWith('9º')));

const allStudents = [];
let gabarito = null;

sheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  let headerRowIdx = -1;
  for (let i = 0; i < 40; i++) {
    if (rows[i] && rows[i][0] === 'Nº' && rows[i][1] === 'Nome') {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx !== -1) {
    if (!gabarito) {
      const gabaritoRow = rows[headerRowIdx + 3];
      gabarito = {
        linguagens: gabaritoRow.slice(3, 24).map(v => v ? v.toString().trim() : null), // 21 questoes
        matematica: gabaritoRow.slice(24, 46).map(v => v ? v.toString().trim() : null), // 22 questoes
      };
    }

    let studentIdx = headerRowIdx + 4;
    while (studentIdx < rows.length) {
      const row = rows[studentIdx];
      if (!row || !row[0] || !row[1]) break; 
      
      const isAbsent = row[2] && row[2].toString().toLowerCase().includes('ausente');
      const name = row[1].toString().trim();
      
      if (!isAbsent && name) {
        const linAns = row.slice(3, 24).map(v => v ? v.toString().trim() : null);
        const matAns = row.slice(24, 46).map(v => v ? v.toString().trim() : null);
        
        let correctLin = 0;
        let correctMat = 0;
        
        linAns.forEach((ans, i) => { if (ans === gabarito.linguagens[i]) correctLin++; });
        matAns.forEach((ans, i) => { if (ans === gabarito.matematica[i]) correctMat++; });

        const linguagensTCT = correctLin;
        const matematicaTCT = correctMat;
        
        const linguagensTRI = 150 + (correctLin * 5);
        const matematicaTRI = 150 + (correctMat * 5);
        
        const writingAdequation = parseInt(row[48]) || 2;
        const writingCoherence = parseInt(row[49]) || 2;
        const writingStructure = parseInt(row[50]) || 2;
        const writingOrthography = parseInt(row[51]) || 2;
        const writingFinalScore = parseFloat(row[52]) || 50.0;

        const getCat = (tct, total) => {
          const pct = tct / total;
          if (pct >= 0.8) return "Avançado";
          if (pct >= 0.6) return "Adequado";
          if (pct >= 0.4) return "Básico";
          return "Abaixo do Básico";
        }

        allStudents.push({
          id: `std-${sheetName}-${row[0]}`,
          name: name,
          class: sheetName.split(' - ')[1].trim(),
          linguagensTCT,
          linguagensTRI,
          linguagensCategory: getCat(linguagensTCT, 21),
          matematicaTCT,
          matematicaTRI,
          matematicaCategory: getCat(matematicaTCT, 22),
          linguagensAnswers: linAns,
          matematicaAnswers: matAns,
          writingAdequation,
          writingCoherence,
          writingStructure,
          writingOrthography,
          writingFinalScore,
          writingCategory: getCat(writingFinalScore, 100)
        });
      }
      studentIdx++;
    }
  }
});

const output = {
  students: allStudents,
  gabarito: gabarito
};

fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../src/data/allData.json'), JSON.stringify(output, null, 2));
console.log(`Parsed ${allStudents.length} students.`);
