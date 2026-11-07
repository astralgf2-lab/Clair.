import {readFile,readdir} from 'node:fs/promises';

// Fail the build without printing a matched credential.
const patterns=[
  /https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\/\d+\/[A-Za-z0-9_-]{20,}/,
  /[A-Za-z0-9_-]{23,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,}/,
  /mfa\.[A-Za-z0-9_-]{60,}/,
  /(?:clientSecret|client_secret|DISCORD_CLIENT_SECRET|SESSION_SECRET)\s*["']?\s*[:=]\s*["'][^"']{10,}["']/
];
async function inspect(file){
  if(/\.(jpg|png|ico|woff2?)$/i.test(file))return;
  const content=await readFile(file,'utf8');
  if(patterns.some(pattern=>pattern.test(content)))throw Error('Compilation bloquée : identifiant secret potentiel dans '+file+'. Retire-le et utilise les variables Netlify.');
}
async function publicFiles(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.')||/^(?:server|netlify|node_modules)$/i.test(entry.name))throw Error('Fichier ou dossier privé interdit dans public.');
    const file=dir+'/'+entry.name;
    if(entry.isDirectory())await publicFiles(file);else await inspect(file);
  }
}

for(const file of ['index.html','appearance.css','appearance.js','discord.js','app.js','photo-worker.js','exifr.js'])await inspect('server/'+file);
console.log('Vérification des fichiers navigateur réussie.');
