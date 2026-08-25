// RESTBR Full Settings Parity — compatibility bridge V1.2
// Loaded immediately before settings-full-parity-v2.js.
// Preserves delegated core controls and serializes the visible Save operation.
(() => {
  'use strict';
  if(window.__RESTBR_FP_BRIDGE_V1__)return;
  window.__RESTBR_FP_BRIDGE_V1__=true;
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let cachedTenantId=null;

  async function tenantId(){
    if(cachedTenantId)return cachedTenantId;
    const sb=window.RESTBR_OWNER_V2_CLIENT;if(!sb)throw new Error('RESTBR client unavailable');
    const host=location.hostname.toLowerCase().replace(/^www\./,'');let res;
    if(host==='hamodybr.github.io'||host==='admin.restbr.com'){
      const slug=String(new URLSearchParams(location.search).get('tenant')||'').trim().toLowerCase();
      res=await sb.from('restaurants').select('id').eq('slug',slug).maybeSingle();
      if(res.error)throw res.error;if(!res.data?.id)throw new Error('restaurant not found');
      return cachedTenantId=res.data.id;
    }
    res=await sb.from('restaurant_domains').select('restaurant_id').eq('hostname',host).eq('status','active').eq('is_verified',true).maybeSingle();
    if(res.error)throw res.error;if(!res.data?.restaurant_id)throw new Error('restaurant domain not found');
    return cachedTenantId=res.data.restaurant_id;
  }

  async function saveVisibilityFresh(){
    const sb=window.RESTBR_OWNER_V2_CLIENT;if(!sb)return;
    const rid=await tenantId();
    const {data,error}=await sb.from('restaurant_settings').select('features').eq('restaurant_id',rid).maybeSingle();if(error)throw error;
    const features=(data?.features&&typeof data.features==='object'&&!Array.isArray(data.features))?{...data.features}:{};
    document.querySelectorAll('[data-vis-key]').forEach(input=>{features[input.dataset.visKey]=Boolean(input.checked);});
    const res=await sb.from('restaurant_settings').update({features,updated_at:new Date().toISOString()}).eq('restaurant_id',rid);if(res.error)throw res.error;
  }

  async function waitUntilSettled(el,timeout=20000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      const text=String(el?.textContent||'').trim();
      if(text&&!/جاري|تحميل|saving/i.test(text))return text;
      await sleep(120);
    }
    throw new Error('انتهت مهلة الحفظ. تحقق من الاتصال وحاول مرة ثانية.');
  }

  function installSafeSave(proxy){
    if(!proxy||proxy.dataset.fpSafeSave==='1')return;
    proxy.dataset.fpSafeSave='1';
    proxy.onclick=async()=>{
      if(proxy.disabled)return;
      const core=$('saveSettingsBtn');const msg=$('settingsMsg');const designSave=$('saveDesignBtn');const designMsg=$('designMsg');
      if(!core)throw new Error('زر الحفظ الأساسي غير متوفر.');
      const old=proxy.textContent;proxy.disabled=true;proxy.textContent='جاري الحفظ...';
      try{
        if(msg){msg.textContent='جاري حفظ إعدادات المطعم...';msg.className='fp-main-msg';}
        core.click();
        const coreResult=await waitUntilSettled(msg,30000);
        if(msg?.classList.contains('err'))throw new Error(coreResult||'فشل حفظ إعدادات المطعم.');

        if(msg){msg.textContent='تم حفظ المعلومات الأساسية — جاري حفظ عناصر الواجهة...';msg.className='fp-main-msg';}
        await saveVisibilityFresh();

        if(designSave&&!designSave.disabled){
          if(msg){msg.textContent='تم حفظ عناصر الواجهة — جاري حفظ التصميم...';msg.className='fp-main-msg';}
          designSave.click();
          const designResult=await waitUntilSettled(designMsg,20000);
          if(designMsg?.classList.contains('err'))throw new Error(designResult||'فشل حفظ التصميم.');
        }

        if(msg){msg.textContent='تم حفظ الإعدادات وعناصر الواجهة والتصميم ✓';msg.className='fp-main-msg status ok';}
      }catch(error){
        if(msg){msg.textContent=error?.message||String(error);msg.className='fp-main-msg status err';}
      }finally{proxy.disabled=false;proxy.textContent=old;}
    };
  }

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

    // After V2 finishes, repair the visible Save button position, install serialized
    // save behavior, and surface optional extension buttons in Tools.
    for(let i=0;i<120;i++){
      const root=$('restbrSettingsFullParity');
      if(root){
        const proxy=$('fpSaveAllBtn');
        if(proxy&&!savebar.contains(proxy)){
          const accidentalCard=proxy.closest('.fp-tool');
          const parking=$('fpCoreSaveParking');
          if(parking&&parking.parentElement===savebar)savebar.insertBefore(proxy,parking);
          else savebar.appendChild(proxy);
          if(accidentalCard&&!accidentalCard.querySelector('button'))accidentalCard.remove();
        }
        installSafeSave(proxy);

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

    console.log('✅ RESTBR Full Settings Parity Bridge V1.2 ready');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});
  else void boot();
})();
