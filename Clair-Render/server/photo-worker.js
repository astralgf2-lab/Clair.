importScripts('/exifr.js');
self.onmessage=async event=>{
 try{
  const file=event.data;
  if(!(file instanceof Blob)||file.size>25*1024*1024)throw Error('Invalid input');
  const gps=await exifr.gps(file);
  const meta=await exifr.parse(file,['Make','Model','DateTimeOriginal']);
  const lat=gps?.latitude,lon=gps?.longitude;
  const hasGps=Number.isFinite(lat)&&Number.isFinite(lon)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
  self.postMessage({ok:true,hasGps,latitude:hasGps?lat:null,longitude:hasGps?lon:null,make:typeof meta?.Make==='string'?meta.Make.slice(0,150):null,model:typeof meta?.Model==='string'?meta.Model.slice(0,150):null});
 }catch{self.postMessage({ok:false,error:'Ce fichier est illisible ou son format n’est pas pris en charge. Essaie la photo originale en JPEG, PNG, TIFF, HEIC ou AVIF.'})}
};
