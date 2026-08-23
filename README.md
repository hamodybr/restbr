# RESTBR Simple V1

قالب منيو مطاعم بسيط وسريع بدون قاعدة بيانات أو تسجيل دخول.

## الفكرة
كل مطعم يحصل على نسخة مستقلة من هذا القالب.

تحتاج لتعديل ملفين فقط غالبًا:

- `data/restaurant.json` — اسم المطعم، الهاتف، واتساب، اللغات، التصميم، الخلفية.
- `data/menu.json` — الأقسام، الأصناف، الأسعار، الخيارات والصور.

ضع الصور داخل:

- `assets/logo.png`
- `assets/background.jpg` أو فيديو حسب الإعداد
- `assets/products/`

## المميزات

- عربي / كوردي / English
- تصميم موحد على iPhone وTablet وDesktop
- أقسام وأصناف وخيارات أسعار
- بحث
- سلة مستقلة للمطعم
- طلب WhatsApp
- مشاركة الصنف
- QR Code
- صورة أو فيديو خلفية
- تخصيص الألوان والشفافية من `restaurant.json`

## تشغيل GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root.

بعدها يصبح الرابط مثل:

`https://USERNAME.github.io/REPOSITORY/`

ويمكن ربط دومين أو subdomain لاحقًا.

## سياسة الصور المقترحة

- صورة الصنف: يفضّل WebP بحجم 200–500KB، وحد أقصى 2MB.
- الشعار: يفضّل أقل من 500KB، وحد أقصى 1MB.
- فيديو الخلفية: يفضّل أقل من 8MB، وحد أقصى 12MB ومدة قصيرة.

هذا القالب لا يحتوي Supabase أو Auth أو Super Admin أو Multi-Tenant routing.