// RESTBR Manager — Settings UI Parity V1
// Reorganizes the existing tenant-safe controls into the modern Shorash-style
// accordion layout. It does NOT clone IDs and does NOT change persistence/RLS.
(() => {
  'use strict';
  if (window.__RESTBR_SETTINGS_PARITY_V1__) return;
  window.__RESTBR_SETTINGS_PARITY_V1__ = true;

  const $ = id => document.getElementById(id);
  const q = (selector, root = document) => root.querySelector(selector);

  function addStyles() {
    if ($('restbrSettingsParityStyles')) return;
    const style = document.createElement('style');
    style.id = 'restbrSettingsParityStyles';
    style.textContent = `
      #view-settings.settings-parity-view > .panel{padding:10px;background:transparent;border:0;box-shadow:none}
      #view-settings.settings-parity-view > .panel > .panel-head{padding:5px 2px 9px;border:0;margin:0}
      #view-settings.settings-parity-view > .panel > .panel-head h3{font-size:22px}
      #view-settings.settings-parity-view > .panel > .panel-head small{font-size:11px}
      .restbr-settings-parity{display:grid;gap:10px;width:100%;min-width:0}
      .restbr-settings-parity *{box-sizing:border-box;min-width:0}
      .restbr-settings-parity .settings-accordion{width:100%;overflow:hidden;border:1px solid color-mix(in srgb,var(--gold) 18%,var(--line));border-radius:16px;background:linear-gradient(145deg,color-mix(in srgb,var(--gold) 4%,var(--panel)),var(--panel));box-shadow:0 6px 22px color-mix(in srgb,var(--text) 5%,transparent)}
      .restbr-settings-parity .settings-accordion[open]{border-color:color-mix(in srgb,var(--gold) 34%,var(--line))}
      .restbr-settings-parity .settings-accordion > summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:9px;padding:11px 12px;user-select:none;-webkit-user-select:none}
      .restbr-settings-parity .settings-accordion > summary::-webkit-details-marker{display:none}
      .restbr-settings-parity .settings-accordion-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--gold) 8%,var(--panel2));border:1px solid color-mix(in srgb,var(--gold) 17%,var(--line));font-size:18px}
      .restbr-settings-parity .settings-accordion-title strong{display:block;color:var(--text);font-size:14px;margin-bottom:3px}
      .restbr-settings-parity .settings-accordion-title small{display:block;color:var(--muted);font-size:10px;line-height:1.5}
      .restbr-settings-parity .settings-chevron{color:var(--muted);font-size:18px;transition:transform .18s,color .18s}
      .restbr-settings-parity .settings-accordion[open] .settings-chevron{transform:rotate(180deg);color:var(--gold)}
      .restbr-settings-parity .settings-accordion-body{display:grid;gap:10px;padding:11px;border-top:1px solid var(--line);overflow:hidden}
      .settings-parity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .settings-parity-grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
      .settings-parity-grid > .field,.settings-parity-grid > .rbv2-field{margin:0}
      .restbr-settings-parity .field,.restbr-settings-parity .rbv2-field{display:flex;flex-direction:column;gap:6px}
      .restbr-settings-parity .field label,.restbr-settings-parity .rbv2-field label{color:var(--muted);font-size:11px}
      .restbr-settings-parity .rbv2-field input,.restbr-settings-parity .rbv2-field textarea{width:100%;border:1px solid var(--line);background:var(--input);color:var(--text);border-radius:13px;padding:12px 13px;outline:none;font-size:16px}
      .restbr-settings-parity .rbv2-field textarea{min-height:82px;resize:vertical}
      .settings-parity-toggle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .restbr-settings-parity .rbv2-switch,.settings-parity-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border:1px solid var(--line);border-radius:13px;background:var(--panel2);font-size:12px;font-weight:750}
      .restbr-settings-parity .rbv2-switch input,.settings-parity-toggle input{width:20px;height:20px;accent-color:var(--gold);flex:0 0 auto}
      .restbr-settings-parity .panel{margin:0;padding:11px;border-radius:14px;box-shadow:none;background:var(--panel2)}
      .restbr-settings-parity .panel .panel-head{padding:0 0 9px;margin:0 0 8px;border-bottom:1px solid var(--line)}
      .restbr-settings-parity .panel .panel-head h3{font-size:13px}
      .restbr-settings-parity .rbv2-box{margin:0;padding:0;border:0;background:transparent}
      .restbr-settings-parity .rbv2-title{display:none!important}
      .restbr-settings-parity .rbv2-grid{display:grid;grid-template-columns:1fr;gap:8px}
      .restbr-settings-parity .rbv2-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
      .settings-parity-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:12px;border:1px solid var(--line);border-radius:14px;background:var(--panel2)}
      .settings-parity-tool strong{display:block;font-size:13px;margin-bottom:3px}
      .settings-parity-tool small{display:block;color:var(--muted);font-size:10px;line-height:1.55}
      .settings-parity-tool .btn{white-space:nowrap}
      .restbr-settings-parity .rb-backup-box{margin:0!important;border:0!important;background:transparent!important;padding:0!important}
      .restbr-settings-parity .rb-backup-box > h4,.restbr-settings-parity .rb-backup-box > p{display:none}
      .settings-parity-account{display:grid;gap:9px}
      .settings-parity-account-email{padding:11px 13px;border:1px solid var(--line);border-radius:13px;background:var(--panel2);direction:ltr;text-align:left;color:var(--muted);font-size:12px;overflow-wrap:anywhere}
      #view-settings.settings-parity-view .savebar.settings-save-bar{position:sticky;top:8px;z-index:20;display:flex;align-items:center;gap:8px;margin:0 0 10px;padding:9px;border:1px solid color-mix(in srgb,var(--gold) 22%,var(--line));border-radius:15px;background:color-mix(in srgb,var(--panel) 92%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 9px 28px color-mix(in srgb,var(--text) 7%,transparent)}
      #view-settings.settings-parity-view .savebar.settings-save-bar:before{content:'إعدادات المطعم';font-size:12px;font-weight:900;margin-inline-end:auto}
      #view-settings.settings-parity-view #settingsMsg{margin:0 3px 10px;min-height:0}
      #view-settings.settings-parity-view #saveSettingsBtn{min-height:42px}
      .settings-parity-legacy-empty{display:none!important}
      @media(max-width:700px){
        #view-settings.settings-parity-view > .panel{padding:7px 0}
        .settings-parity-grid,.settings-parity-grid.three,.settings-parity-toggle-grid,.restbr-settings-parity .rbv2-grid.two{grid-template-columns:1fr}
        .settings-parity-tool{grid-template-columns:1fr}
        .settings-parity-tool .btn{width:100%}
        .restbr-settings-parity .settings-accordion > summary{grid-template-columns:40px minmax(0,1fr) auto;padding:10px}
        #view-settings.settings-parity-view .savebar.settings-save-bar:before{display:none}
        #view-settings.settings-parity-view .savebar.settings-save-bar #saveSettingsBtn{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function accordion(icon, title, subtitle, open = false) {
    const details = document.createElement('details');
    details.className = 'settings-accordion';
    details.open = open;
    details.innerHTML = `
      <summary>
        <span class="settings-accordion-icon">${icon}</span>
        <span class="settings-accordion-title"><strong>${title}</strong><small>${subtitle}</small></span>
        <span class="settings-chevron">⌄</span>
      </summary>
      <div class="settings-accordion-body"></div>`;
    return { details, body: details.querySelector('.settings-accordion-body') };
  }

  function closestControl(id) {
    const el = $(id);
    if (!el) return null;
    return el.closest('.field,.rbv2-field,.rbv2-switch,.switchline,.panel') || el;
  }

  function moveUnique(ids, target, className = 'settings-parity-grid') {
    const nodes = [];
    for (const id of ids) {
      const node = closestControl(id);
      if (node && !nodes.includes(node)) nodes.push(node);
    }
    if (!nodes.length) return null;
    const wrap = document.createElement('div');
    wrap.className = className;
    nodes.forEach(node => wrap.appendChild(node));
    target.appendChild(wrap);
    return wrap;
  }

  function toolCard(target, title, subtitle, label, clicker, primary = false) {
    const card = document.createElement('div');
    card.className = 'settings-parity-tool';
    card.innerHTML = `<div><strong>${title}</strong><small>${subtitle}</small></div><button class="btn${primary ? ' primary' : ''}" type="button">${label}</button>`;
    card.querySelector('button').addEventListener('click', clicker);
    target.appendChild(card);
    return card;
  }

  function cleanupEmpty(node) {
    if (!node || !node.isConnected) return;
    const meaningful = node.querySelector('input,textarea,select,button,[id],.field,.rbv2-field,.rbv2-switch,.switchline');
    if (!meaningful) node.remove();
  }

  function mount() {
    const view = $('view-settings');
    const savebar = $('saveSettingsBtn')?.closest('.savebar');
    const operations = $('rbv2Operations');
    const backup = $('rbBackupBox');
    const actionsButton = $('rbActionsOpen');
    if (!view || !savebar || !operations || !backup || !actionsButton) return false;
    if ($('restbrSettingsParity')) return true;

    const root = q(':scope > .panel', view);
    if (!root) return false;
    addStyles();
    view.classList.add('settings-parity-view');

    const head = q(':scope > .panel-head', root);
    if (head) head.innerHTML = '<h3>الإعدادات</h3><small>كل إعداد بمكانه — افتح فقط القسم اللي تحتاجه</small>';

    const originalBaseGrid = q(':scope > .grid3', root);
    const originalUploadGrid = q(':scope > .grid2', root);
    const originalLanguagePanel = $('langAr')?.closest('.panel');
    const originalAnnouncementPanel = $('sAnnEnabled')?.closest('.panel');
    const settingsMsg = $('settingsMsg');

    savebar.classList.add('settings-save-bar');
    $('saveSettingsBtn').textContent = 'حفظ التغييرات';
    if (head) head.after(savebar);
    if (settingsMsg) savebar.after(settingsMsg);

    const wrap = document.createElement('div');
    wrap.id = 'restbrSettingsParity';
    wrap.className = 'restbr-settings-parity settings-clean-wrap';
    if (settingsMsg) settingsMsg.after(wrap); else savebar.after(wrap);

    // 1. Status / ordering.
    const status = accordion('🟢', 'الحالة والطلبات', 'فتح المطعم، الطلبات، التوصيل والاستلام', true);
    wrap.appendChild(status.details);
    const operationBox = operations.querySelector('.rbv2-box');
    if (operationBox) {
      const operationGrid = operationBox.querySelector('.rbv2-grid');
      if (operationGrid) {
        const deliveryInfoSwitch = $('rbv2DeliveryInfoEnabled')?.closest('.rbv2-switch');
        if (deliveryInfoSwitch) deliveryInfoSwitch.dataset.parityMove = 'delivery';
        status.body.appendChild(operationGrid);
      }
    }
    const closedBox = operations.querySelectorAll('.rbv2-box')[1];
    if (closedBox) status.body.appendChild(closedBox);

    // 2. Identity.
    const identity = accordion('🎨', 'الهوية وواجهة المنيو', 'الاسم، العنوان التعريفي، اللغة والشعار', false);
    wrap.appendChild(identity.details);
    moveUnique(['sNameAr','sNameKu','sNameEn','sSubAr','sSubKu','sSubEn','sLogoUrl','logoFile'], identity.body);
    if (originalLanguagePanel) identity.body.appendChild(originalLanguagePanel);

    // 3. Contact / top actions.
    const contact = accordion('📞', 'التواصل وأزرار أعلى المنيو', 'الهاتف، WhatsApp، الموقع والعنوان والأزرار المخصصة', false);
    wrap.appendChild(contact.details);
    moveUnique(['sPhone','sWhatsapp','sAddrAr','sAddrKu','sAddrEn','rbv2Location'], contact.body);
    toolCard(contact.body, 'الأزرار والروابط المخصصة', 'أزرار أعلى المنيو، أزرار الفوتر وروابط إضافية.', 'فتح الإدارة', () => $('rbActionsOpen')?.click());

    // 4. Social media.
    const socials = accordion('📱', 'السوشيال ميديا', 'Instagram و Facebook و TikTok و Snapchat', false);
    wrap.appendChild(socials.details);
    moveUnique(['rbv2Instagram','rbv2Facebook','rbv2TikTok','rbv2Snapchat'], socials.body);

    // 5. Announcement + delivery info.
    const announcement = accordion('📣', 'الإعلان ومعلومات التوصيل', 'نصوص اختيارية تظهر للزبون', false);
    wrap.appendChild(announcement.details);
    if (originalAnnouncementPanel) announcement.body.appendChild(originalAnnouncementPanel);
    const deliverySwitch = q('[data-parity-move="delivery"]', status.body);
    if (deliverySwitch) announcement.body.appendChild(deliverySwitch);
    moveUnique(['rbv2DeliveryAr','rbv2DeliveryKu','rbv2DeliveryEn'], announcement.body);

    // 6. Background / appearance.
    const background = accordion('🎬', 'الخلفية والمظهر', 'فيديو الخلفية وعناصر العرض', false);
    wrap.appendChild(background.details);
    moveUnique(['backgroundFile'], background.body);
    toolCard(background.body, 'التصميم والشفافية', 'ألوان، زجاج، أحجام الكروت، الخطوط وباقي تصميم المنيو.', 'فتح التصميم', () => q('[data-view="design"]')?.click(), true);

    // 7. Bulk pricing.
    const bulk = accordion('💰', 'تعديل الأسعار دفعة واحدة', 'كل المنيو أو قسم معيّن', false);
    wrap.appendChild(bulk.details);
    toolCard(bulk.body, 'الأسعار الجماعية', 'تغيير السعر الأساسي وأسعار الخيارات مع معاينة قبل التنفيذ.', 'فتح أداة الأسعار', () => $('rbv2BulkPriceBtn')?.click(), true);

    // 8. Backup / restore.
    const backups = accordion('💾', 'النسخ الاحتياطي والاسترجاع', 'Backup كامل أو جزئي واستعادة آمنة لنفس المطعم', false);
    wrap.appendChild(backups.details);
    backups.body.appendChild(backup);

    // 9. Account.
    const account = accordion('🔐', 'حساب الإدارة', 'الحساب الحالي وتسجيل الخروج', false);
    wrap.appendChild(account.details);
    const accountBox = document.createElement('div');
    accountBox.className = 'settings-parity-account';
    accountBox.innerHTML = `<div class="settings-parity-account-email">${$('userBadge')?.textContent?.trim() || '—'}</div><button class="btn" type="button">تسجيل الخروج</button>`;
    accountBox.querySelector('button').addEventListener('click', () => $('logoutBtn')?.click());
    account.body.appendChild(accountBox);

    // The original actions button remains the functional trigger, but is hidden from the sticky save bar.
    actionsButton.hidden = true;

    // Remove now-empty legacy containers. No field/input is deleted.
    cleanupEmpty(originalBaseGrid);
    cleanupEmpty(originalUploadGrid);
    cleanupEmpty(operations);
    root.querySelectorAll(':scope > .panel').forEach(panel => cleanupEmpty(panel));

    console.log('✅ RESTBR Settings UI Parity V1 mounted');
    return true;
  }

  function boot() {
    let tries = 0;
    const timer = setInterval(() => {
      if (mount() || ++tries >= 100) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
