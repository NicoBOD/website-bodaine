// Vérifie que tous les fichiers locaux référencés par le site existent bien :
// - les href/src relatifs des pages HTML (CSS, favicons, images…)
// - les url(...) de la feuille de style principale (fonds, polices…)
// Utilisé par l'intégration continue (.github/workflows/ci.yml) et exécutable
// en local : node scripts/verifier-liens.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

let erreurs = 0;
let verifies = 0;

function verifier(chemin, source, reference) {
    verifies++;
    if (!existsSync(chemin)) {
        erreurs++;
        console.error(`❌ ${source} → « ${reference} » introuvable (${chemin})`);
    }
}

// --- Références href/src des pages HTML ---
for (const fichier of ['index.html', '404.html']) {
    const html = readFileSync(fichier, 'utf8');
    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
    for (const ref of references) {
        // Les liens externes, ancres, mailto et data: ne sont pas des fichiers locaux
        if (/^(https?:|mailto:|#|data:)/.test(ref)) continue;
        let chemin = ref.replace(/^\//, '').split(/[?#]/)[0];
        // « / » ou « chemin/ » désignent l'index du dossier
        if (chemin === '' || chemin.endsWith('/')) chemin += 'index.html';
        verifier(chemin, fichier, ref);
    }
}

// --- Références url(...) des feuilles de style ---
for (const feuille of ['assets/css/main.css', 'assets/css/fontawesome-all.min.css', 'assets/css/noscript.css']) {
    if (!existsSync(feuille)) {
        erreurs++;
        console.error(`❌ feuille de style manquante : ${feuille}`);
        continue;
    }
    const css = readFileSync(feuille, 'utf8');
    const references = [...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map(m => m[1]);
    for (const ref of references) {
        if (/^(https?:|data:|#)/.test(ref)) continue;
        const chemin = join(dirname(feuille), ref.split(/[?#]/)[0]);
        verifier(chemin, feuille, ref);
    }
}

if (erreurs > 0) {
    console.error(`\n${erreurs} référence(s) cassée(s) sur ${verifies} vérifiée(s).`);
    process.exit(1);
}
console.log(`✅ ${verifies} références locales vérifiées, aucune n'est cassée.`);
