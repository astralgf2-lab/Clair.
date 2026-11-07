import test from 'node:test';import assert from 'node:assert/strict';
import {domainName,inviteCode,publicLookup} from '../server/lookups.mjs';
test('destinations externes fixes et validation des entrées',async()=>{
 assert.equal(domainName('https://Example.com/a'),'example.com');assert.throws(()=>domainName('localhost'));assert.throws(()=>inviteCode('https://example.com/code'));assert.equal(inviteCode('https://discord.gg/hello'),'hello');
 let calls=0;await assert.rejects(publicLookup('ip','999.8.8.8',async()=>{calls++}),/invalide/);assert.equal(calls,0);
});
test('diagnostic email : seul le domaine est envoyé et null MX conservé',async()=>{
 const urls=[];const d=await publicLookup('email','person@example.com',async u=>{urls.push(u);const name=new URL(u).searchParams.get('name'),type=new URL(u).searchParams.get('type');return Response.json({Status:0,Answer:[{name,type:type==='MX'?15:16,data:type==='MX'?'0 .':name.startsWith('_dmarc')?'"v=DMARC1; p=reject"':'"v=spf1 -all"',TTL:300}]})});
 assert.equal(d.mx.records[0].value,'0 .');assert.equal(d.spf.records.length,1);assert.equal(d.dmarc.records.length,1);assert.equal(urls.length,3);assert.ok(urls.every(u=>!u.includes('person')&&new URL(u).hostname==='dns.google'));
});
test('DNS : erreurs partielles distinctes des absences',async()=>{
 const d=await publicLookup('domain','example.com',async u=>new URL(u).searchParams.get('type')==='AAAA'?new Response('',{status:503}):Response.json({Status:0}));
 assert.equal(d.records.length,7);assert.ok(d.records.find(r=>r.type==='AAAA').error);assert.equal(d.records.find(r=>r.type==='A').error,null);
});
test('serveur Discord : endpoint fixe et champs publics sélectionnés',async()=>{
 const d=await publicLookup('invite','https://discord.gg/test',async u=>{assert.equal(new URL(u).hostname,'discord.com');return Response.json({code:'test',guild:{id:'175928847299117063',name:'Test',features:[]},approximate_member_count:42,inviter:{email:'not-returned@example.com'}})});
 assert.equal(d.members,42);assert.ok(!JSON.stringify(d).includes('not-returned'));
});
