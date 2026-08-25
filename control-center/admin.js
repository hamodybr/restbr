(() => {
  'use strict';

  const $ = s => document.querySelector(s);
  const state = { client:null, user:null, restaurants:[], domains:[], loading:false };
  const els = {
    loginView:$('#loginView'),appView:$('#appView'),loginForm:$('#loginForm'),loginEmail:$('#loginEmail'),loginPassword:$('#loginPassword'),loginBtn:$('#loginBtn'),loginMsg:$('#loginMsg'),logoutBtn:$('#logoutBtn'),refreshBtn:$('#refreshBtn'),themeBtn:$('#themeBtn'),statTotal:$('#statTotal'),statActive:$('#statActive'),statSuspended:$('#statSuspended'),lastUpdated:$('#lastUpdated'),searchInput:$('#searchInput'),restaurantList:$('#restaurantList'),emptyState:$('#emptyState'),addRestaurantBtn:$('#addRestaurantBtn'),modalBackdrop:$('#modalBackdrop'),restaurantModal:$('#restaurantModal'),closeModalBtn:$('#closeModalBtn'),cancelModalBtn:$('#cancelModalBtn'),restaurantForm:$('#restaurantForm'),restaurantName:$('#restaurantName'),restaurantSlug:$('#restaurantSlug'),restaurantPlan:$('#restaurantPlan'),restaurantPhone:$('#restaurantPhone'),restaurantWhatsapp:$('#restaurantWhatsapp'),restaurantLanguage:$('#restaurantLanguage'),restaurantCurrency:$('#restaurantCurrency'),slugPreview:$('#slugPreview'),urlPreview:$('#urlPreview'),createMsg:$('#createMsg'),toast:$('#toast')
  };

  function esc(value){ return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function setMessage(el,text='',kind=''){ if(!el)return; el.textContent=text; el.className=`message${kind?` ${kind}`:''}`; }
  let toastTimer=null;
  function toast(text){ clearTimeout(toastTimer); if(!els.toast)return; els.toast.textContent=text; els.toast.classList.remove('hidden'); toastTimer=setTimeout(()=>els.toast.classList.add('hidden'),2600); }
  function normalizeSlug(value){ return String(value||'').toLowerCase().trim().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,63); }
  function showLogin(){ els.loginView?.classList.remove('hidden'); els.appView?.classList.add('hidden'); }
  function showApp(){ els.loginView?.classList.add('hidden'); els.appView?.classList.remove('hidden'); }

  async function getPlatformConfig(){
    const response=await fetch('/_restbr/platform-config',{headers:{Accept:'application/json'},cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data?.ok||!data?.supabase_url||!data?.publishable_key) throw new Error(data?.message||'تعذر تحميل إعدادات RESTBR Platform.');
    return data;
  }

  async function isPlatformAdmin(userId){
    const {data,error}=await state.client.from('platform_admins').select('user_id,is_active').eq('user_id',userId).eq('is_active',true).maybeSingle();
    if(error)throw error;
    return Boolean(data?.user_id);
  }

  async function acceptSession(session){
    if(!session?.user){ state.user=null; showLogin(); return false; }
    if(!await isPlatformAdmin(session.user.id)){ await state.client.auth.signOut(); throw new Error('هذا الحساب ليس Super Admin في RESTBR.'); }
    state.user=session.user; showApp(); await loadDashboard(); return true;
  }

  async function boot(){
    try{
      const theme=localStorage.getItem('RESTBR_ADMIN_THEME'); if(theme==='light')document.documentElement.dataset.theme='light';
      const cfg=await getPlatformConfig();
      state.client=window.supabase.createClient(cfg.supabase_url,cfg.publishable_key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data,error}=await state.client.auth.getSession(); if(error)throw error;
      if(data?.session) await acceptSession(data.session); else showLogin();
      state.client.auth.onAuthStateChange(event=>{ if(event==='SIGNED_OUT'){state.user=null;showLogin();} });
    }catch(error){ console.error(error); showLogin(); setMessage(els.loginMsg,error?.message||'تعذر تشغيل لوحة RESTBR.','error'); }
  }

  async function login(event){
    event.preventDefault(); setMessage(els.loginMsg,''); els.loginBtn.disabled=true; els.loginBtn.textContent='جاري الدخول...';
    try{
      const {data,error}=await state.client.auth.signInWithPassword({email:els.loginEmail.value.trim(),password:els.loginPassword.value});
      if(error)throw error; await acceptSession(data.session); els.loginPassword.value='';
    }catch(error){ console.error(error); setMessage(els.loginMsg,error?.message||'فشل تسجيل الدخول.','error'); }
    finally{ els.loginBtn.disabled=false; els.loginBtn.textContent='تسجيل الدخول'; }
  }

  async function loadDashboard(){
    if(!state.client||state.loading)return; state.loading=true; if(els.refreshBtn)els.refreshBtn.disabled=true;
    try{
      const [restaurantsResult,domainsResult]=await Promise.all([
        state.client.from('restaurants').select('id,name,slug,status,default_language,timezone,currency,created_at,updated_at').order('created_at',{ascending:false}),
        state.client.from('restaurant_domains').select('restaurant_id,hostname,status,is_verified,is_primary')
      ]);
      if(restaurantsResult.error)throw restaurantsResult.error; if(domainsResult.error)throw domainsResult.error;
      state.restaurants=restaurantsResult.data||[]; state.domains=domainsResult.data||[]; render();
      if(els.lastUpdated)els.lastUpdated.textContent=`آخر تحديث: ${new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}`;
    }catch(error){ console.error(error); toast(error?.message||'فشل تحميل بيانات المطاعم.'); }
    finally{ state.loading=false; if(els.refreshBtn)els.refreshBtn.disabled=false; }
  }

  function domainFor(id){ return state.domains.find(d=>d.restaurant_id===id&&d.is_primary)||state.domains.find(d=>d.restaurant_id===id)||null; }
  function statusLabel(status){ return ({active:'نشط',suspended:'موقوف',draft:'مسودة',archived:'مؤرشف'})[status]||status; }
  function renderStats(){ els.statTotal.textContent=state.restaurants.length; els.statActive.textContent=state.restaurants.filter(r=>r.status==='active').length; els.statSuspended.textContent=state.restaurants.filter(r=>r.status==='suspended').length; }

  function renderRestaurants(){
    const q=String(els.searchInput?.value||'').trim().toLowerCase();
    const rows=state.restaurants.filter(r=>{ const d=domainFor(r.id); return !q||`${r.name} ${r.slug} ${d?.hostname||''}`.toLowerCase().includes(q); });
    els.emptyState?.classList.toggle('hidden',rows.length>0);
    els.restaurantList.innerHTML=rows.map(r=>{
      const domain=domainFor(r.id); const hostname=domain?.hostname||`${r.slug}.restbr.com`; const url=`https://${hostname}`;
      const manageUrl=`https://admin.restbr.com/manage/?tenant=${encodeURIComponent(r.slug)}&mode=superadmin`;
      const nextStatus=r.status==='active'?'suspended':'active'; const nextLabel=r.status==='active'?'إيقاف':'تفعيل';
      return `<article class="restaurant-card" data-id="${esc(r.id)}"><div class="restaurant-main"><h4>${esc(r.name)}</h4><a href="${esc(url)}" target="_blank" rel="noopener">${esc(hostname)}</a></div><div class="meta"><span>الحالة</span><strong class="status-pill status-${esc(r.status)}">${esc(statusLabel(r.status))}</strong></div><div class="card-actions"><button class="mini-btn manage" data-action="manage" data-url="${esc(manageUrl)}">⚙ إدارة المطعم</button><button class="mini-btn" data-action="open" data-url="${esc(url)}">فتح المنيو</button><button class="mini-btn" data-action="copy" data-url="${esc(url)}">نسخ الرابط</button><button class="mini-btn ${nextStatus==='suspended'?'danger':''}" data-action="status" data-id="${esc(r.id)}" data-status="${nextStatus}">${nextLabel}</button></div></article>`;
    }).join('');
  }

  function render(){ renderStats(); renderRestaurants(); }
  function openModal(){
    els.restaurantForm.reset(); els.restaurantPlan.value='internal'; els.restaurantLanguage.value='ar'; els.restaurantCurrency.value='IQD'; setMessage(els.createMsg,''); updateSlugPreview();
    els.modalBackdrop.classList.remove('hidden'); els.restaurantModal.classList.remove('hidden'); els.restaurantModal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>els.restaurantName.focus(),50);
  }
  function closeModal(){ els.modalBackdrop.classList.add('hidden'); els.restaurantModal.classList.add('hidden'); els.restaurantModal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function updateSlugPreview(){ const slug=normalizeSlug(els.restaurantSlug.value)||'yourcoffee'; els.restaurantSlug.value=normalizeSlug(els.restaurantSlug.value); els.slugPreview.textContent=`${slug}.restbr.com`; els.urlPreview.textContent=`https://${slug}.restbr.com`; }

  async function changeStatus(id,status,button){
    button.disabled=true;
    try{
      const {error}=await state.client.from('restaurants').update({status}).eq('id',id); if(error)throw error;
      toast(status==='active'?'تم تفعيل المطعم ✅':'تم إيقاف المطعم مؤقتًا.'); await loadDashboard();
    }catch(error){ console.error(error); toast(error?.message||'تعذر تغيير الحالة.'); }
    finally{ button.disabled=false; }
  }

  async function handleRestaurantAction(event){
    const button=event.target.closest('[data-action]'); if(!button)return; const action=button.dataset.action;
    if(action==='manage'){ window.open(button.dataset.url,'_self'); return; }
    if(action==='open'){ window.open(button.dataset.url,'_blank','noopener'); return; }
    if(action==='copy'){ try{await navigator.clipboard.writeText(button.dataset.url||'');toast('تم نسخ الرابط.');}catch(_){toast(button.dataset.url||'');} return; }
    if(action==='status'){
      const status=button.dataset.status;
      if(status==='suspended'&&!window.confirm('إيقاف هذا المطعم؟ لن يظهر عبر RESTBR Router إلى أن تعيد تفعيله.'))return;
      if(status==='active'&&!button.closest('.restaurant-card')?.querySelector('.status-draft')&&!window.confirm('إعادة تفعيل هذا المطعم؟'))return;
      await changeStatus(button.dataset.id,status,button);
    }
  }

  els.loginForm?.addEventListener('submit',login);
  els.logoutBtn?.addEventListener('click',async()=>{await state.client?.auth.signOut();});
  els.refreshBtn?.addEventListener('click',loadDashboard);
  els.themeBtn?.addEventListener('click',()=>{ const next=document.documentElement.dataset.theme==='light'?'dark':'light'; document.documentElement.dataset.theme=next; localStorage.setItem('RESTBR_ADMIN_THEME',next); });
  els.searchInput?.addEventListener('input',renderRestaurants);
  els.restaurantSlug?.addEventListener('input',updateSlugPreview);
  els.addRestaurantBtn?.addEventListener('click',openModal);
  els.closeModalBtn?.addEventListener('click',closeModal);
  els.cancelModalBtn?.addEventListener('click',closeModal);
  els.modalBackdrop?.addEventListener('click',closeModal);
  els.restaurantList?.addEventListener('click',handleRestaurantAction);
  // Intentionally no submit handler here. Staged onboarding V1.2 is the only restaurant creation path.
  boot();
})();
