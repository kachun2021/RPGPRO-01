const fs = require('fs');
for (const f of ['src/ui/HUD.ts', 'src/ui/CharacterPanel.ts']) {
      let text = fs.readFileSync(f, 'utf8');
      text = text.replace(/\\`/g, '`').replace(/\\\$/g, '$');
      fs.writeFileSync(f, text);
}
console.log("Fixed!");
