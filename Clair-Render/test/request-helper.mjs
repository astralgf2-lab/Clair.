export async function dispatch(request,context={},handler) {
  const url=new URL(request.url);
  const headers=new Headers();
  let status=200,body=null;
  const req={
    method:request.method,url:url.pathname+url.search,
    headers:{...Object.fromEntries(request.headers),host:url.host},
    socket:{remoteAddress:context.ip||''},
    async *[Symbol.asyncIterator](){
      const reader=request.body?.getReader();
      if(!reader)return;
      try {while(true){const {done,value}=await reader.read();if(done)break;yield Buffer.from(value);}}
      finally {await reader.cancel();reader.releaseLock();}
    }
  };
  const res={
    setHeader(name,value){headers.delete(name);for(const v of Array.isArray(value)?value:[value])headers.append(name,String(v));},
    writeHead(code,values={}){status=code;for(const [k,v] of Object.entries(values))this.setHeader(k,v);},
    end(value){body=value??null;}
  };
  await handler(req,res);
  return new Response(body,{status,headers});
}
