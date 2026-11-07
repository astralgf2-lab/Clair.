(() => {
 const root=document.documentElement;
 let theme='dark',motion=true;
 try{theme=localStorage.getItem('clair-theme')==='light'?'light':'dark';motion=localStorage.getItem('clair-motion')!=='off'}catch{}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function apply(){root.dataset.theme=theme;root.dataset.motion=motion&&!reduced.matches?'on':'off';try{localStorage.setItem('clair-theme',theme);localStorage.setItem('clair-motion',motion?'on':'off')}catch{}}
 apply();
 document.addEventListener('DOMContentLoaded',()=>{
  const dialog=document.getElementById('appearance-dialog'),toggle=document.getElementById('motion-toggle');
  const radios=[...document.querySelectorAll('input[name="theme"]')];
  const sync=()=>{for(const r of radios)r.checked=r.value===theme;toggle.checked=motion;document.getElementById('motion-note').textContent=reduced.matches?'Ton système demande de réduire les animations : cette préférence est respectée.':'Transitions douces et mouvement lent du portrait. Aucun flash ni son.';};
  document.getElementById('appearance-open').onclick=()=>{sync();dialog.showModal()};
  document.getElementById('appearance-close').onclick=()=>dialog.close();
  for(const radio of radios)radio.onchange=()=>{theme=radio.value;apply();document.getElementById('appearance-status').textContent=theme==='light'?'Thème clair enregistré pour les outils.':'Thème sombre enregistré pour les outils.'};
  toggle.onchange=()=>{motion=toggle.checked;apply();document.getElementById('appearance-status').textContent=motion?'Animations activées, selon les préférences de ton système.':'Animations désactivées.'};
  reduced.addEventListener('change',()=>{apply();sync()});
  const result=document.getElementById('result');
  new MutationObserver(()=>{if(root.dataset.motion==='on'&&result.offsetParent)result.animate([{opacity:.5,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'ease-out'})}).observe(result,{childList:true});
  sync();
 });
})();
