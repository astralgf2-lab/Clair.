import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createHandler} from '../server/server.mjs';
import {dispatch} from './request-helper.mjs';
test('journal de connexion : accord, scope email, destinataire serveur et échec',async()=>{
 Object.assign(process.env,{SITE_ORIGIN:'https://test.onrender.com',SESSION_SECRET:randomBytes(32).toString('hex'),DISCORD_CLIENT_ID:'123456789012345678',DISCORD_CLIENT_SECRET:'test-only-secret',DISCORD_WEBHOOK_LOGIN:'https://canary.discord.com/api/webhooks/123456789012345678/'+'a'.repeat(40)});
 for(const [consent,ok] of [[false,true],[true,true],[true,false]]){
  const sends=[];
  const handler=await createHandler({authRequest:async u=>Response.json(u.endsWith('/token')?{access_token:'test',scope:consent?'identify email':'identify'}:{id:'123456789012345678',username:'Tester',email:'tester@example.com'}),send:async(u,o)=>{sends.push({u:String(u),payload:JSON.parse(o.body)});return ok?Response.json({id:'42'}):new Response('',{status:500})}});
  const call=(path,data,cookie)=>dispatch(new Request(process.env.SITE_ORIGIN+path,{method:data?'POST':'GET',headers:{'X-Clair-Client':'1',Origin:process.env.SITE_ORIGIN,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:data?JSON.stringify(data):undefined}),{ip:'127.0.0.1'},handler);
  const start=await call('/api/auth/start',{consent:true,logConsent:consent,publicIp:'8.8.8.8'});
  const url=new URL((await start.json()).url);
  assert.equal(url.searchParams.get('scope'),consent?'identify email':'identify');
  const callback=await call('/auth/discord/callback?code=test&state='+url.searchParams.get('state'),null,start.headers.getSetCookie()[0].split(';')[0]);
  assert.equal(sends.length,consent?1:0);
  assert.equal(callback.headers.get('location'),'/?auth='+(!consent?'connected':ok?'connected_logged':'connected_log_failed'));
  if(consent){assert.equal(new URL(sends[0].u).hostname,'canary.discord.com');assert.deepEqual(sends[0].payload.allowed_mentions,{parse:[]});const text=JSON.stringify(sends[0].payload);for(const expected of ['Tester','tester@example.com','8.8.8.8'])assert.ok(text.includes(expected));assert.ok(!text.includes('access_token'));}
 }
});
