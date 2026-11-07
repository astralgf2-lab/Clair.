import http from 'node:http';
import {createHandler} from './server/server.mjs';
const handler=await createHandler();
const server=http.createServer((req,res)=>{
 if(req.method==='GET'&&req.url==='/healthz'){res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');return;}
 handler(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"Erreur du serveur"}');});
});
server.listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Clair : serveur prêt.'));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
