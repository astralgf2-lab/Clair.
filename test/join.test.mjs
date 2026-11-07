import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createAuth} from '../server/auth.mjs';
test('Joining requires opt-in and granted scope; errors preserve login',async()=>{
 Object.assign(process.env,{SITE_ORIGIN:'https://test.onrender.com',SESSION_SECRET:randomBytes(32).toString('hex'),DISCORD_CLIENT_ID:'123456789012345678',DISCORD_CLIENT_SECRET:'test-only-secret',DISCORD_BOT_TOKEN:'test-only-bot'});
 for(const [opt,scope,status,expected,calls] of [[false,true,201,'connected',0],[true,true,201,'connected_joined',1],[true,false,201,'connected_join_failed',0],[true,true,403,'connected_join_failed',1],[true,true,204,'connected_joined',1]]){
 let puts=0;const auth=await createAuth({request:async(url,options)=>{
 if(url.endsWith('/token'))return Response.json({access_token:'temporary-token',scope:'identify email'+(scope?' guilds.join':'')});
 if(url.endsWith('/users/@me'))return Response.json({id:'123456789012345678',username:'Tester'});
 puts++;assert.equal(options.method,'PUT');assert.match(url,/guilds\/1404189114911297587\/members\/123456789012345678$/);assert.equal(JSON.parse(options.body).access_token,'temporary-token');return new Response(status===204?null:'{}',{status});
 }});
 let cookies,location;const res={setHeader:(k,v)=>cookies=v,writeHead:(s,h)=>location=h.Location,end:()=>{}};
 const start=auth.start({},res,{joinGuild:opt});const url=new URL(start.url);
 assert.equal(url.searchParams.get('scope').includes('guilds.join'),opt);
 const cookie=cookies.split(';')[0];
 await auth.callback({headers:{cookie}},res,new URL(process.env.SITE_ORIGIN+'/auth/discord/callback?code=test&state='+url.searchParams.get('state')));
 assert.equal(location,'/?auth='+expected);assert.equal(puts,calls);
 assert.ok(auth.current({headers:{cookie:cookies.find(c=>c.startsWith('__Host-clair_session=')).split(';')[0]}}));
 }
 delete process.env.DISCORD_BOT_TOKEN;
 const auth=await createAuth();assert.throws(()=>auth.start({}, {}, {joinGuild:true}),/indisponible/);
});
