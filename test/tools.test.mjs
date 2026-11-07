import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('outils locaux : date Discord, invitation, échappement et proxys',async()=>{
 const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerText:'',innerHTML:'',querySelectorAll:()=>[],replaceChildren(){},insertAdjacentHTML(_,html){this.innerHTML+=html}});return elements.get(id)};
 const context=vm.createContext({$,document:{addEventListener(){}},requireAccount:async()=>true,updateDiscordBadge(){},URL,TextEncoder,TextDecoder,setTimeout,clearTimeout});
 vm.runInContext(await readFile(new URL('../server/app.js',import.meta.url),'utf8'),context);
 const run=async(id,value)=>{vm.runInContext(`choose('${id}')`,context);$('value').value=value;await $('form').onsubmit({preventDefault(){}});return $('result').innerHTML};
 assert.match(await run('snowflake','175928847299117063'),/2016-04-30T11:18:25.796Z/);
 assert.match(await run('invite','175928847299117063'),/permissions=0/);
 assert.match(await run('snowflake','abc'),/invalide/);
 assert.match(await run('username','<script>'),/invalide/);
 const result=await run('proxies','127.0.0.1:8080,127.0.0.1:8080,bad');assert.match(result,/connexion non testée/);assert.match(result,/Format invalide/);
});
