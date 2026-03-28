# Protected Strings & Selectors Index

This file catalogues every Arabic string, CSS class, aria-label, and role-based
selector that is directly asserted in the e2e test suite.

**Rule**: If you intentionally change a value listed here in source code as part
of an authorized UX change in your executor prompt, you must:
1. Update this index to reflect the new value
2. Update the test file that asserts it to match the new value
3. Verify CI passes before merging

**Warning**: If your executor prompt does NOT explicitly authorize changing this
value, do NOT change it in source code. The test is the ground truth - the source
must match the test, not the other way around.

Last updated: 2026-03-28
Total protected strings: 208
Total protected CSS classes: 34

## Section A - Protected Arabic Strings

| النص | نوع الـ Assertion | الملف | السطر |
|------|------------------|-------|-------|
| تأكيد البيع | getByRole(button) | tests/e2e/device-qa.spec.ts | 220 |
| حساب الدفع | getByLabel | tests/e2e/device-qa.spec.ts | 225 |
| تأكيد البيع | getByRole(button) | tests/e2e/device-qa.spec.ts | 226 |
| السلة فارغة | getByText | tests/e2e/device-qa.spec.ts | 227 |
| تأكيد المرتجع | getByRole(button) | tests/e2e/device-qa.spec.ts | 232 |
| كمية الإرجاع | getByLabel | tests/e2e/device-qa.spec.ts | 234 |
| سبب الإرجاع | getByLabel | tests/e2e/device-qa.spec.ts | 235 |
| تأكيد المرتجع | getByRole(button) | tests/e2e/device-qa.spec.ts | 236 |
| الإجمالي: | filter(hasText) | tests/e2e/device-qa.spec.ts | 237 |
| تأكيد التسديد | getByRole(button) | tests/e2e/device-qa.spec.ts | 241 |
| ابحث باسم العميل أو الهاتف | getByPlaceholder | tests/e2e/device-qa.spec.ts | 243 |
| المبلغ | getByLabel | tests/e2e/device-qa.spec.ts | 245 |
| تأكيد التسديد | getByRole(button) | tests/e2e/device-qa.spec.ts | 246 |
| الرصيد المتبقي: | filter(hasText) | tests/e2e/device-qa.spec.ts | 247 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/device-qa.spec.ts | 256 |
| إعادة الفحص | getByRole(button) | tests/e2e/device-qa.spec.ts | 261 |
| إعادة الفحص | getByRole(button) | tests/e2e/device-qa.spec.ts | 293 |
| تأكيد البيع | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 116 |
| تأكيد البيع | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 122 |
| تأكيد البيع | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 130 |
| تأكيد المرتجع | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 135 |
| كمية الإرجاع | getByLabel | tests/e2e/px06-device-gate.spec.ts | 137 |
| سبب الإرجاع | getByLabel | tests/e2e/px06-device-gate.spec.ts | 138 |
| تأكيد المرتجع | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 139 |
| الإجمالي: | filter(hasText) | tests/e2e/px06-device-gate.spec.ts | 140 |
| تأكيد التسديد | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 144 |
| ابحث باسم العميل أو الهاتف | getByPlaceholder | tests/e2e/px06-device-gate.spec.ts | 146 |
| المبلغ | getByLabel | tests/e2e/px06-device-gate.spec.ts | 148 |
| تأكيد التسديد | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 149 |
| الرصيد المتبقي: | filter(hasText) | tests/e2e/px06-device-gate.spec.ts | 150 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 165 |
| إعادة الفحص | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 170 |
| تثبيت Aya Mobile | getByRole(button) | tests/e2e/px06-device-gate.spec.ts | 192 |
| تم تثبيت التطبيق أو تم قبول التثبيت من قبل المستخدم. | getByText | tests/e2e/px06-device-gate.spec.ts | 221 |
| ابحث باسم المنتج أو SKU | getByPlaceholder | tests/e2e/px06-uat.spec.ts | 480 |
| التقارير المتقدمة والتحليلات المقارنة | getByRole(heading) | tests/e2e/px11-reports.spec.ts | 115 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/px11-reports.spec.ts | 116 |
| ملخص الفترة الحالية مقابل فترة المقارنة | getByText | tests/e2e/px11-reports.spec.ts | 117 |
| اتجاه المبيعات وصافي الربح | getByText | tests/e2e/px11-reports.spec.ts | 118 |
| تفكيك البعد الحالي | getByText | tests/e2e/px11-reports.spec.ts | 119 |
| من تاريخ المقارنة | getByLabel | tests/e2e/px11-reports.spec.ts | 121 |
| إلى تاريخ المقارنة | getByLabel | tests/e2e/px11-reports.spec.ts | 122 |
| التجميع | getByLabel | tests/e2e/px11-reports.spec.ts | 123 |
| بعد التحليل | getByLabel | tests/e2e/px11-reports.spec.ts | 124 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/px11-reports.spec.ts | 125 |
| تصدير Excel المتقدم | getByRole(link) | tests/e2e/px11-reports.spec.ts | 128 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/px13-search-alerts.spec.ts | 290 |
| فتح القائمة | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 20 |
| التنقل داخل مساحات التشغيل | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 42 |
| التشغيل اليومي | getByText | tests/e2e/px16-navigation-ia.spec.ts | 44 |
| نقطة البيع (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 45 |
| الفواتير (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 46 |
| الديون (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 47 |
| الإشعارات (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 48 |
| التقارير (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 49 |
| الإعدادات (regex) | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 50 |
| الديون | getByRole(heading) | tests/e2e/px16-navigation-ia.spec.ts | 54 |
| التشغيل اليومي | toContainText | tests/e2e/px16-navigation-ia.spec.ts | 55 |
| مسار الصفحة | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 55 |
| العملاء والقيود | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 56 |
| التسديد | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 57 |
| ملخص العميل | getByText | tests/e2e/px16-navigation-ia.spec.ts | 58 |
| الإشعارات | getByRole(heading) | tests/e2e/px16-navigation-ia.spec.ts | 68 |
| مساحات التشغيل | toContainText | tests/e2e/px16-navigation-ia.spec.ts | 69 |
| مسار الصفحة | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 69 |
| صندوق الإشعارات | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 70 |
| التنبيهات المجمعة | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 71 |
| البحث الشامل | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 72 |
| ابحث سريعًا عن فاتورة أو منتج أو عميل | getByPlaceholder | tests/e2e/px16-navigation-ia.spec.ts | 74 |
| البحث الشامل | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 75 |
| الإشعارات | getByRole(heading) | tests/e2e/px16-navigation-ia.spec.ts | 77 |
| نتائج البحث الحالية | getByRole(heading) | tests/e2e/px16-navigation-ia.spec.ts | 78 |
| اسم منتج، رقم فاتورة، عميل أو رقم صيانة | getByPlaceholder | tests/e2e/px16-navigation-ia.spec.ts | 79 |
| التنقل داخل مساحات التشغيل | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 86 |
| التشغيل اليومي | getByText | tests/e2e/px16-navigation-ia.spec.ts | 88 |
| المخزون والخدمات | getByText | tests/e2e/px16-navigation-ia.spec.ts | 89 |
| المتابعة والإدارة | getByText | tests/e2e/px16-navigation-ia.spec.ts | 90 |
| الفواتير | toContainText | tests/e2e/px16-navigation-ia.spec.ts | 91 |
| مسار الصفحة | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 91 |
| الملخص والإيصال | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 92 |
| المرتجع | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 93 |
| الإجراء الإداري | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 94 |
| أقسام شاشة الجرد | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 98 |
| بدء الجرد | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 99 |
| الجرد المفتوح | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 100 |
| التسوية | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 101 |
| أقسام شاشة الإعدادات | getByLabel | tests/e2e/px16-navigation-ia.spec.ts | 105 |
| الصلاحيات | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 106 |
| اللقطة اليومية | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 107 |
| سلامة الأرصدة | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 108 |
| السياسات | getByRole(button) | tests/e2e/px16-navigation-ia.spec.ts | 109 |
| الفلاتر | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 113 |
| المقارنة | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 114 |
| المرتجعات | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 115 |
| الصيانة | getByRole(link) | tests/e2e/px16-navigation-ia.spec.ts | 116 |
| الصفحة الرئيسية (regex) | toHaveTitle | tests/e2e/px18-visual-accessibility.spec.ts | 63 |
| تسجيل الدخول | getByRole(heading) | tests/e2e/px18-visual-accessibility.spec.ts | 65 |
| التقارير (regex) | toHaveTitle | tests/e2e/px18-visual-accessibility.spec.ts | 70 |
| قراءة أوضح للأداء والمقارنات | getByRole(heading) | tests/e2e/px18-visual-accessibility.spec.ts | 71 |
| ابدأ بالفلاتر، راجع المؤشرات الأساسية | getByText | tests/e2e/px18-visual-accessibility.spec.ts | 72 |
| فتح القائمة | getByRole(button) | tests/e2e/px18-visual-accessibility.spec.ts | 85 |
| بحث | getByRole(button) | tests/e2e/px18-visual-accessibility.spec.ts | 86 |
| ابحث عن منتج... | getByPlaceholder | tests/e2e/px18-visual-accessibility.spec.ts | 88 |
| الكل | getByRole(button) | tests/e2e/px18-visual-accessibility.spec.ts | 106 |
| نقطة البيع (regex) | getByRole(link) | tests/e2e/px18-visual-accessibility.spec.ts | 112 |
| قراءة أوضح للأداء والمقارنات | getByRole(heading) | tests/e2e/px18-visual-accessibility.spec.ts | 162 |
| تصدير Excel المتقدم | getByRole(link) | tests/e2e/px18-visual-accessibility.spec.ts | 164 |
| فتح القائمة | getByRole(button) | tests/e2e/px21-shell-auth.spec.ts | 25 |
| القائمة | getByRole(button) | tests/e2e/px21-shell-auth.spec.ts | 31 |
| الصفحة الرئيسية (regex) | toHaveTitle | tests/e2e/px21-shell-auth.spec.ts | 48 |
| تسجيل الدخول | getByRole(heading) | tests/e2e/px21-shell-auth.spec.ts | 49 |
| نقطة البيع المباشرة (regex) | getByRole(link) | tests/e2e/px21-shell-auth.spec.ts | 50 |
| تثبيت Aya Mobile | getByRole(button) | tests/e2e/px21-shell-auth.spec.ts | 51 |
| النظام يعمل كتطبيق ويب | getByText | tests/e2e/px21-shell-auth.spec.ts | 52 |
| تسجيل الدخول (regex) | toHaveTitle | tests/e2e/px21-shell-auth.spec.ts | 58 |
| تسجيل الدخول | getByRole(heading) | tests/e2e/px21-shell-auth.spec.ts | 59 |
| تسجيل الدخول | getByRole(button) | tests/e2e/px21-shell-auth.spec.ts | 61 |
| نقطة البيع (regex) | getByRole(link) | tests/e2e/px21-shell-auth.spec.ts | 83 |
| الإشعارات (regex) | getByRole(link) | tests/e2e/px21-shell-auth.spec.ts | 86 |
| التقارير (regex) | getByRole(link) | tests/e2e/px21-shell-auth.spec.ts | 89 |
| الإعدادات (regex) | getByRole(link) | tests/e2e/px21-shell-auth.spec.ts | 92 |
| بحث (regex) | getByRole(button) | tests/e2e/px21-shell-auth.spec.ts | 105 |
| نقطة البيع السريعة | getByRole(heading) | tests/e2e/px22-transactional-ux.spec.ts | 52 |
| ابحث عن منتج... | getByPlaceholder | tests/e2e/px22-transactional-ux.spec.ts | 53 |
| الكل | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 55 |
| السلة الحالية | getByRole(heading) | tests/e2e/px22-transactional-ux.spec.ts | 62 |
| ادفع (regex) | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 64 |
| الفواتير والإيصالات والمرتجعات | getByRole(heading) | tests/e2e/px22-transactional-ux.spec.ts | 75 |
| قائمة الفواتير | getByRole(heading) | tests/e2e/px22-transactional-ux.spec.ts | 76 |
| فتح الفاتورة (regex) | getByRole(link) | tests/e2e/px22-transactional-ux.spec.ts | 77 |
| فتح الفاتورة (regex) | getByRole(link) | tests/e2e/px22-transactional-ux.spec.ts | 81 |
| تفاصيل الفاتورة | getByText | tests/e2e/px22-transactional-ux.spec.ts | 85 |
| الملخص والإيصال | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 86 |
| المرتجع | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 87 |
| الإجراء الإداري | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 88 |
| طباعة الإيصال | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 90 |
| الديون والتسديد | getByRole(heading) | tests/e2e/px22-transactional-ux.spec.ts | 103 |
| العملاء والقيود | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 105 |
| دين يدوي | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 110 |
| التسديد | getByRole(button) | tests/e2e/px22-transactional-ux.spec.ts | 113 |
| المنتجات الجاهزة للبيع | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 34 |
| ابدأ من المنتج أو التصنيف | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 35 |
| ابحث باسم المنتج أو SKU | getByPlaceholder | tests/e2e/px23-operational-workspaces.spec.ts | 36 |
| الكل | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 37 |
| بطاقات المنتجات | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 39 |
| لم نصل إلى منتجات مطابقة | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 41 |
| مركز التنبيهات والمتابعة | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 52 |
| أقسام مركز الإشعارات | getByLabel | tests/e2e/px23-operational-workspaces.spec.ts | 53 |
| صندوق الإشعارات | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 55 |
| الملخصات والتنبيهات | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 56 |
| البحث الشامل | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 57 |
| الإشعارات الحالية | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 58 |
| البحث الشامل | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 60 |
| نتائج البحث الحالية | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 61 |
| الجرد والتسوية المحسنة | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 73 |
| الجرد المفتوح | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 74 |
| آخر النتائج | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 75 |
| الموردون والمشتريات | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 79 |
| أقسام الموردين والمشتريات | getByLabel | tests/e2e/px23-operational-workspaces.spec.ts | 80 |
| الدليل والتفاصيل | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 81 |
| أوامر الشراء | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 82 |
| التسديدات | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 83 |
| المصروفات ومركز الفئات | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 87 |
| أقسام شاشة المصروفات | getByLabel | tests/e2e/px23-operational-workspaces.spec.ts | 88 |
| تسجيل المصروف | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 89 |
| الشحن والتحويلات | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 93 |
| أقسام شاشة العمليات | getByLabel | tests/e2e/px23-operational-workspaces.spec.ts | 94 |
| تحويل داخلي | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 95 |
| الصيانة الأساسية | getByRole(heading) | tests/e2e/px23-operational-workspaces.spec.ts | 99 |
| أوامر الصيانة | getByRole(button) | tests/e2e/px23-operational-workspaces.spec.ts | 100 |
| قراءة أوضح للأداء والمقارنات | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 26 |
| تطبيق الفلاتر | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 27 |
| حدد النطاق أولًا | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 28 |
| ملخص سريع قبل النزول إلى التفاصيل | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 29 |
| الإعدادات التشغيلية والإغلاق اليومي | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 39 |
| أقسام شاشة الإعدادات | getByLabel | tests/e2e/px24-analytical-config.spec.ts | 40 |
| الصلاحيات | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 41 |
| اللقطة اليومية | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 42 |
| السياسات | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 43 |
| السياسات | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 45 |
| قرار الطباعة في MVP | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 46 |
| قرار المستخدم/الجهاز | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 47 |
| مركز النقل والاستيراد والاستعادة التجريبية | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 59 |
| أقسام شاشة النقل والنسخ | getByLabel | tests/e2e/px24-analytical-config.spec.ts | 60 |
| إنشاء الحزم | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 61 |
| فحص الاستيراد | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 62 |
| الاستعادة التجريبية | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 63 |
| السجل الأخير | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 64 |
| فحص الاستيراد | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 66 |
| افحص الملف أولًا ثم اعتمد الصفوف السليمة | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 67 |
| الاستعادة التجريبية | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 69 |
| استعادة معزولة داخل بيئة الاختبار | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 70 |
| السجل الأخير | getByRole(button) | tests/e2e/px24-analytical-config.spec.ts | 72 |
| سجل الحزم الجاهزة والملغاة | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 73 |
| فحوص الاستيراد وتجارب الاستعادة | getByRole(heading) | tests/e2e/px24-analytical-config.spec.ts | 74 |
| تسجيل الدخول | getByRole(heading) | tests/e2e/smoke.spec.ts | 14 |
| نقطة البيع المباشرة | getByRole(link) | tests/e2e/smoke.spec.ts | 15 |
| يلزم تسجيل الدخول لقراءة المنتجات | getByRole(heading) | tests/e2e/smoke.spec.ts | 42 |
| سجّل الدخول لعرض قائمة المنتجات المتاحة للبيع من الحساب المصرح له. | getByText | tests/e2e/smoke.spec.ts | 43 |
| يلزم تسجيل الدخول لفتح نقطة البيع | getByRole(heading) | tests/e2e/smoke.spec.ts | 49 |
| سجّل الدخول بحساب مخصص للبيع | getByText | tests/e2e/smoke.spec.ts | 50 |
| يلزم تسجيل الدخول لفتح الإعدادات التشغيلية | getByRole(heading) | tests/e2e/smoke.spec.ts | 62 |
| يلزم تسجيل الدخول لفتح التقارير | getByRole(heading) | tests/e2e/smoke.spec.ts | 62 |
| يلزم تسجيل الدخول لفتح شاشة الديون | getByRole(heading) | tests/e2e/smoke.spec.ts | 62 |
| يلزم تسجيل الدخول لفتح شاشة الفواتير | getByRole(heading) | tests/e2e/smoke.spec.ts | 62 |
| سجّل الدخول أولًا | getByText | tests/e2e/smoke.spec.ts | 63 |
| تسجيل الدخول | getByRole(heading) | tests/e2e/smoke.spec.ts | 70 |
| تسجيل الدخول | getByRole(button) | tests/e2e/smoke.spec.ts | 71 |

## Section B - Protected CSS Classes

| الـ Class | كيف تُستخدم في الـ Test | الملف | السطر |
|-----------|------------------------|-------|-------|
| .result-card | locator for visibility check | tests/e2e/device-qa.spec.ts | 237 |
| .list-card--interactive | interactive locator for click action | tests/e2e/device-qa.spec.ts | 244 |
| .result-card | locator for visibility check | tests/e2e/device-qa.spec.ts | 247 |
| .result-card | locator for visibility check | tests/e2e/px06-device-gate.spec.ts | 140 |
| .list-card--interactive | interactive locator for click action | tests/e2e/px06-device-gate.spec.ts | 147 |
| .result-card | locator for visibility check | tests/e2e/px06-device-gate.spec.ts | 150 |
| .product-card--interactive | locator used in test | tests/e2e/px06-uat.spec.ts | 484 |
| .product-grid--compact | DOM lookup via querySelector in page.evaluate | tests/e2e/px06-uat.spec.ts | 496 |
| .product-card--interactive | DOM lookup via querySelector in page.evaluate | tests/e2e/px06-uat.spec.ts | 503 |
| .product-card--interactive | locator for count assertion | tests/e2e/px06-uat.spec.ts | 539 |
| .summary-grid | locator for count assertion | tests/e2e/px13-search-alerts.spec.ts | 280 |
| .workspace-panel | locator for count assertion | tests/e2e/px13-search-alerts.spec.ts | 280 |
| .summary-grid | locator for count assertion | tests/e2e/px13-search-alerts.spec.ts | 301 |
| .workspace-panel | locator for count assertion | tests/e2e/px13-search-alerts.spec.ts | 301 |
| .dashboard-quick-search | locator used in test | tests/e2e/px16-navigation-ia.spec.ts | 66 |
| .auth-card | locator for visibility check | tests/e2e/px18-visual-accessibility.spec.ts | 67 |
| .analytical-page__meta-grid | locator for visibility check | tests/e2e/px18-visual-accessibility.spec.ts | 73 |
| .data-table | locator for visibility check | tests/e2e/px18-visual-accessibility.spec.ts | 74 |
| .dashboard-header-title | locator for text assertion | tests/e2e/px18-visual-accessibility.spec.ts | 75 |
| .dashboard-topbar | locator for text assertion | tests/e2e/px18-visual-accessibility.spec.ts | 75 |
| .transaction-toolbar__search | locator used in test | tests/e2e/px18-visual-accessibility.spec.ts | 87 |
| .pos-cart-sheet__summary | locator used in test | tests/e2e/px18-visual-accessibility.spec.ts | 91 |
| .dashboard-topbar | DOM lookup via querySelector in page.evaluate | tests/e2e/px18-visual-accessibility.spec.ts | 131 |
| .section-card | DOM lookup via querySelector in page.evaluate | tests/e2e/px18-visual-accessibility.spec.ts | 132 |
| .workspace-panel | DOM lookup via querySelector in page.evaluate | tests/e2e/px18-visual-accessibility.spec.ts | 132 |
| .dashboard-bottom-bar | locator for visibility check | tests/e2e/px21-shell-auth.spec.ts | 74 |
| .dashboard-sidebar | locator used in test | tests/e2e/px21-shell-auth.spec.ts | 77 |
| .dashboard-layout__sidebar | locator for visibility check | tests/e2e/px21-shell-auth.spec.ts | 100 |
| .dashboard-nav-group__title | locator for visibility check | tests/e2e/px21-shell-auth.spec.ts | 101 |
| .dashboard-header-title | locator for text assertion | tests/e2e/px21-shell-auth.spec.ts | 102 |
| .dashboard-topbar | locator for text assertion | tests/e2e/px21-shell-auth.spec.ts | 102 |
| .dashboard-user-chip | locator for text assertion | tests/e2e/px21-shell-auth.spec.ts | 103 |
| .pos-cart-sheet__summary | locator for visibility check | tests/e2e/px22-transactional-ux.spec.ts | 59 |
| .pos-cart-sheet__summary | interactive locator for click action | tests/e2e/px22-transactional-ux.spec.ts | 61 |

## Section C - Protected State and Behavior

| الوصف | السلوك المتوقع | المكوّن | الملف الذي يختبره |
|--------|---------------|---------|------------------|
| حالة بدء سلة الهاتف | `isCartSheetExpanded = false` (مطوية) عند التحميل | `pos-workspace.tsx` | `tests/e2e/px22-transactional-ux.spec.ts:59` |
| زر تأكيد البيع على الهاتف | مرئي فور تسجيل الدخول دون أي نقر | `pos-workspace.tsx` | `tests/e2e/device-qa.spec.ts:220`, `tests/e2e/px06-device-gate.spec.ts:116` |
| شريط التنقل السفلي | مرئي على الهاتف (360px) في `/pos` | `dashboard-shell.tsx` | `tests/e2e/px21-shell-auth.spec.ts:74` |
| مقبض السلة المطوية | `.pos-cart-sheet__summary` مرئي في الوضع المطوي | `pos-workspace.tsx` | `tests/e2e/px22-transactional-ux.spec.ts:59`, `tests/e2e/px18-visual-accessibility.spec.ts:91` |
| تركيز حقل البحث في POS | حقل البحث يحصل على `focus` تلقائيًا عند فتح `/pos` | `pos-workspace.tsx` | `tests/e2e/px18-visual-accessibility.spec.ts:98` |
| شريحة التصنيف الافتراضية | زر `الكل` يبدأ بحالة `aria-pressed=\"true\"` | `pos-workspace.tsx` | `tests/e2e/px18-visual-accessibility.spec.ts:106`, `tests/e2e/px18-visual-accessibility.spec.ts:115` |
| التنقل حسب الدور | روابط `التقارير` و`الإعدادات` مخفية عن `pos_staff` وتظهر للحساب الإداري فقط | `app/(dashboard)/layout.tsx` + `dashboard-shell.tsx` | `tests/e2e/px16-navigation-ia.spec.ts:49`, `tests/e2e/px21-shell-auth.spec.ts:89` |
| تبويب مركز الإشعارات | إذا وُجد `q` يبدأ القسم النشط على `search` بدل `inbox` | `notifications-workspace.tsx` | `tests/e2e/px16-navigation-ia.spec.ts:78`, `tests/e2e/px23-operational-workspaces.spec.ts:61` |
| كثافة بطاقات الإشعارات حسب الدور | الإداري يرى 5 لوحات ملخص و`pos_staff` يرى 3 فقط | `notifications-workspace.tsx` | `tests/e2e/px13-search-alerts.spec.ts:280`, `tests/e2e/px13-search-alerts.spec.ts:301` |
| زر التثبيت | يبقى disabled حتى يصل `beforeinstallprompt` ثم يصبح enabled ويعرض رسالة القبول بعد النقر | `install-prompt.tsx` | `tests/e2e/px06-device-gate.spec.ts:192`, `tests/e2e/px06-device-gate.spec.ts:219`, `tests/e2e/px06-device-gate.spec.ts:221` |

## Section D - How to Update This File

1. **When you change a protected string in source code**: find its row in Section A, update the `النص` column to the new value, and note the change date in the file header
2. **When you add a new assertion to a test**: add the string or class to the appropriate section before committing
3. **When you rename a CSS class**: update Section B, grep `tests/e2e/` to confirm all usages, and update all test files before renaming the source
4. **When a state/behavior changes**: update Section C and verify the tests that depend on it still pass
5. This file must always reflect the **current** state of the tests - a stale entry is worse than no entry
