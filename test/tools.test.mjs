import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const context=vm.createContext({URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer});
vm.runInContext(await readFile(new URL('../server/tool-core.js',import.meta.url),'utf8'),context);
const core=context.ClairCore;
test('identifiants Discord : précision BigInt et limites',()=>{
 assert.equal(core.snowflake('175928847299117063').date,'2016-04-30T11:18:25.796Z');
 assert.throws(()=>core.snowflake('18446744073709551616'),/invalide/);assert.throws(()=>core.snowflake('<script>'),/invalide/);
});
test('proxys : normalisation, ports, identifiants masqués et doublons',()=>{
 const d=core.proxies('127.0.0.1:8080\nhttp://127.0.0.1:8080\nsocks5://[::1]:1080\nexample.com:0\nhttp://user:password@example.com:80');
 assert.equal(d.valid,2);assert.equal(d.duplicates,1);assert.equal(d.invalid,2);assert.ok(!JSON.stringify(d).includes('password'));assert.ok(!d.clean.includes('user'));
 assert.equal(core.proxies('example.com:80').clean,'http://example.com:80');
});
test('URL : domaine réel, suivi, identifiants et protocole',()=>{
 const d=core.url('https://foo:bar@example.com/a?utm_source=mail&id=42&fbclid=test');
 assert.equal(d.host,'example.com');assert.equal(d.clean,'https://example.com/a?id=42');assert.ok(d.warnings.length);assert.throws(()=>core.url('javascript://alert'),/HTTP/);
});
test('signature binaire ne dépend pas de l’extension',()=>assert.equal(core.signature(new Uint8Array([37,80,68,70]).buffer),'PDF'));
