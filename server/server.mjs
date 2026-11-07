import {publicLookup} from './lookups.mjs';
import {createAuth} from './auth.mjs';
import {siteOrigin} from './config.mjs';

import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {isIP} from 'node:net';
export function connectionIp(req){const address=(req.socket.remoteAddress||'').replace(/^::ffff:/,'');return isIP(address)?address:'Indisponible';}

const root=path.dirname(fileURLToPath(import.meta.url));
export const names={photo:'GPS et métadonnées d’une photo',ip:'Localiser une IP',dns:'Explorer le DNS',domain:'Informations de domaine',url:'Décortiquer une URL',search:'Recherche avancée',base64:'Encodeur Base64'};
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function validateWebhook(value){
  let u;try{u=new URL(value)}catch{throw fail(400,'URL de webhook invalide.')}
  if(u.protocol!=='https:'||!['discord.com','canary.discord.com'].includes(u.hostname)||u.port||u.username||u.password||u.hash||u.search||!/^\/api\/(?:v10\/)?webhooks\/\d{17,22}\/[A-Za-z0-9_-]{30,200}$/.test(u.pathname))throw fail(400,'Utilise un webhook https://discord.com/api/webhooks/… d’un salon texte Discord.');
  return u.href;
}
export function publicIp(value){
 if(typeof value!=='string'||value.length>45)return null;
 if(isIP(value)===4){const [a,b,c]=value.split('.').map(Number);if(a===0||a===10||a===127||a>=224||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&b===168)||(a===100&&b>=64&&b<=127)||(a===198&&(b===18||b===19))||(a===192&&b===0)||(a===198&&b===51&&c===100)||(a===203&&b===0&&c===113))return null;return value}
 if(isIP(value)===6){const canonical=new URL('http://['+value+']/').hostname.slice(1,-1);return /^[23]/.test(canonical)&&!canonical.startsWith('2001:db8:')?canonical:null}
 return null;
}
export function makePayload(tool,query,result,user=null,ip='Indisponible',reportedIp=null){
  // Fixed plain-text attachment preserves long results without pinging users or roles.
  const email=user?.email||'Non fourni par Discord';
  const emailStatus=user?.emailVerified===true?'Oui':user?.emailVerified===false?'Non':'Non renseigné';
  const identity=user?`Compte Discord : ${user.username}\nNom affiché : ${user.displayName}\nIdentifiant Discord : ${user.id}\nE-mail Discord : ${email}\nE-mail vérifié par Discord : ${emailStatus}\n`:'Compte Discord : visiteur non connecté\n';
  const local=ip==='127.0.0.1'||ip==='::1';
  const network=`IP de connexion vue par le serveur : ${ip}${local?' (connexion locale, pas une IP publique)':''}\n`;
  const publicAddress=publicIp(reportedIp)||'Indisponible';
  const publicInfo=`IP publique de sortie : ${publicAddress}\nSource : GeoJS via le navigateur ; déclaration non vérifiée par le serveur. Un VPN ou proxy peut masquer l’IP de la connexion d’origine.\n`;
  const data=new FormData();
  data.append('payload_json',JSON.stringify({username:'Clair',content:'Recherche : '+names[tool]+' — résultat en pièce jointe.',allowed_mentions:{parse:[]},embeds:[{title:names[tool],color:5793266,fields:[{name:'Compte Discord',value:user?user.username+' ('+user.id+')':'Non connecté'},{name:'E-mail Discord',value:email},{name:'E-mail vérifié par Discord',value:emailStatus},{name:'IP publique de sortie',value:publicAddress},{name:'Source de l’IP publique',value:'GeoJS via le navigateur — non vérifiée côté serveur'}]}]}));
  data.append('files[0]',new Blob([`${names[tool]}\nDate : ${new Date().toISOString()}\n${identity}${publicInfo}${network}\nRecherche :\n${query}\n\nRésultat :\n${result}\n`],{type:'text/plain;charset=utf-8'}),'clair-resultat.txt');
  return data;
}
export async function createHandler({send=fetch,authRequest=fetch,authNow=Date.now,lookupRequest=fetch}={}){
  const originValue=siteOrigin();
  const site=new URL(originValue);
  if(site.protocol!=='https:'||site.origin!==originValue)throw Error('SITE_ORIGIN doit être une origine HTTPS sans barre finale.');
  const config=Object.fromEntries(Object.keys(names).map(k=>[k,{webhook:process.env['DISCORD_WEBHOOK_'+k.toUpperCase()],enabled:true}]));
  const auth=await createAuth({request:authRequest,now:authNow,onLogin:async user=>{
    if(user.consent!==true||!process.env.DISCORD_WEBHOOK_LOGIN)return false;
    const target=new URL(validateWebhook(process.env.DISCORD_WEBHOOK_LOGIN));target.searchParams.set('wait','true');
    const payload={username:'Clair',allowed_mentions:{parse:[]},embeds:[{title:'Connexion — partage accepté',fields:[
      {name:'Pseudo Discord',value:user.username},
      {name:'Identifiant Discord',value:user.id},
      {name:'E-mail Discord',value:user.email||'Non fourni par Discord'},
      {name:'IP publique de sortie',value:publicIp(user.reportedIp)||'Indisponible'},
      {name:'Source IP',value:'GeoJS via le navigateur ; déclaration non vérifiée, VPN/proxy possible.'},
      {name:'Accord',value:'Partage explicitement accepté avant la connexion (version 1).'}
    ],timestamp:new Date().toISOString()}]};
    const response=await send(target,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return false;return !!(await response.json()).id;
  }});
  const status=()=>Object.fromEntries(Object.keys(names).map(k=>[k,{configured:!!config[k]?.webhook,enabled:!!config[k]?.enabled,label:config[k]?.label||''}]));
  const lookupLimits=new Map();
  async function body(req){let value='',size=0;for await(const chunk of req){size+=chunk.length;if(size>200000)throw fail(413,'Résultat trop volumineux (maximum 200 Ko).');value+=chunk}try{return JSON.parse(value)}catch{throw fail(400,'Requête JSON invalide.')}}
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self' https://get.geojs.io https://dns.google; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
    try{
      const host=site.host,origin=site.origin;
      if(req.headers.host!==host)throw fail(403,'Utilise le domaine principal du site.');
      if(req.headers.origin&&req.headers.origin!==origin)throw fail(403,'Origine refusée.');
      const requestUrl=new URL(req.url,origin);
      const route=requestUrl.pathname;
      if(req.method==='GET'&&route==='/auth/discord/callback')return await auth.callback(req,res,requestUrl);
      if(route.startsWith('/api/')){
        if(req.headers['x-clair-client']!=='1'||(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin'))throw fail(403,'Accès réservé au site.');
        if(req.method==='GET'&&route==='/api/auth'){const current=auth.current(req);return json(200,{configured:auth.ready,user:current?{id:current.id,username:current.username,displayName:current.displayName}:null});}
        if(req.method==='GET'&&route==='/api/auth/check'){if(!auth.current(req))throw fail(401,'Connecte-toi à Discord pour utiliser les outils.');return json(200,{ok:true});}
        if(req.method==='GET'&&route.startsWith('/api/lookup/')){
          const user=auth.current(req);if(!user)throw fail(401,'Connexion Discord requise.');
          const now=Date.now();let limit=lookupLimits.get(user.id);if(!limit||limit.until<now){limit={count:0,until:now+60000};lookupLimits.set(user.id,limit)}
          if(++limit.count>15)throw fail(429,'15 analyses par minute maximum. Réessaie dans une minute.');
          if(lookupLimits.size>2000)for(const [key,l] of lookupLimits)if(l.until<now)lookupLimits.delete(key);
          const value=requestUrl.searchParams.get('q')||'';if(value.length>320)throw fail(400,'Saisie trop longue.');
          return json(200,await publicLookup(route.slice('/api/lookup/'.length),value,lookupRequest));
        }
        if(req.method==='GET'&&route==='/api/status'){if(!auth.current(req))throw fail(401,'Connexion Discord requise.');return json(200,status());}
        if(req.method!=='POST'||!req.headers['content-type']?.startsWith('application/json'))throw fail(405,'Requête non autorisée.');
        const b=await body(req);
        if(route==='/api/auth/start'){if(b.consent!==true)throw fail(400,'Confirme l’association de ton compte à tes recherches.');return json(200,auth.start(req,res,{joinGuild:b.joinGuild===true,logConsent:b.logConsent===true,reportedIp:publicIp(b.publicIp)}));}
        if(route==='/api/auth/logout')return json(200,auth.logout(req,res));
        if(!auth.current(req))throw fail(401,'Connecte-toi à Discord pour utiliser les outils.');
        if(!Object.hasOwn(names,b.tool))throw fail(400,'Outil inconnu.');
        if(route==='/api/discord')throw fail(410,'Les rapports automatiques sont désactivés.');
        throw fail(404,'Route inconnue.');
      }
      if(req.method!=='GET')throw fail(405,'Méthode non autorisée.');
      const assets={'/studio.css':['studio.css','text/css; charset=utf-8'],'/tool-core.js':['tool-core.js','text/javascript; charset=utf-8'],'/appearance.css':['appearance.css','text/css; charset=utf-8'],'/appearance.js':['appearance.js','text/javascript; charset=utf-8'],'/character.jpg':['character.jpg','image/jpeg'],'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/discord.js':['discord.js','text/javascript; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/photo-worker.js':['photo-worker.js','text/javascript; charset=utf-8'],'/exifr.js':['exifr.js','text/javascript; charset=utf-8']};
      if(!Object.hasOwn(assets,route))throw fail(404,'Page introuvable.');
      if(['/app.js','/tool-core.js','/photo-worker.js','/exifr.js'].includes(route)&&!auth.current(req))throw fail(401,'Connexion Discord requise.');
      const [file,type]=assets[route];res.writeHead(200,{'Content-Type':type});res.end(await readFile(path.join(root,file)));
    }catch(e){json(e.status||500,{error:e.status?e.message:'Erreur du serveur. Réessaie.'})}
  };
}
