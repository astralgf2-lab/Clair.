import {randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
import {siteOrigin} from './config.mjs';

export async function createAuth({request=fetch,now=Date.now}={}) {
  const {DISCORD_CLIENT_ID:clientId,DISCORD_CLIENT_SECRET:clientSecret,SESSION_SECRET:secret}=process.env;
  const origin=siteOrigin();
  const isHex=/^[a-f0-9]{64}$/i.test(secret||'');
  const isBase64=/^[A-Za-z0-9+/]{43}=$/.test(secret||'');
  if(!isHex&&!isBase64)throw Error('SESSION_SECRET absent ou invalide : utilise la valeur générée par le Blueprint Render.');
  const key=Buffer.from(secret,isHex?'hex':'base64');
  const ready=/^\d{17,22}$/.test(clientId||'')&&typeof clientSecret==='string'&&clientSecret.length>10;
  const cookie=(req,name)=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
  const setCookie=(name,value,age)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
  function seal(type,data,seconds) {
    const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
    cipher.setAAD(Buffer.from(origin+'|'+type));
    const payload=Buffer.concat([cipher.update(JSON.stringify({data,expires:now()+seconds*1000})),cipher.final()]);
    return Buffer.concat([iv,cipher.getAuthTag(),payload]).toString('base64url');
  }
  function unseal(type,value) {
    try {
      if(!value||value.length>3800)return null;
      const bytes=Buffer.from(value,'base64url'),decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));
      decipher.setAAD(Buffer.from(origin+'|'+type));decipher.setAuthTag(bytes.subarray(12,28));
      const payload=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)),decipher.final()]));
      return payload.expires>now()?payload.data:null;
    } catch {return null;}
  }
  const current=req=>unseal('session',cookie(req,'__Host-clair_session'));
  function start(req,res) {
    if(!ready)throw Object.assign(Error('La connexion Discord doit être configurée.'),{status:503});
    const state=randomBytes(32).toString('hex'),redirectUri=origin+'/auth/discord/callback';
    res.setHeader('Set-Cookie',setCookie('__Host-clair_oauth',seal('oauth',{state,redirectUri},600),600));
    const url=new URL('https://discord.com/oauth2/authorize');
    url.search=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirectUri,scope:'identify email',state,prompt:'consent'}).toString();
    return {url:url.href};
  }
  async function callback(req,res,url) {
    const attempt=unseal('oauth',cookie(req,'__Host-clair_oauth'));
    res.setHeader('Set-Cookie',setCookie('__Host-clair_oauth','',0));
    const redirect=outcome=>{res.writeHead(303,{Location:'/?auth='+outcome});res.end();};
    if(!attempt||url.searchParams.get('state')!==attempt.state)return redirect('invalid');
    if(url.searchParams.has('error'))return redirect('cancelled');
    const code=url.searchParams.get('code');
    if(!ready||!code||code.length>4096)return redirect('invalid');
    try {
      const response=await request('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code,redirect_uri:attempt.redirectUri}),redirect:'error',signal:AbortSignal.timeout(10000)});
      if(!response.ok)return redirect('failed');
      const token=await response.json(),scopes=(token.scope||'').split(' ');
      if(typeof token.access_token!=='string'||!scopes.includes('identify'))return redirect('failed');
      const profile=await request('https://discord.com/api/v10/users/@me',{headers:{Authorization:'Bearer '+token.access_token},redirect:'error',signal:AbortSignal.timeout(10000)});
      if(!profile.ok)return redirect('failed');
      const user=await profile.json();
      if(!/^\d{17,22}$/.test(user.id||'')||typeof user.username!=='string'||user.username.length>80)return redirect('failed');
      const email=scopes.includes('email')&&typeof user.email==='string'&&user.email.length<=254&&/^[^\s@]+@[^\s@]+$/.test(user.email)?user.email:null;
      const session=seal('session',{id:user.id,username:user.username,displayName:typeof user.global_name==='string'?user.global_name.slice(0,80):user.username,email,emailVerified:email&&typeof user.verified==='boolean'?user.verified:null},28800);
      res.setHeader('Set-Cookie',[setCookie('__Host-clair_oauth','',0),setCookie('__Host-clair_session',session,28800)]);
      return redirect('connected');
    } catch {return redirect('failed');}
  }
  function logout(req,res){res.setHeader('Set-Cookie',setCookie('__Host-clair_session','',0));return {ok:true};}
  return {ready,current,start,callback,logout};
}
