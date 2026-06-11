// Vérifie la syntaxe de tous les blocs <script> inline des pages HTML.
// Utilisé par l'intégration continue (.github/workflows/ci.yml) et exécutable
// en local : node scripts/verifier-js.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const fichiers = ['index.html', '404.html'];
let erreurs = 0;

for (const fichier of fichiers) {
    const html = readFileSync(fichier, 'utf8');
    // Seuls les <script> sans attribut sont du JavaScript inline
    // (le JSON-LD porte un attribut type="application/ld+json" et est ignoré ici)
    const blocs = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

    if (blocs.length === 0) {
        console.log(`ℹ️  ${fichier} : aucun script inline`);
        continue;
    }

    blocs.forEach(([, code], index) => {
        try {
            new vm.Script(code, { filename: `${fichier} <script> n°${index + 1}` });
            console.log(`✅ ${fichier} — script n°${index + 1} : syntaxe correcte`);
        } catch (erreur) {
            erreurs++;
            console.error(`❌ ${fichier} — script n°${index + 1} : ${erreur.message}`);
        }
    });
}

process.exit(erreurs > 0 ? 1 : 0);
