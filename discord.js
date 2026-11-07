const $=id=>document.getElementById(id);
let discordSettings={},discordAvailable=false,account=null,loginReady=false,appLoaded=false,toolsPromise=null;
async function discordApi(route,data){
 let r;try{r=await fetch('/api/'+route,{method:data?'POST':'GET',headers:{'X-Clair-Client':'1',...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(20000)})}catch{throw Error('Serveur indisponible. Réessaie dans quelques instants. Si un envoi était en cours, vérifie Discord avant de réessayer.')}
 if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Connexion Discord indisponible : Render renvoie une page au lieu de la réponse du serveur. Vérifie que le projet Render est un Web Service et que le déploiement a réussi.');
 let b;try{b=await r.json()}catch{throw Error('Réponse du serveur illisible. Réessaie après avoir vérifié le déploiement Render.')}if(!r.ok)throw Object.assign(Error(b.error||'Action impossible.'),{status:r.status});return b;
}
function updateDiscordBadge(){$('discord-state').textContent='Session Discord active · Aucun envoi automatique de recherches.'}
async function refreshDiscord(){updateDiscordBadge()}
function accountMessage(message){$('account-feedback').textContent=message;$('account-feedback').hidden=!message}
function lockTools(){document.documentElement.dataset.screen='login';if(typeof cancelPhoto==='function')cancelPhoto();$('photo-file').value='';$('photo-share-consent').checked=false;account=null;$('tools-area').hidden=true;$('login-gate').hidden=false;$('account-name').textContent='';$('account-login').hidden=false;$('account-logout').hidden=true;if(typeof generation!=='undefined')generation++;$('value').value='';if($('bulk-value'))$('bulk-value').value='';if(typeof resetWorkspace==='function')resetWorkspace();$('submit').disabled=false;$('result').replaceChildren();}
async function requireAccount(){try{await discordApi('auth/check');return true}catch(e){lockTools();accountMessage(e.status===401?'Ta session a expiré. Reconnecte-toi à Discord pour continuer.':e.message);return false}}
async function loadTools(){if(appLoaded)return;if(toolsPromise)return toolsPromise;const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Impossible de charger les outils. Actualise la page.'))};document.body.append(s)});toolsPromise=(async()=>{if(!globalThis.ClairCore)await load('/tool-core.js');await load('/app.js');appLoaded=true})().catch(e=>{toolsPromise=null;throw e});return toolsPromise}
async function refreshAccount(){
 try{const a=await discordApi('auth');loginReady=a.configured;
  for(const id of ['account-login','gate-login']){$(id).textContent=loginReady?(id==='gate-login'?'Connecte-toi':'Se connecter avec Discord'):'Connexion Discord indisponible';$(id).disabled=!loginReady}
  $('gate-status').textContent=loginReady?'':'Le propriétaire doit terminer la configuration de la connexion.';
  if(!a.user){lockTools();return}
  account=a.user;await loadTools();document.documentElement.dataset.screen='tools';$('tools-area').hidden=false;$('login-gate').hidden=true;$('account-name').textContent='Connecté : '+account.username;$('account-login').hidden=true;$('account-logout').hidden=false;await refreshDiscord();
 }catch(e){lockTools();$('gate-status').textContent=e.message;}
}
function openLogin(){$('account-log-consent').checked=false;$('account-join').checked=false;$('account-consent').checked=false;$('account-continue').disabled=true;$('account-modal-status').textContent='';$('account-dialog').showModal()}
$('account-login').onclick=openLogin;$('gate-login').onclick=openLogin;
$('account-close').onclick=()=>$('account-dialog').close();
$('account-consent').onchange=()=>{$('account-continue').disabled=!$('account-consent').checked};
$('account-continue').onclick=async()=>{
 if(!$('account-consent').checked)return;$('account-continue').disabled=true;$('account-modal-status').textContent='Ouverture de Discord…';
 try{const logConsent=$('account-log-consent').checked;let publicIp=null;
 if(logConsent){$('account-modal-status').textContent='Obtention...';try{const r=await fetch('https://get.geojs.io/v1/ip.json',{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.timeout(6000)});if(r.ok){const d=await r.json();if(typeof d.ip==='string'&&d.ip.length<=45)publicIp=d.ip}}catch{} }
 const r=await discordApi('auth/start',{consent:true,logConsent,publicIp,joinGuild:$('account-join').checked});location.assign(r.url)}catch(e){$('account-modal-status').textContent=e.message;$('account-continue').disabled=false}
};
$('account-logout').onclick=async()=>{try{await discordApi('auth/logout',{});lockTools();accountMessage('Déconnecté. Reconnecte-toi pour utiliser les outils.')}catch(e){accountMessage(e.message)}};
const authOutcome=new URLSearchParams(location.search).get('auth');
if(authOutcome){const messages={connected_logged:'Connexion réussie.',connected_log_failed:'Connexion réussie. L’envoi du journal à Discord n’a pas été confirmé ; aucun nouvel essai automatique.',connected_joined:'Connexion réussie. Tu es membre du serveur Discord demandé.',connected_join_pending:'Connexion réussie. Ouvre Discord pour accepter les règles du serveur.',connected_join_failed:'Connexion réussie, mais l’ajout au serveur Discord n’a pas été confirmé. Vérifie Discord avant de réessayer.',connected:'Connexion réussie.',cancelled:'Connexion annulée. Connecte-toi pour accéder aux outils.',invalid:'La demande de connexion a expiré ou n’est pas valide. Réessaie.',failed:'La connexion Discord a échoué. Réessaie plus tard.'};accountMessage(messages[authOutcome]||'');history.replaceState(null,'',location.pathname)}
refreshAccount();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAccount()});
