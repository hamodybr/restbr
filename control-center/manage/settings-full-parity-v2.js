// ============================================================
// RESTBR MANAGER — FULL SETTINGS PARITY V2.0
// Rebuilds the Restaurant Manager settings page to match the original
// Shorash settings structure while reusing the existing tenant-safe controls.
// No IDs are cloned. Existing save/RLS/tool logic stays authoritative.
// ============================================================
(() => {
  'use strict';
  if (window.__RESTBR_SETTINGS_FULL_PARITY_V2__) return;
  window.__RESTBR_SETTINGS_FULL_PARITY_V2__ = true;

  const $ = id => document.getElementById(id);
  const q = (sel, root=document) => root.querySelector(sel);
  const qa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const state = { mounted:false, mounting:false, tenantId:null, visibilityPrimed:false, bulkPrimed:false };

  async function waitFor(getter, timeout=5000, step=80){
    const start=Date.now();
    while(Date.now()-start<timeout){
      const value=getter();
      if(value)return value;
      await sleep(step);
    }
    return null;
  }

  function addStyles(){
    if($('restbrFullParityStyles'))return;
    const s=document.createElement('style');
    s.id='restbrFullParityStyles';
    s.textContent=`
      #view-settings.fp-view{overflow:visible!important}
      #view-settings.fp-view>.panel{padding:8px 0 0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important}
      #view-settings.fp-view>.panel>.panel-head{padding:0 3px 10px!important;margin:0!important;border:0!important}
      #view-settings.fp-view>.panel>.panel-head h3{font-size:22px!important;margin:0!important}
      #view-settings.fp-view>.panel>.panel-head small{font-size:11px!important;line-height:1.6!important;color:var(--muted)!important}
      .fp-wrap{display:grid;gap:10px;width:100%;min-width:0;padding-bottom:22px}
      .fp-wrap *{box-sizing:border-box;min-width:0}
      .fp-savebar{position:relative;z-index:5;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px 12px;margin-bottom:1px;border:1px solid color-mix(in srgb,var(--gold) 22%,var(--line));border-radius:16px;background:var(--panel);box-shadow:0 10px 28px color-mix(in srgb,var(--text) 6%,transparent)}
      .fp-save-copy strong{display:block;font-size:13px;margin-bottom:3px}.fp-save-copy span{display:block;color:var(--muted);font-size:10px;line-height:1.55}
      .fp-save-btn{min-height:42px;padding-inline:18px!important}
      .fp-main-msg{min-height:0;margin:0 3px;color:var(--muted);font-size:11px}
      .fp-accordion{width:100%;overflow:hidden;border:1px solid color-mix(in srgb,var(--gold) 18%,var(--line));border-radius:17px;background:linear-gradient(145deg,color-mix(in srgb,var(--gold) 4%,var(--panel)),var(--panel));box-shadow:0 7px 24px color-mix(in srgb,var(--text) 4%,transparent)}
      .fp-accordion[open]{border-color:color-mix(in srgb,var(--gold) 34%,var(--line))}
      .fp-accordion>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;user-select:none;-webkit-user-select:none}
      .fp-accordion>summary::-webkit-details-marker{display:none}
      .fp-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--gold) 8%,var(--panel2));border:1px solid color-mix(in srgb,var(--gold) 16%,var(--line));font-size:18px}
      .fp-title strong{display:block;font-size:14px;line-height:1.35;color:var(--text);margin-bottom:3px}.fp-title small{display:block;color:var(--muted);font-size:10px;line-height:1.5}
      .fp-chevron{font-size:18px;color:var(--muted);transition:.18s}.fp-accordion[open] .fp-chevron{transform:rotate(180deg);color:var(--gold)}
      .fp-body{display:grid;gap:10px;padding:10px;border-top:1px solid var(--line);overflow:hidden}
      .fp-card{border:1px solid var(--line);border-radius:15px;padding:11px;background:var(--panel2)}
      .fp-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px}.fp-card-head strong{display:block;font-size:12px;line-height:1.35}.fp-card-head small{display:block;margin-top:3px;color:var(--muted);font-size:9px;line-height:1.55}
      .fp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fp-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}.fp-grid.one{grid-template-columns:1fr}
      .fp-field{display:flex;flex-direction:column;gap:6px}.fp-field>span,.fp-field>label{font-size:10px;color:var(--muted)}
      .fp-field input,.fp-field select,.fp-field textarea,.fp-pane input,.fp-pane select,.fp-pane textarea{width:100%!important;max-width:100%!important;border:1px solid var(--line)!important;background:var(--input)!important;color:var(--text)!important;border-radius:12px!important;padding:11px 12px!important;outline:none!important;font-size:16px!important}
      .fp-field textarea,.fp-pane textarea{min-height:82px;resize:vertical}
      .fp-toggle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .fp-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--panel)}
      .fp-toggle-copy strong{display:block;font-size:11px;line-height:1.35}.fp-toggle-copy small{display:block;margin-top:3px;color:var(--muted);font-size:9px;line-height:1.45}
      .fp-switch{position:relative;width:43px;height:25px;flex:0 0 43px}.fp-switch input{position:absolute;opacity:0;pointer-events:none}.fp-switch i{position:absolute;inset:0;border-radius:999px;background:color-mix(in srgb,var(--muted) 28%,var(--panel2));border:1px solid var(--line);transition:.18s}.fp-switch i:after{content:'';position:absolute;top:3px;right:3px;width:17px;height:17px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.18);transition:.18s}.fp-switch input:checked+i{background:linear-gradient(135deg,var(--gold),var(--gold2));border-color:transparent}.fp-switch input:checked+i:after{transform:translateX(-18px)}
      .fp-tri{border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden}.fp-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:5px;border-bottom:1px solid var(--line);background:var(--panel2)}.fp-tabs button{border:0;border-radius:9px;background:transparent;color:var(--muted);min-height:33px;font-size:10px;font-weight:800}.fp-tabs button.active{background:color-mix(in srgb,var(--gold) 13%,var(--panel));color:var(--gold)}.fp-pane{display:none;padding:9px}.fp-pane.active{display:block}
      .fp-lang-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.fp-lang{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--panel)}.fp-lang span{font-size:11px;font-weight:800}.fp-lang input{width:19px;height:19px;accent-color:var(--gold)}
      .fp-social-row{display:grid;grid-template-columns:86px minmax(0,1fr);gap:8px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:12px;background:var(--panel)}.fp-social-row strong{font-size:10px}.fp-social-row input{width:100%!important;border:1px solid var(--line)!important;background:var(--input)!important;color:var(--text)!important;border-radius:11px!important;padding:10px 11px!important;font-size:16px!important}
      .fp-subdetails{border:1px solid var(--line);border-radius:13px;background:var(--panel);overflow:hidden}.fp-subdetails>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:9px;padding:10px 11px;font-size:11px;font-weight:900}.fp-subdetails>summary::-webkit-details-marker{display:none}.fp-subdetails>summary:after{content:'⌄';color:var(--muted)}.fp-subdetails[open]>summary:after{transform:rotate(180deg);color:var(--gold)}.fp-subbody{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:9px;border-top:1px solid var(--line)}
      .fp-subbody .field,.fp-subbody .rb-design-adv-field{margin:0!important;border:1px solid var(--line);border-radius:12px;padding:9px;background:var(--panel2)}.fp-subbody .field label,.fp-subbody .rb-design-adv-field label{font-size:9px!important;color:var(--muted)!important}.fp-subbody input[type=range]{width:100%}.fp-subbody input[type=color]{width:100%;height:42px;border-radius:10px}.fp-subbody .rb-design-v3-val,.fp-subbody .range-val,.fp-subbody .rb-design-adv-value{font-size:9px;color:var(--gold)}
      .fp-actions{display:flex;gap:8px;flex-wrap:wrap}.fp-actions .btn,.fp-actions button{flex:1;min-width:130px}.fp-note{padding:10px 12px;border:1px solid color-mix(in srgb,var(--gold) 22%,var(--line));border-radius:13px;background:color-mix(in srgb,var(--gold) 6%,var(--panel));color:var(--muted);font-size:10px;line-height:1.65}
      .fp-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fp-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--panel)}.fp-tool strong{display:block;font-size:11px}.fp-tool small{display:block;color:var(--muted);font-size:9px;line-height:1.45;margin-top:2px}
      .fp-account-email{direction:ltr;text-align:left;padding:11px;border:1px solid var(--line);border-radius:12px;background:var(--panel);font-size:12px;color:var(--muted);overflow-wrap:anywhere}
      .fp-hidden-source{display:none!important}
      #view-settings.fp-view .rb-backup-box{margin:0!important;border:0!important;background:transparent!important;padding:0!important}
      #view-settings.fp-view .rb-backup-box>h4,#view-settings.fp-view .rb-backup-box>p{display:none!important}
      #view-settings.fp-view .rb-backup-grid{gap:8px!important}
      #view-settings.fp-view .rbv2-field,#view-settings.fp-view .rbv2-switch,#view-settings.fp-view .switchline{margin:0!important}
      #view-settings.fp-view .rbv2-field label{display:none!important}
      #view-settings.fp-view #rbv2Operations{display:none!important}
      #view-settings.fp-view #saveSettingsBtn{display:none!important}
      #view-settings.fp-view .rb-vis-modal,#view-settings.fp-view .rb-actions-modal{position:fixed}
      #view-design.fp-design-moved{display:none!important}
      .fp-bulk-host .notice{margin:0 0 9px!important}.fp-bulk-host .savebar{margin-top:9px!important}.fp-bulk-host .grid2{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      @media(max-width:700px){
        #view-settings.fp-view>.panel{padding-inline:0!important}.fp-savebar{grid-template-columns:1fr}.fp-save-btn{width:100%}.fp-save-copy span{display:none}
        .fp-grid,.fp-grid.three,.fp-toggle-grid,.fp-tools-grid,.fp-subbody,.fp-bulk-host .grid2{grid-template-columns:1fr!important}.fp-lang-grid{grid-template-columns:repeat(3,1fr)}
        .fp-accordion>summary{grid-template-columns:40px minmax(0,1fr) auto;padding:10px}.fp-social-row{grid-template-columns:72px minmax(0,1fr)}
        .fp-actions{display:grid;grid-template-columns:1fr}.fp-actions .btn,.fp-actions button{width:100%;min-width:0}.fp-tool{grid-template-columns:1fr}.fp-tool .btn{width:100%}
        .fp-wrap input,.fp-wrap textarea,.fp-wrap select{font-size:16px!important}
      }
    `;
    document.head.appendChild(s);
  }

  function accordion(icon,title,subtitle,open=false){
    const d=document.createElement('details');
    d.className='fp-accordion';d.open=open;
    d.innerHTML=`<summary><span class="fp-icon">${icon}</span><span class="fp-title"><strong>${title}</strong><small>${subtitle}</small></span><span class="fp-chevron">⌄</span></summary><div class="fp-body"></div>`;
    return {details:d,body:q('.fp-body',d)};
  }

  function card(title,subtitle=''){
    const c=document.createElement('div');c.className='fp-card';
    c.innerHTML=`<div class="fp-card-head"><div><strong>${title}</strong>${subtitle?`<small>${subtitle}</small>`:''}</div></div>`;
    return c;
  }

  function take(id){return $(id)||null;}

  function triCard(title,subtitle,items){
    const c=card(title,subtitle);const tri=document.createElement('div');tri.className='fp-tri';
    const tabs=document.createElement('div');tabs.className='fp-tabs';const panes=document.createElement('div');
    items.forEach((item,index)=>{
      const input=take(item.id);if(!input)return;
      const b=document.createElement('button');b.type='button';b.textContent=item.label;b.className=index===0?'active':'';
      const p=document.createElement('div');p.className='fp-pane'+(index===0?' active':'');p.dataset.fpPane=String(index);p.appendChild(input);
      b.addEventListener('click',()=>{qa('button',tabs).forEach(x=>x.classList.remove('active'));qa('.fp-pane',panes).forEach(x=>x.classList.remove('active'));b.classList.add('active');p.classList.add('active');});
      tabs.appendChild(b);panes.appendChild(p);
    });
    tri.append(tabs,panes);c.appendChild(tri);return c;
  }

  function simpleField(id,label,help=''){
    const input=take(id);if(!input)return null;const wrap=document.createElement('label');wrap.className='fp-field';wrap.innerHTML=`<span>${label}${help?` — ${help}`:''}</span>`;wrap.appendChild(input);return wrap;
  }

  function toggleCard(input,title,subtitle=''){
    if(!input)return null;
    const row=document.createElement('div');row.className='fp-toggle';
    const copy=document.createElement('div');copy.className='fp-toggle-copy';copy.innerHTML=`<strong>${title}</strong>${subtitle?`<small>${subtitle}</small>`:''}`;
    const sw=document.createElement('label');sw.className='fp-switch';sw.appendChild(input);sw.appendChild(document.createElement('i'));
    row.append(copy,sw);return row;
  }

  function toggleById(id,title,subtitle=''){return toggleCard(take(id),title,subtitle);}
  function visInput(key){return q(`[data-vis-key="${key}"]`);}
  function visToggle(key,title,subtitle=''){return toggleCard(visInput(key),title,subtitle);}

  function appendIf(parent,node){if(node)parent.appendChild(node);return node;}

  function langCard(){
    const c=card('لغات المنيو','اختر لغة واحدة أو لغتين أو اللغات الثلاث.');const g=document.createElement('div');g.className='fp-lang-grid';
    [['langAr','العربية'],['langKu','کوردی'],['langEn','English']].forEach(([id,label])=>{const input=take(id);if(!input)return;const x=document.createElement('label');x.className='fp-lang';const span=document.createElement('span');span.textContent=label;x.append(span,input);g.appendChild(x);});c.appendChild(g);return c;
  }

  function socialRow(id,name){
    const input=take(id);if(!input)return null;const r=document.createElement('label');r.className='fp-social-row';const s=document.createElement('strong');s.textContent=name;r.append(s,input);return r;
  }

  function subdetails(title,ids,open=false){
    const d=document.createElement('details');d.className='fp-subdetails';d.open=open;d.innerHTML=`<summary>${title}</summary><div class="fp-subbody"></div>`;const body=q('.fp-subbody',d);
    ids.forEach(id=>{const el=take(id);if(!el)return;const wrap=el.closest('.field,.rb-design-adv-field')||el.parentElement;if(wrap&&!body.contains(wrap))body.appendChild(wrap);});
    if(!body.children.length)return null;return d;
  }

  function toolRow(title,subtitle,label,onClick,primary=false){
    const x=document.createElement('div');x.className='fp-tool';x.innerHTML=`<div><strong>${title}</strong><small>${subtitle}</small></div><button class="btn${primary?' primary':''}" type="button">${label}</button>`;q('button',x).onclick=onClick;return x;
  }

  async function tenantId(){
    if(state.tenantId)return state.tenantId;
    const sb=window.RESTBR_OWNER_V2_CLIENT;if(!sb)throw new Error('RESTBR client unavailable');
    const host=location.hostname.toLowerCase().replace(/^www\./,'');let res;
    if(host==='hamodybr.github.io'||host==='admin.restbr.com'){
      const slug=String(new URLSearchParams(location.search).get('tenant')||'').trim().toLowerCase();
      res=await sb.from('restaurants').select('id').eq('slug',slug).maybeSingle();
      if(res.error)throw res.error;if(!res.data?.id)throw new Error('restaurant not found');return state.tenantId=res.data.id;
    }
    res=await sb.from('restaurant_domains').select('restaurant_id').eq('hostname',host).eq('status','active').eq('is_verified',true).maybeSingle();
    if(res.error)throw res.error;if(!res.data?.restaurant_id)throw new Error('restaurant domain not found');return state.tenantId=res.data.restaurant_id;
  }

  async function primeVisibility(){
    if(state.visibilityPrimed)return;const b=$('rbVisibilityOpen');if(!b)return;
    b.click();state.visibilityPrimed=true;
    await waitFor(()=>$('rbVisibilityModal'),1800);
    await waitFor(()=>{const m=$('rbVisibilityMsg');return m&&!/جاري/.test(String(m.textContent||''));},3000,100);
    const modal=$('rbVisibilityModal');if(modal)modal.hidden=true;document.body.style.overflow='';
  }

  async function primeBulk(){
    if(state.bulkPrimed)return $('rbBulkApply');const b=$('rbv2BulkPriceBtn');if(!b)return null;
    b.click();const apply=await waitFor(()=>$('rbBulkApply'),5000,100);state.bulkPrimed=Boolean(apply);
    const back=$('modalBack');if(back)back.classList.add('hidden');document.body.style.overflow='';return apply;
  }

  async function saveVisibilityFresh(){
    const sb=window.RESTBR_OWNER_V2_CLIENT;if(!sb)return;
    const rid=await tenantId();const {data,error}=await sb.from('restaurant_settings').select('features').eq('restaurant_id',rid).maybeSingle();if(error)throw error;
    const features=(data?.features&&typeof data.features==='object'&&!Array.isArray(data.features))?{...data.features}:{};
    qa('[data-vis-key]').forEach(input=>{features[input.dataset.visKey]=Boolean(input.checked);});
    const res=await sb.from('restaurant_settings').update({features,updated_at:new Date().toISOString()}).eq('restaurant_id',rid);if(res.error)throw res.error;
  }

  function makeSaveProxy(savebar,coreSave,settingsMsg){
    savebar.className='fp-savebar';savebar.innerHTML='';
    const copy=document.createElement('div');copy.className='fp-save-copy';copy.innerHTML='<strong>إعدادات المطعم</strong><span>التغييرات لا تثبت إلا بعد الضغط على حفظ.</span>';
    const btn=document.createElement('button');btn.id='fpSaveAllBtn';btn.className='btn primary fp-save-btn';btn.type='button';btn.textContent='حفظ التغييرات';
    btn.onclick=async()=>{
      if(btn.disabled)return;btn.disabled=true;const old=btn.textContent;btn.textContent='جاري الحفظ...';
      if(settingsMsg){settingsMsg.textContent='جاري حفظ إعدادات المطعم...';settingsMsg.className='fp-main-msg';}
      try{
        coreSave.click();
        await sleep(850);
        await saveVisibilityFresh();
        const designSave=$('saveDesignBtn');if(designSave&&!designSave.disabled)designSave.click();
        await sleep(450);
        if(settingsMsg){settingsMsg.textContent='تم حفظ الإعدادات وعناصر الواجهة والتصميم ✓';settingsMsg.className='fp-main-msg status ok';}
      }catch(error){
        if(settingsMsg){settingsMsg.textContent=error?.message||String(error);settingsMsg.className='fp-main-msg status err';}
      }finally{btn.disabled=false;btn.textContent=old;}
    };
    savebar.append(copy,btn);
  }

  function buildStatus(body){
    const g=document.createElement('div');g.className='fp-toggle-grid';
    [
      ['rbv2MenuEnabled','عرض المنيو','إخفاء أو إظهار المنيو للزبون.'],
      ['rbv2IsOpen','المطعم مفتوح','إذا أوقفته يظهر تنبيه الإغلاق ويتوقف الطلب.'],
      ['rbv2OrdersEnabled','استقبال الطلبات','إيقاف السلة والإرسال مع بقاء المنيو للتصفح.'],
      ['rbv2DeliveryEnabled','التوصيل','تشغيل أو إيقاف خيار التوصيل.'],
      ['rbv2PickupEnabled','الاستلام من المطعم','تشغيل أو إيقاف الاستلام من المطعم.']
    ].forEach(x=>appendIf(g,toggleById(...x)));
    body.appendChild(g);
    body.appendChild(triCard('رسالة الإغلاق','تظهر فقط عندما يكون الطلب متوقفاً.',[
      {id:'rbv2ClosedAr',label:'عربي'},{id:'rbv2ClosedKu',label:'کوردی'},{id:'rbv2ClosedEn',label:'English'}
    ]));
  }

  function buildIdentity(body){
    body.appendChild(triCard('اسم المطعم / عنوان المنيو','الاسم الرئيسي الظاهر للزبون.',[
      {id:'sNameAr',label:'عربي'},{id:'sNameKu',label:'کوردی'},{id:'sNameEn',label:'English'}
    ]));
    const logo=card('الشعار','يظهر أعلى المنيو وفي شاشة البداية.');const lg=document.createElement('div');lg.className='fp-grid';appendIf(lg,simpleField('sLogoUrl','رابط الشعار'));appendIf(lg,simpleField('logoFile','رفع شعار جديد'));logo.appendChild(lg);appendIf(logo,toggleByIdFromVis('show_logo','إظهار الشعار','يمكن إخفاؤه بدون حذف الرابط.'));body.appendChild(logo);
    body.appendChild(triCard('النص تحت اسم المنيو','يمكن استخدام النص التعريفي لكل لغة.',[
      {id:'sSubAr',label:'عربي'},{id:'sSubKu',label:'کوردی'},{id:'sSubEn',label:'English'}
    ]));
    body.appendChild(langCard());
    const vg=document.createElement('div');vg.className='fp-toggle-grid';
    [['show_menu_title','عنوان المنيو','العنوان الرئيسي أعلى الأصناف.'],['show_subtitle','النص التعريفي','النص أسفل العنوان.'],['show_language_switch','مبدّل اللغة','عربي / کوردی / English.'],['show_category_nav','شريط الأقسام','أزرار الأقسام أعلى الأصناف.'],['show_back_to_top','زر الرجوع للأعلى','يظهر عند النزول بالصفحة.'],['intro_enabled','شاشة البداية','Intro عند أول فتح للمنيو.']].forEach(x=>appendIf(vg,visToggle(...x)));body.appendChild(vg);
  }

  function toggleByIdFromVis(key,title,subtitle){return visToggle(key,title,subtitle);}

  function buildContact(body){
    const g=document.createElement('div');g.className='fp-grid';appendIf(g,simpleField('sPhone','رقم الهاتف'));appendIf(g,simpleField('sWhatsapp','رقم WhatsApp'));appendIf(g,simpleField('rbv2Location','رابط Google Maps'));body.appendChild(g);
    const tg=document.createElement('div');tg.className='fp-toggle-grid';[['top_location_enabled','زر الموقع','زر الموقع الظاهر أعلى المنيو.'],['top_call_enabled','زر الاتصال','زر الاتصال الظاهر أعلى المنيو.'],['top_whatsapp_enabled','زر WhatsApp','زر WhatsApp الظاهر أعلى المنيو.']].forEach(x=>appendIf(tg,visToggle(...x)));body.appendChild(tg);
    body.appendChild(toolRow('أزرار علوية إضافية','Telegram، حجز، موقع ثانٍ، رقم آخر…','إدارة الأزرار',()=>$('rbActionsOpen')?.click(),true));
  }

  function buildSocial(body){
    appendIf(body,socialRow('rbv2Instagram','Instagram'));appendIf(body,socialRow('rbv2Facebook','Facebook'));appendIf(body,socialRow('rbv2TikTok','TikTok'));appendIf(body,socialRow('rbv2Snapchat','Snapchat'));
    body.appendChild(toolRow('منصات إضافية','YouTube، Telegram، X أو أي موقع آخر.','إدارة المنصات',()=>$('rbActionsOpen')?.click()));
  }

  function buildFooter(body){
    const tg=document.createElement('div');tg.className='fp-toggle-grid';[['show_footer','الفوتر بالكامل','إخفاء أو إظهار الجزء السفلي كاملاً.'],['show_footer_brand','اسم المطعم','الاسم داخل الفوتر.'],['show_footer_phone','رقم الهاتف','الرقم النصي في الفوتر.'],['show_footer_copy','حقوق النشر','اسم المطعم والسنة.'],['show_footer_socials','روابط السوشيال','مجموعة Instagram وغيرها.']].forEach(x=>appendIf(tg,visToggle(...x)));body.appendChild(tg);
    body.appendChild(triCard('العنوان الظاهر','مثال: دهوك • كوردستان',[
      {id:'sAddrAr',label:'عربي'},{id:'sAddrKu',label:'کوردی'},{id:'sAddrEn',label:'English'}
    ]));
    const bg=document.createElement('div');bg.className='fp-toggle-grid';[['show_footer_location','إظهار العنوان','العنوان النصي في الفوتر.'],['footer_location_enabled','زر الموقع في الفوتر','Location'],['footer_call_enabled','زر الاتصال في الفوتر','Call'],['footer_whatsapp_enabled','زر WhatsApp في الفوتر','WhatsApp Menu']].forEach(x=>appendIf(bg,visToggle(...x)));body.appendChild(bg);
    body.appendChild(toolRow('أزرار سفلية إضافية','تظهر مع أزرار الفوتر ويمكن ترتيبها.','إدارة أزرار الفوتر',()=>$('rbActionsOpen')?.click()));
  }

  function buildAnnouncement(body){
    appendIf(body,toggleById('sAnnEnabled','إعلان أعلى المنيو','عرض، تنبيه أو رسالة قصيرة.'));
    body.appendChild(triCard('نص الإعلان','النص الذي يظهر أعلى المنيو.',[
      {id:'sAnnAr',label:'عربي'},{id:'sAnnKu',label:'کوردی'},{id:'sAnnEn',label:'English'}
    ]));
    appendIf(body,toggleById('rbv2DeliveryInfoEnabled','معلومات التوصيل','تظهر داخل صفحة إكمال الطلب.'));
    body.appendChild(triCard('نص معلومات التوصيل','معلومات اختيارية للزبون.',[
      {id:'rbv2DeliveryAr',label:'عربي'},{id:'rbv2DeliveryKu',label:'کوردی'},{id:'rbv2DeliveryEn',label:'English'}
    ]));
  }

  function buildBackground(body){
    appendIf(body,visToggle('background_video_enabled','فيديو الخلفية','يمكن إيقافه بدون حذف الملف.'));
    const g=document.createElement('div');g.className='fp-grid one';appendIf(g,simpleField('backgroundFile','رفع فيديو خلفية جديد'));body.appendChild(g);
  }

  function buildDesign(body){
    const groups=[
      ['كارت الصنف — الأبعاد ونسبة الصورة والمعلومات',['dCardHeight','dImagePercent','dOpacity','dBlur','dGlassColor','dRadius','dCardGap','dInfoPadding','dCardShadow','dCardBorder']],
      ['خطوط المنيو — اسم الصنف والخيارات والسعر وعنوان القسم',['dProductNameFont','dOptionFont','dPriceFont','dSectionTitleFont','dTextPrimary','dTextMuted','dFontFamily','dHeadingFontFamily']],
      ['الأزرار والتنقل — زر الإضافة والأقسام والأزرار العلوية',['dAddButtonHeight','dAddButtonFont','dCategoryHeight','dCategoryFont','dTopActionHeight','dTopActionFont','dButtonBorder']],
      ['زر السلة العائم — الحجم والموقع على الشاشة',['dCartWidth','dCartHeight','dCartFont','dCartBottom','dCartHorizontal']],
      ['الهيدر والبحث والفوتر — الشعار والعنوان والبحث والفوتر',['dAccent','dLogoSize','dMenuTitleFont','dSubtitleFont','dSearchHeight','dSearchFont','dFooterTitleFont','dFooterActionFont','dFooterPhoneFont','rbFooterOpacity','rbFooterBlur','rbFooterColor','dBackgroundEffect']]
    ];
    groups.forEach((g,i)=>appendIf(body,subdetails(g[0],g[1],i===0)));
    const actions=document.createElement('div');actions.className='fp-actions';const preview=$('previewDesignBtn');if(preview)actions.appendChild(preview);const match=$('rbFooterMatchCards');if(match)actions.appendChild(match);if(actions.children.length)body.appendChild(actions);
    const msg=$('designMsg');if(msg)body.appendChild(msg);
  }

  async function buildBulk(body){
    const ok=await primeBulk();if(!ok){body.appendChild(Object.assign(document.createElement('div'),{className:'fp-note',textContent:'تعذر تحميل أداة الأسعار الجماعية حالياً.'}));return;}
    const host=document.createElement('div');host.className='fp-bulk-host';
    const modalBody=$('modalBody');while(modalBody?.firstChild)host.appendChild(modalBody.firstChild);body.appendChild(host);const back=$('modalBack');if(back)back.classList.add('hidden');
  }

  function buildBackup(body){const box=$('rbBackupBox');if(box)body.appendChild(box);}

  function buildAccount(body){
    const email=document.createElement('div');email.className='fp-account-email';email.textContent=$('userBadge')?.textContent?.trim()||'—';body.appendChild(email);
    const acts=document.createElement('div');acts.className='fp-actions';const logout=document.createElement('button');logout.className='btn danger';logout.type='button';logout.textContent='تسجيل الخروج';logout.onclick=()=>$('logoutBtn')?.click();acts.appendChild(logout);body.appendChild(acts);
  }

  function buildExtraTools(body,savebar){
    const grid=document.createElement('div');grid.className='fp-tools-grid';
    const skip=new Set(['saveSettingsBtn','rbVisibilityOpen','rbActionsOpen']);
    qa('button',savebar).forEach(button=>{if(skip.has(button.id))return;const x=document.createElement('div');x.className='fp-tool';const copy=document.createElement('div');copy.innerHTML=`<strong>${button.textContent.trim()||button.id}</strong><small>أداة إضافية خاصة بهذا المطعم.</small>`;x.append(copy,button);grid.appendChild(x);});
    if(grid.children.length)body.appendChild(grid);else body.appendChild(Object.assign(document.createElement('div'),{className:'fp-note',textContent:'لا توجد أدوات إضافية حالياً.'}));
  }

  async function mount(){
    if(state.mounted||state.mounting)return state.mounted;state.mounting=true;
    try{
      const ready=await waitFor(()=>$('view-settings')&&$('saveSettingsBtn')&&$('rbv2Operations')&&$('rbBackupBox')&&$('rbVisibilityOpen')&&$('rbv2BulkPriceBtn')&&$('rbDesignControlsV3'),9000,120);
      if(!ready)return false;
      await primeVisibility();
      addStyles();
      const view=$('view-settings');const root=q(':scope>.panel',view);if(!root)return false;view.classList.add('fp-view');
      const head=q(':scope>.panel-head',root);if(head)head.innerHTML='<h3>الإعدادات</h3><small>كل إعداد بمكانه — افتح فقط القسم اللي تحتاجه</small>';
      const coreSave=$('saveSettingsBtn');const settingsMsg=$('settingsMsg');const savebar=coreSave.closest('.savebar');
      const legacy=document.createElement('div');legacy.id='fpLegacySource';legacy.className='fp-hidden-source';
      const wrap=document.createElement('div');wrap.id='restbrSettingsFullParity';wrap.className='fp-wrap';
      const keep=new Set([head,savebar,settingsMsg,wrap,legacy]);
      [...root.children].forEach(node=>{if(!keep.has(node)&&node!==head&&node!==savebar&&node!==settingsMsg)legacy.appendChild(node);});
      root.appendChild(legacy);
      if(head)head.after(savebar);if(settingsMsg)savebar.after(settingsMsg);if(settingsMsg)settingsMsg.after(wrap);else savebar.after(wrap);
      if(settingsMsg)settingsMsg.className='fp-main-msg';
      makeSaveProxy(savebar,coreSave,settingsMsg);

      const status=accordion('🟢','الحالة والطلبات','فتح المطعم، الطلبات، التوصيل والاستلام',true);wrap.appendChild(status.details);buildStatus(status.body);
      const identity=accordion('🎨','الهوية وواجهة المنيو','الاسم، الشعار، العنوان، اللغة وعناصر الواجهة');wrap.appendChild(identity.details);buildIdentity(identity.body);
      const contact=accordion('📞','التواصل وأزرار أعلى المنيو','الهاتف، WhatsApp، الموقع وأزرار الواجهة');wrap.appendChild(contact.details);buildContact(contact.body);
      const social=accordion('📱','السوشيال ميديا','الرابط + إظهار أو إخفاء كل منصة');wrap.appendChild(social.details);buildSocial(social.body);
      const footer=accordion('▰','الفوتر أسفل المنيو','الاسم، العنوان، الهاتف، الأزرار وحقوق النشر');wrap.appendChild(footer.details);buildFooter(footer.body);
      const announcement=accordion('📣','الإعلان ومعلومات التوصيل','نصوص اختيارية تظهر للزبون');wrap.appendChild(announcement.details);buildAnnouncement(announcement.body);
      const background=accordion('🎬','الخلفية والمظهر','فيديو الخلفية وعناصر العرض');wrap.appendChild(background.details);buildBackground(background.body);
      const design=accordion('📐','أحجام وتخطيط المنيو','تحكم بالكروت، الشفافية، الصورة، الخطوط، الأزرار، السلة والهيدر');wrap.appendChild(design.details);buildDesign(design.body);
      const bulk=accordion('💰','تعديل الأسعار دفعة واحدة','كل المنيو أو قسم معيّن');wrap.appendChild(bulk.details);await buildBulk(bulk.body);
      const backup=accordion('💾','النسخ الاحتياطي والاسترجاع','Backup كامل أو جزئي واستعادة آمنة لنفس المطعم');wrap.appendChild(backup.details);buildBackup(backup.body);
      const account=accordion('🔐','حساب الإدارة','الحساب الحالي وتسجيل الخروج');wrap.appendChild(account.details);buildAccount(account.body);
      const tools=accordion('🧰','أدوات إضافية','QR، تدقيق وأدوات الإدارة الأخرى');wrap.appendChild(tools.details);buildExtraTools(tools.body,savebar);

      const designView=$('view-design');if(designView)designView.classList.add('fp-design-moved');
      const designNav=q('[data-view="design"]');if(designNav)designNav.hidden=true;
      const coreDesignSave=$('saveDesignBtn');if(coreDesignSave)coreDesignSave.closest('.savebar')?.classList.add('fp-hidden-source');
      const footerOwnSave=$('rbFooterDesignSave');if(footerOwnSave)footerOwnSave.hidden=true;
      const visibilityButton=$('rbVisibilityOpen');if(visibilityButton)visibilityButton.hidden=true;
      const actionsButton=$('rbActionsOpen');if(actionsButton)actionsButton.hidden=true;

      state.mounted=true;console.log('✅ RESTBR Full Settings Parity V2.0 mounted');return true;
    }catch(error){console.error('RESTBR Full Settings Parity V2 mount:',error);return false;}
    finally{state.mounting=false;}
  }

  function boot(){let tries=0;const timer=setInterval(async()=>{if(await mount()||++tries>=100)clearInterval(timer);},120);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
