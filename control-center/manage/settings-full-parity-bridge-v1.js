// RESTBR Full Settings Parity — compatibility bridge V1.0
// Loaded immediately before settings-full-parity-v2.js.
// It preserves the original delegated save/tool buttons when V2 rebuilds the save bar.
(() => {
  'use strict';
  if(window.__RESTBR_FP_BRIDGE_V1__)return;
  window.__RESTBR_FP_BRIDGE_V1__=true;
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  async function boot(){
    let savebar=null;
    for(let i=0;i<100&&!savebar;i++){
      savebar=$('saveSettingsBtn')?.closest('.savebar')||null;
      if(!savebar)await sleep(80);
    }
    if(!savebar)return;

    // Keep the exact original nodes (and their event wiring) alive.
    const originalNodes=[...savebar.children];
    const originalButtons=originalNodes.flatMap(node=>node.matches?.('button')?[node]:[...node.querySelectorAll?.('button')||[]]);

    const restoreCore=()=>{
      if(!$('fpSaveAllBtn'))return false;
      let parking=$('fpCoreSaveParking');
      if(!parking){parking=document.createElement('div');parking.id='fpCoreSaveParking';parking.className='fp-hidden-source';}
      originalNodes.forEach(node=>{if(!node.isConnected)parking.appendChild(node);});
      if(!parking.isConnected)savebar.appendChild(parking);
      return true;
    };

    const observer=new MutationObserver(()=>{if(restoreCore())observer.disconnect();});
    observer.observe(savebar,{childList:true,subtree:false});
    restoreCore();

    // After V2 finishes, surface optional extension buttons inside the final Tools accordion.
    for(let i=0;i<120;i++){
      const root=$('restbrSettingsFullParity');
      if(root){
        const tools=[...root.querySelectorAll('.fp-accordion')].find(d=>d.querySelector('.fp-title strong')?.textContent.trim()==='أدوات إضافية');
        if(tools){
          let grid=tools.querySelector('.fp-tools-grid');
          if(!grid){grid=document.createElement('div');grid.className='fp-tools-grid';tools.querySelector('.fp-body')?.prepend(grid);}
          const skip=new Set(['saveSettingsBtn','fpSaveAllBtn','rbVisibilityOpen','rbActionsOpen']);
          originalButtons.forEach(button=>{
            if(skip.has(button.id)||!button.isConnected)return;
            if(button.closest('.fp-tool'))return;
            const card=document.createElement('div');card.className='fp-tool';
            const copy=document.createElement('div');copy.innerHTML=`<strong>${button.textContent.trim()||button.id}</strong><small>أداة إضافية خاصة بهذا المطعم.</small>`;
            card.append(copy,button);grid.appendChild(card);
          });
          if(grid.children.length){tools.querySelectorAll('.fp-note').forEach(n=>{if(/لا توجد أدوات إضافية/.test(n.textContent||''))n.remove();});}
          break;
        }
      }
      await sleep(100);
    }

    console.log('✅ RESTBR Full Settings Parity Bridge V1.0 ready');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});
  else void boot();
})();
