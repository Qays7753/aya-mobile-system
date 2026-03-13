# آية موبايل - خطة التنفيذ
## 9) Implementation Plan (MVP → V1 → V2)

---

## 📋 مقدمة

هذا المستند يحدد خطة التنفيذ المرحلية لنظام "آية موبايل".

**ملاحظة تنفيذية:** هذا المستند هو **الخطة الاستراتيجية**. أما المتابعة اليومية وإغلاق كل مرحلة أثناء البناء فتتم عبر [31_Execution_Live_Tracker.md](./31_Execution_Live_Tracker.md).

**المدد التقديرية:**
- المرحلة 0 (البيئة والأمان): يوم واحد
- MVP: 4-6 أسابيع
- V1: +2-3 أسابيع
- V2: +4-6 أسابيع
- ما بعد V2 / Productization: +3-5 أسابيع
- الإطلاق: أسبوع واحد
- **المجموع: ~17-21 أسبوعاً**

**مبادئ ثابتة:**
- لا يوجد وضع Offline في أي مرحلة (MVP/V1/V2).
- **بناء عمودي:** كل ميزة تُبنى كاملة (DB → API Route → UI → اختبار) قبل الانتقال للتالية.
- **بوابات تحقق (Gates):** لا ننتقل لمرحلة جديدة إلا بعد اجتياز جميع معايير المرحلة السابقة.
- **مراجعة مستقلة إلزامية:** كل مرحلة تحتاج `Execution Report` + `Review Report` من Agent مراجعة فقط + إغلاق الملاحظات قبل اعتبارها مكتملة.
- **دعم الأجهزة بدون استثناء:** النظام Web App واحد يعمل على الهاتف + التابلت + اللابتوب.

---

## 🛡️ المرحلة 0: البيئة والأمان (Day 1 — قبل أي كود)

> **هذه الخطوات إلزامية قبل كتابة أي سطر كود آخر.**
> المرجع: [13_Tech_Config.md](./13_Tech_Config.md) — هيكل المجلدات + متغيرات البيئة + الأمان

| # | المهمة | التفاصيل | معيار "تم" |
|---|--------|----------|------------|
| 0.1 | إنشاء مشروع Next.js | App Router + TypeScript + baseline CSS shell | `npm run dev` يفتح صفحة فارغة |
| 0.2 | إنشاء مشروع Supabase | `supabase init` + ربط بمشروع Cloud | `supabase status` يُرجع connected |
| 0.3 | إعداد Environment Variables | `.env.local` مع `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | المفاتیح تعمل |
| 0.4 | إنشاء `lib/supabase/server.ts` | عميل `service_role` للـ API Routes فقط | Import يعمل بدون خطأ |
| 0.5 | إنشاء `lib/supabase/client.ts` | عميل `@supabase/ssr` للقراءة فقط | Import يعمل |
| 0.6 | إعداد Git + `.gitignore` | `.env.local` محمي، لا Secrets في الكود | `git status` لا يعرض `.env` |
| 0.7 | إنشاء Health Check | `GET /api/health` → `{ status: "ok" }` | يُرجع 200 من المتصفح |
| 0.8 | تفعيل Web Installability | `manifest.webmanifest` + `viewport` + metadata | التطبيق قابل للإضافة للشاشة الرئيسية/التثبيت على الأجهزة |

### 🚪 بوابة الانتقال إلى MVP
- [ ] Health Check يُرجع 200
- [ ] `SERVICE_ROLE_KEY` غير مرئي في المتصفح (لا يبدأ بـ `NEXT_PUBLIC_`)
- [ ] هيكل المجلدات مطابق لـ `13_Tech_Config.md`
- [ ] التطبيق يفتح ويعمل على هاتف + تابلت + لابتوب (Smoke Test)

---

## 🚀 المرحلة 1: MVP (Minimum Viable Product)

### الهدف
نسخة شغالة بأقل الميزات لبدء العمل الفعلي.

### المدة
4-6 أسابيع

### الفريق المقترح
- 1 مطور Full Stack (أو 2: Frontend + Backend)

### ما يُسلم في MVP

#### 1. البنية التحتية (Week 1)

> **🔴 أولوية قصوى — أول مهام اليوم الأول:**
> قبل كتابة أي كود واجهة، يجب تنفيذ الخطوات الأمنية التالية بهذا الترتيب:
> 1. إنشاء `lib/supabase/admin.ts` — عميل `service_role` (الأساس لكل شيء)
> 2. تنفيذ Migration: `REVOKE ALL ON ALL TABLES IN SCHEMA public` — إغلاق الكتابة المباشرة
> 3. إنشاء الـ 14 API Route في `app/api/` — كل عملية كتابة تمر عبرها
>
> **المرجع:** ADR-042 (API Routes) + ADR-043 (سحب الأسعار من DB) + ADR-044 (REVOKE ALL) في `10_ADRs.md`

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| إعداد Supabase | Project، Auth، Database | يمكن تسجيل الدخول |
| إعداد Vercel | Project، Domain | يمكن فتح الموقع |
| إنشاء `lib/supabase/admin.ts` | عميل service_role للسيرفر فقط | المفتاح غير مرئي في المتصفح |
| REVOKE ALL Migration | سحب صلاحيات الكتابة المباشرة | INSERT من المتصفح يرفض |
| إنشاء 14 API Route | كل عملية لها Route محمي | الكتابة تمر عبر السيرفر فقط |
| إنشاء الجداول الأساسية | products, profiles, accounts | الجداول جاهزة |
| RLS Policies أساسية | profiles, products | الصلاحيات تعمل |

#### 2. إدارة المنتجات (Week 1)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| CRUD المنتجات | إضافة، تعديل، حذف، عرض | يمكن إدارة المنتجات |
| تصنيف المنتجات | أجهزة، إكسسوارات، شرائح، خدمات | التصنيف يعمل |
| تتبع المخزون | زيادة/نقصان | المخزون يتحدث |

#### 3. نقطة البيع POS (Week 2)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| واجهة POS | سريعة، بسيطة | يمكن البيع في 2 دقيقة |
| البحث عن منتج | بالاسم | البحث يعمل |
| إضافة للفاتورة | كمية، سعر | الفاتورة تُبنى |
| الدفع النقدي | نقدي فقط | يمكن البيع النقدي |
| إشعار الخصم | عند تجاوز الحد التنبيهي | يصل إشعار لأحمد |
| تشغيل متزامن | جهازان POS+ بنفس الوقت | لا يوجد مخزون سالب أو فواتير مكررة |
| توافق متعدد الأجهزة | نفس شاشة POS تعمل على الهاتف/التابلت/اللابتوب | لا كسر واجهات ولا وظائف مفقودة |

#### 4. الفواتير (Week 2)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| قائمة الفواتير | عرض، بحث | يمكن رؤية الفواتير |
| عرض فاتورة | تفاصيل كاملة | يمكن رؤية التفاصيل |
| رقم تسلسلي | توليد تلقائي | الأرقام متسلسلة |
| إلغاء الفاتورة | Admin فقط + سبب إلزامي | يمكن الإلغاء مع Audit Log |
| تعديل الفاتورة | سبب إلزامي + عكس قيود | يمكن التعديل بشكل موثق |

#### 5. الحسابات المالية (Week 3)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| إدارة الحسابات | صندوق، فيزا، محافظ | الحسابات جاهزة |
| Ledger Entries | تسجيل حركات | الحركات تُسجل |
| حساب الرصيد | تلقائي | الأرصدة صحيحة |

#### 6. الدفع المختلط (Week 3)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| Split Payment | أكثر من طريقة | يمكن الدفع المختلط |
| عمولة الفيزا | حساب تلقائي | العمولة تُحسب |

#### 7. المرتجعات (Week 4)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| مرتجع كامل | إرجاع فاتورة | يمكن الإرجاع |
| إعادة المخزون | تلقائي | المخزون يُعاد |
| استرداد المبلغ | نقدي/فيزا/محفظة | يمكن الاسترداد |

#### 8. الديون الأساسية (Week 4)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| عملاء الدين | إضافة (أحمد فقط) | يمكن إضافة العملاء |
| بيع بالدين | داخل الفاتورة | يمكن البيع بالدين |
| تسديد دين | تسجيل تسديد | يمكن التسديد |
| حد الدين | تنبيه تلقائي فقط | يظهر تنبيه ويسجل في النظام |

#### 9. اللقطة اليومية والتقارير بالتاريخ (Week 5)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| Daily Snapshot | حفظ ملخص يومي عند الطلب | يمكن حفظ لقطة يومية |
| فلاتر التاريخ | يوم/فترة مخصصة | كل يوم يظهر منفصلاً |
| Audit Log أساسي | تسجيل العمليات | السجل يعمل |

#### 10. التقارير الأساسية (Week 5-6)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| تقرير المبيعات | يومي | يمكن رؤية المبيعات |
| تقرير الديون | رصيد العملاء | يمكن متابعة الديون |
| هيستوري المبيعات | فلترة تاريخ/موظف/جهاز/حالة | يمكن تتبع ماذا بيعنا بدقة |
| فحص سلامة مالية (Admin) | زر "فحص الأرصدة" في Dashboard يستدعي `fn_verify_balance_integrity()` عبر `POST /api/health/balance-check` | يعرض نتيجة (ok/drift) مع تفاصيل الفروقات |

### معيار اكتمال MVP

```
✅ يمكن:
   - إضافة منتجات
   - البيع النقدي والمختلط
   - البيع بالدين
   - البيع المتزامن من أكثر من جهاز
   - إرجاع المنتجات
   - تعديل الفاتورة (موثق)
   - إلغاء الفاتورة (Admin فقط)
   - تسديد الديون
   - حفظ Daily Snapshot
   - تتبع هيستوري المبيعات
   - رؤية تقارير أساسية
   - تشغيل النظام من الهاتف + التابلت + اللابتوب عبر نفس رابط الويب

❌ لا يوجد:
   - طباعة
   - واتساب
   - روابط الإيصالات
   - تقارير متقدمة
   - صلاحيات دقيقة
```

### 🚪 بوابة الانتقال إلى V1
- [ ] جميع الجداول (29) موجودة
- [ ] RLS مفعل على جميع الجداول
- [ ] INSERT مباشر من المتصفح مرفوض
- [ ] بيعان متزامنان لنفس المنتج لا ينتج عنهما مخزون سالب
- [ ] كل SOP ذو صلة من [08_SOPs.md](./08_SOPs.md) يعمل بدون أخطاء
- [ ] `idempotency_key` يمنع التكرار (إرسال مزدوج → 409)
- [ ] POS لا يرى شاشات Admin
- [ ] Audit Log يسجّل كل عملية حساسة
- [ ] جميع الشاشات التشغيلية الأساسية تُجتاز على هاتف/تابلت/لابتوب

---

## ⬆️ المرحلة 2: V1 (Version 1)

### الهدف
تحسينات أساسية وتقارير أفضل.

### المدة
2-3 أسابيع

### ما يُضاف في V1

#### 1. المشتريات والموردين (Week 1)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| إدارة الموردين | إضافة، تعديل | يمكن إدارة الموردين |
| شراء نقدي | تسجيل شراء (المورد اختياري) | يمكن الشراء النقدي |
| شراء على الحساب | دين للمورد (المورد إلزامي) | يمكن الشراء بالدين |
| تسديد مورد | تسجيل دفعات الموردين | يمكن تسديد الموردين |
| تحديث التكلفة | آخر + متوسط | التكلفة تُحدث |

#### 2. الشحن والتحويلات (Week 1)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| تسجيل شحن | مبلغ + ربح | يمكن تسجيل الشحن |
| تسجيل تحويل | مبلغ + ربح | يمكن تسجيل التحويل |
| تقرير الشحن | أرباح | يمكن رؤية الأرباح |

#### 3. الجرد (Week 2)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| جرد يومي | منتجات مختارة | يمكن الجرد اليومي |
| جرد شامل | جميع المنتجات | يمكن الجرد الشامل |
| تسجيل الفروقات | مع السبب | الفروقات تُسجل |

#### 4. التسوية (Week 2)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| تسوية حساب | متوقع vs فعلي | يمكن التسوية |
| تسجيل الفرق | مع السبب | الفرق يُسجل |

#### 5. التقارير المحسنة (Week 2-3)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| تقرير الأرباح | مفصل | يمكن رؤية الأرباح |
| تقرير الحسابات | حركات | يمكن رؤية الحركات |
| تقرير المرتجعات | أسباب | يمكن تحليل المرتجعات |
| تصدير Excel | جميع التقارير | يمكن التصدير |

#### 6. UX Improvements (Week 3)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| اختصارات لوحة المفاتيح | POS | العمل أسرع |
| بحث محسن | منتجات، فواتير | البحث أسرع |
| تنبيهات المخزون | منتجات منخفضة | التنبيهات تعمل |
| تنبيه سلامة مالية يومي (Admin) | Cron Job يستدعي `fn_verify_balance_integrity()` يومياً عبر `/api/cron/balance-check` → إشعار إذا `drift` | إشعار `reconciliation_difference` يظهر في Dashboard تلقائياً |

#### 7. قسم الصيانة المنفصل (Week 3)

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| أوامر الصيانة | إنشاء ومتابعة حالة الجهاز | يمكن إدارة أوامر الصيانة |
| حسابات الصيانة | قيود مالية منفصلة | تقارير الصيانة مستقلة |
| تقرير الصيانة | إيراد/تكلفة/صافي | يمكن مراجعة أداء الصيانة |

### معيار اكتمال V1

```
✅ كل ما في MVP +
   - المشتريات والموردين
   - تسديدات الموردين
   - الشحن والتحويلات
   - الجرد والتسوية
   - الصيانة المنفصلة
   - تقارير محسنة
   - UX أفضل
```

### 🚪 بوابة الانتقال إلى V2
- [ ] المشتريات النقدية والآجلة تعمل
- [ ] تسديد الموردين يُحدّث الرصيد
- [ ] الجرد يُعدّل المخزون تلقائياً
- [ ] التسوية تحسب الفرق صحيحاً
- [ ] الصيانة (استقبال → فحص → تسليم) تعمل
- [ ] التقارير دقيقة ومُطابقة لحسابات اليد
- [ ] تصدير Excel يعمل لجميع التقارير

---

## 🌟 المرحلة 3: V2 (Version 2)

### الهدف
تحويل النظام من `V1` مكتملة وظيفيًا إلى تشغيل متقدم وقابل للتوسع دون كسر عقود `MVP/V1`.

### المدة
4-6 أسابيع

### ملاحظة تكاملية قبل البدء

قبل أي شريحة `V2` جديدة، يجب استهلاك العنصر الخارجي carried forward:

- `PX-02-T04-D01 = create_expense`

السبب:
- `daily_snapshots`, `profit`, و`reports` تعتمد على `expenses` فعليًا.
- النظام الحالي يملك جدول `expenses` ودالة `create_expense()`، لكنه لا يملك بعد API/UI production-grade لها.
- لا يجوز بناء `advanced reports` أو `data portability` على طبقة مصروفات غير مكتملة تعاقديًا.

لذلك تُوضع المصروفات كأول slice بعد `PX-07`.

### ما يُضاف في V2

#### تفكيك تنفيذي جاهز لـ V2 وما بعدها

| Phase ID | المحور | المخرجات الأساسية | التبعيات |
|----------|--------|-------------------|----------|
| `PX-08` | المصروفات + مركز الإشعارات | `create_expense`, إدارة `expense_categories`, شاشة المصروفات, inbox للإشعارات | `PX-07` |
| `PX-09` | التواصل وروابط الإيصالات | receipt links عامة للقراءة فقط, scheduler للتذكير, WhatsApp adapter + delivery log | `PX-08` |
| `PX-10` | الصلاحيات الدقيقة | role expansion, permission bundles, discount governance, UI/API guards | `PX-08`, `PX-09` |
| `PX-11` | التقارير المتقدمة | period compare, charts, drilldowns, expense-aware profitability | `PX-08`, `PX-10` |
| `PX-12` | النقل والنسخ الاحتياطي | JSON/CSV export, product import, backup/restore drill, audit portability | `PX-11` |
| `PX-13` | الأداء والبحث والتنبيهات | caching, advanced search, admin alert aggregation, performance proof | `PX-09`, `PX-11`, `PX-12` |
| `PX-14` | V2 Release Gate | UAT شامل, privacy/security audit, restore drill, Go/No-Go | `PX-08..PX-13` |

#### PX-08 — Expense Core + Notification Inbox

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-08-T01` | توحيد `create_expense` على `service_role + p_created_by` | الدالة تعمل عبر API دون `auth.uid()` مباشر |
| `PX-08-T02` | إدارة `expense_categories` (Admin CRUD + POS active read only) | يمكن إدارة الفئات دون كسر Blind POS |
| `PX-08-T03` | `/api/expenses` + `/expenses` + validation | يمكن تسجيل مصروف كامل ويظهر في `ledger` |
| `PX-08-T04` | مركز إشعارات داخل التطبيق + mark as read | Admin يرى كل الإشعارات وPOS يرى إشعاراته فقط |
| `PX-08-T05` | إثبات تكامل المصروفات مع `daily_snapshot/reports` | `total_expenses` و`net_profit` يتأثران بشكل صحيح |

#### PX-09 — Communication + Receipt Links

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-09-T01` | عقد receipt links العام + token/revocation model | الرابط يقرأ الفاتورة فقط بدون كشف بيانات داخلية |
| `PX-09-T02` | صفحة إيصال عامة للقراءة فقط + share action | الرابط يعمل من الهاتف والواتساب |
| `PX-09-T03` | scheduler لتذكير الديون (`due/overdue`) مع dedupe | لا تتكرر التنبيهات لنفس الحالة |
| `PX-09-T04` | WhatsApp send adapter + delivery log | يمكن الإرسال وتتبع الحالة |
| `PX-09-T05` | تحقق privacy/no-leakage على الرسائل والروابط | لا يظهر `cost/profit/internal notes` خارج النظام |

#### PX-10 — Fine-Grained Permissions + Discount Governance

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-10-T01` | حزمة عقود role expansion (`ADR + schema + API matrix`) | model جديد معتمد قبل التنفيذ |
| `PX-10-T02` | permission bundles + role assignment flows | يمكن إسناد أدوار إضافية غير `admin/pos_staff` |
| `PX-10-T03` | حراسة UI/API/navigation حسب الصلاحيات الجديدة | كل شاشة ومسار يعملان وفق الدور |
| `PX-10-T04` | قيود الخصم والاعتماد بحسب الدور | الحدود تعمل وتُراجع auditably |
| `PX-10-T05` | regression على Blind POS وauthority بعد role expansion | لا يوجد shadow path جديد |

#### PX-11 — Advanced Reports + Comparative Analytics

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-11-T01` | عقود تقارير متقدمة (`compare`, `trends`, `drilldown`) | request/response واضحة |
| `PX-11-T02` | تقارير فترة ومقارنة فترة | month vs month تعمل |
| `PX-11-T03` | charts وvisual analytics | الرسوم تعمل دون كسر الأجهزة |
| `PX-11-T04` | parity بين الشاشة والتصدير | الأرقام في UI وexport متطابقة |
| `PX-11-T05` | proof مالي للتقارير المتقدمة | totals تطابق `ledger/snapshots` |

#### PX-12 — Data Portability + Backup / Import

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-12-T01` | export JSON/CSV admin-only | يمكن تصدير البيانات بملفات سليمة |
| `PX-12-T02` | import products مع dry-run/commit | يمكن الاستيراد بدون إفساد البيانات |
| `PX-12-T03` | backup/restore drill على بيئة معزولة | `RTO` و`drift` ضمن الهدف |
| `PX-12-T04` | audit + notifications لعمليات التصدير/الاستيراد/الاستعادة | كل عملية موثقة |
| `PX-12-T05` | privacy check على packages المحمولة | لا تسرب غير مقصود للبيانات الحساسة |

#### PX-13 — Performance + Search + Alert Aggregation

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-13-T01` | caching آمن للقراءات الشائعة | الصفحات أسرع دون stale financial state |
| `PX-13-T02` | advanced search & filters | البحث أدق على المنتجات/الفواتير/الديون |
| `PX-13-T03` | admin alert aggregation center | التنبيهات المجمعة تعمل وتقلل الضوضاء |
| `PX-13-T04` | قياس `p95` للتقارير والبحث | targets موثقة ومجتازة |
| `PX-13-T05` | multi-device regression بعد optimization | لا regressions على الهاتف/التابلت/اللابتوب |

#### PX-14 — V2 Release Gate

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-14-T01` | UAT شامل لـ V2 | UAT الخاصة بـ V2 = Pass |
| `PX-14-T02` | security/privacy/permissions audit | لا `P0/P1` مفتوح |
| `PX-14-T03` | restore/portability/communication drill | كل drills مجتازة |
| `PX-14-T04` | قرار `Go/No-Go` لـ V2 | قرار موثق بالأدلة |

### إضافات لازمة اكتُشفت أثناء التخطيط

هذه البنود لم تكن مصاغة بوضوح كميزات مستقلة في `V2`، لكنها ضرورية كي تكون الخطة قابلة للتنفيذ ومتكاملة:

1. **`Expense Core Slice`**
   لأن `expenses` تؤثر على `daily_snapshots`, `profit`, و`advanced reports`، ولا يجوز تأجيلها أكثر.

2. **إدارة `expense_categories`**
   لأن تشغيل المصروفات دون إدارة الفئات يجعل الـ UI والتقارير ناقصة وظيفيًا.

3. **Notification Inbox / Read Model**
   لأن النظام ينشئ إشعارات بالفعل، لكن `V2` تضيف reminders وتحتاج surface تشغيلية لا مجرد inserts داخلية.

4. **Privacy Contract لروابط الإيصالات والتصدير**
   لأن `receipt_url`, `WhatsApp`, و`data portability` تفتح حدود وصول جديدة يجب ضبطها قبل التنفيذ.

### معيار اكتمال V2

```
✅ كل ما في V1 +
   - المصروفات ومركز الإشعارات يعملان
   - واتساب وروابط الإيصالات يعملان
   - الصلاحيات الدقيقة وقيود الخصم مطبقة
   - التقارير المتقدمة متطابقة مع الحسابات
   - النقل/الاستيراد/النسخ الاحتياطي مُجرّب عمليًا
   - الأداء والبحث والتنبيهات المحسنة ضمن الأهداف
   - `PX-14` = `Go`
```

---

## 📅 الخطة الزمنية الملخصة

```
الأسبوع 1-6:   MVP
├── البنية التحتية
├── المنتجات
├── POS
├── الفواتير
├── الحسابات
├── المرتجعات
├── الديون
├── Daily Snapshot
└── تقارير أساسية

الأسبوع 7-9:   V1
├── المشتريات والموردين
├── تسديد الموردين
├── الشحن والتحويلات
├── الجرد والتسوية
├── الصيانة المنفصلة
├── تقارير محسنة
└── UX Improvements

الأسبوع 10-15: V2
├── المصروفات + مركز الإشعارات
├── واتساب + receipt links
├── الصلاحيات الدقيقة
├── التقارير المتقدمة
├── النقل/النسخ الاحتياطي
├── الأداء + البحث + تجميع التنبيهات
└── V2 Release Gate
```

---

## ✅ قائمة التحقق قبل الإطلاق

### MVP
- [ ] جميع الجداول موجودة
- [ ] RLS مفعل
- [ ] POS يعمل
- [ ] المرتجعات تعمل
- [ ] الديون تُحسب
- [ ] Daily Snapshot يعمل
- [ ] Audit Log يعمل

### V1
- [ ] المشتريات تعمل
- [ ] الموردين مُدارة
- [ ] تسديد الموردين يعمل
- [ ] الجرد يعمل
- [ ] التسوية تعمل
- [ ] قسم الصيانة المنفصل يعمل
- [ ] التقارير محسنة

### V2
- [ ] `create_expense` أُغلقت كعنصر خارجي carried forward
- [ ] إدارة فئات المصروفات تعمل
- [ ] مركز الإشعارات وقراءة التنبيهات يعملان
- [ ] واتساب يعمل
- [ ] روابط الإيصالات تعمل
- [ ] الصلاحيات دقيقة
- [ ] قيود الخصم بحسب الدور تعمل
- [ ] التقارير متقدمة
- [ ] التصدير/الاستيراد/النسخ الاحتياطي يعمل
- [ ] الأداء والبحث المحسن يعملان
- [ ] `V2 Release Gate` = `Pass`

---

## 📊 مقياس النجاح

| المقياس | الهدف | كيفية القياس |
|---------|-------|--------------|
| وقت البيع | < 2 دقيقة | متوسط وقت الفاتورة |
| خطأ الفاتورة | < 1% | فواتير مُلغاة / إجمالي |
| تتبع الديون | 100% | الديون المسجلة / إجمالي |
| دقة المخزون | > 95% | (1 - |فروقات|/إجمالي) × 100 |
| رضا المستخدم | > 4/5 | استبيان |

---

## 🔗 الملفات المرتبطة

جميع ملفات الوثائق:
1. [01_Overview_Assumptions.md](./01_Overview_Assumptions.md)
2. [02_Gaps_Risks_Recommendations.md](./02_Gaps_Risks_Recommendations.md)
3. [03_UI_UX_Sitemap.md](./03_UI_UX_Sitemap.md)
4. [04_Core_Flows.md](./04_Core_Flows.md)
5. [05_Database_Design.md](./05_Database_Design.md)
6. [06_Financial_Ledger.md](./06_Financial_Ledger.md)
7. [07_Definitions_Glossary.md](./07_Definitions_Glossary.md)
8. [08_SOPs.md](./08_SOPs.md)
9. [09_Implementation_Plan.md](./09_Implementation_Plan.md)

---

**الإصدار:** 2.1  
**تاريخ التحديث:** 5 مارس 2026  
**التغييرات:** v2.1 — إضافة فحص السلامة المالية (زر في MVP) + تنبيه يومي تلقائي (في V1). v2.0 — إضافة المرحلة 0 وبوابات التحقق.

---

## 🔄 استراتيجية ترحيل البيانات (Data Migration)

| المرحلة | نوع التغيير | الإجراء |
|---------|-------------|---------|
| MVP → V1 | إضافة جداول جديدة | `CREATE TABLE` — لا تأثير على بيانات حالية |
| MVP → V1 | أعمدة جديدة لجداول موجودة | `ALTER TABLE ADD COLUMN ... DEFAULT ...` |
| V1 → V2 | تغيير هيكلي | Migration script + نسخ احتياطي + اختبار staging |

**قواعد:**
1. كل تغيير في ملف مُرقّم: `XXXXX_description.sql` في `/supabase/migrations/`
2. لا حذف أعمدة — `is_deprecated` فقط (ADR-022)
3. اختبار على نسخة بيانات فعلية أولاً

---

## ⚠️ استراتيجية معالجة الأخطاء (Error Handling)

جميع الأخطاء تتبع تنسيق StandardEnvelope الموثق في [13_Tech_Config.md](./13_Tech_Config.md):

```
Frontend → API Route → RPC (PostgreSQL)
                ↓ (خطأ)
          { success: false, error: { code: "ERR_*", message: "رسالة عربية" } }
                ↓
          Frontend يعرض Toast أحمر مع الرسالة العربية
```

| نوع الخطأ | HTTP Status | كود الخطأ (مثال) | سلوك المستخدم |
|-----------|-------------|------------------|---------------|
| بيانات غير صالحة | 400 | `ERR_API_VALIDATION_FAILED` | عرض رسالة الحقل الخاطئ |
| مخزون غير كافٍ | 409 | `ERR_STOCK_INSUFFICIENT` | Toast + "المخزون غير كافٍ" |
| تكرار Idempotency | 409 | `ERR_IDEMPOTENCY` | عرض النتيجة السابقة (بدون خلق جديد) |
| تزامن المخزون | 409 | `ERR_CONCURRENT_STOCK_UPDATE` | Toast + زر "أعد المحاولة" (مفتاح جديد) |
| غير مصرح | 403 | `ERR_API_ROLE_FORBIDDEN` | Toast + "غير مصرح بهذه العملية" |
| انتهاء الجلسة | 401 | `ERR_AUTH_SESSION_EXPIRED` | إعادة توجيه لتسجيل الدخول |
| انقطاع الشبكة | — | `ERR_NETWORK` | Toast + "انقطع الاتصال" + زر إعادة |
| خطأ في السيرفر | 500 | `ERR_API_INTERNAL` | Toast + "حاول مجدداً" |

**المرجع الكامل لأكواد الأخطاء:** [16_Error_Codes.md](./16_Error_Codes.md)

---

## 🧪 استراتيجية الاختبار

**اختبار يدوي (MVP):** تنفيذ جميع الـ 23 SOP من [08_SOPs.md](./08_SOPs.md) + اختبار RLS + اختبار تزامن.

**قائمة تحقق ما قبل الإطلاق:**
- [ ] كل SOP يعمل بدون أخطاء
- [ ] المرتجع الكامل والجزئي صحيح
- [ ] تسديد الديون يُحدّث الرصيد
- [ ] اللقطة اليومية دقيقة
- [ ] التسوية تحسب الفرق صحيحاً
- [ ] Realtime يوصل الإشعارات فوراً
- [ ] POS لا يرى شاشات Admin
- [ ] `idempotency_key` يمنع التكرار
- [ ] `ERR_CONCURRENT_STOCK_UPDATE` يظهر عند التزامن
- [ ] تحقق تشغيلي متعدد الأجهزة (هاتف/تابلت/لابتوب) ناجح

---

## 🚀 استراتيجية الإطلاق (Go-Live)

| # | المهمة | التفاصيل | معيار "تم" |
|---|--------|----------|------------|
| 1 | مشروع Supabase إنتاج | مشروع منفصل عن التطوير | البيانات التجريبية غير موجودة |
| 2 | نشر على Vercel | ربط بـ GitHub + env vars | الموقع يفتح على الدومين |
| 3 | جدولة Daily Snapshot | Cron Job الساعة 11:59 مساءً | اللقطة تتولد تلقائياً |
| 4 | النسخ الاحتياطي | Supabase Backup يومي + Google Drive أسبوعي | Backup يعمل |
| 5 | مراقبة Health Check | UptimeRobot يستدعي `/api/health` كل 5 دقائق | التنبيهات تصل |
| 6 | UAT كامل | تنفيذ سيناريوهات [17_UAT_Scenarios.md](./17_UAT_Scenarios.md) | جميعها تمر |
| 7 | تدريب المستخدمين | جلسة عملية لأحمد والموظف | المستخدمون يعملون بشكل مستقل |

---

## 📅 الخطة الزمنية الملخصة (مُحدّثة)

```
Day 1:          المرحلة 0 — البيئة والأمان
 ↓ [Gate: Health Check + Secrets آمنة]

الأسبوع 1-6:   MVP
├── البنية التحتية + DB + RLS
├── المنتجات + Auth
├── POS + الدفع المختلط
├── الفواتير (إلغاء/تعديل)
├── المرتجعات
├── الديون
├── Daily Snapshot
└── تقارير أساسية
 ↓ [Gate: 8 معايير MVP]

الأسبوع 7-9:   V1
├── المشتريات والموردين
├── الشحن والتحويلات
├── الجرد والتسوية
├── الصيانة المنفصلة
├── تقارير محسنة + تصدير Excel
└── UX Improvements
 ↓ [Gate: 7 معايير V1]

الأسبوع 10-15: V2
├── PX-08 المصروفات + الإشعارات
├── PX-09 التواصل وروابط الإيصالات
├── PX-10 الصلاحيات الدقيقة
├── PX-11 التقارير المتقدمة
├── PX-12 النقل والنسخ الاحتياطي
├── PX-13 الأداء والبحث والتنبيهات
└── PX-14 V2 Release Gate

الأسبوع 16: الإطلاق / الاعتماد
├── UAT نهائي
├── تدريب المستخدمين
├── تفعيل العمليات المجدولة النهائية
└── Go-Live 🚀
```

---

## 🔮 المهام المستقبلية لمرحلة التطوير (Future Tasks)

بعد اكتمال بناء هندسة قاعدة البيانات، يتمثل الخط القادم في تجهيز البنية التحتية لتطبيق الويب. وفيما يلي الخطوات المؤجلة للمرحلة القادمة:

1. **تأسيس مشروع Next.js:** إنشاء وتهيئة هيكل المشروع الأساسي (App Router).
2. **إعداد عميل Supabase:** تكوين المتغيرات البيئية وإنشاء نقطة الاتصال مع قاعدة البيانات (تطبيقاً لنموذج `service_role`).
3. **توليد أنواع TypeScript:** استخراج الأنواع محلياً (Database TypeScript Types) لضمان كتابة كود آمن من الأخطاء.
4. **هيكلة مسارات API (API Routes):** بناء نقاط النهاية (Endpoints) المبدئية التي ستتصل بالدوال المحاسبية والتشغيلية في قاعدة البيانات.

---

## 🧱 المرحلة 4: Post-V2 Productization / Hardening

### الهدف
تحويل النظام من `V2` جاهزة وظيفيًا إلى منتج تشغيل تجاري أوضح بصريًا، أكثر صلابة في التفاعل، ومحكوم بشكل أفضل على مستوى الأمن والتشغيل والاعتمادية.

### المدة
3-5 أسابيع

### مبدأ التخطيط في هذه المرحلة

هذه المرحلة لا تعيد فتح المنطق المالي أو authority الأساسية إلا عند الضرورة التصحيحية.
النطاق هنا هو:

- تنظيف الواجهة من المصطلحات الداخلية
- تحسين navigation وIA والهوية البصرية
- تحسين loading/error/confirmation/retry patterns
- رفع accessibility وmetadata والـ mobile ergonomics
- hardening تشغيلي وأمني وبيئي
- سد فجوات الاختبار التي ظهرت في التقارير

### تفكيك تنفيذي جاهز لما بعد `PX-14`

| Phase ID | المحور | المخرجات الأساسية | التبعيات |
|----------|--------|-------------------|----------|
| `PX-15` | User-Facing Cleanup + Product Copy Hygiene | إزالة المصطلحات الداخلية, إخفاء المعرفات التشغيلية, page titles, role landing copy, empty states أوضح | `PX-14` |
| `PX-16` | Navigation + Information Architecture + Role Experience | sidebar/drawer responsive, grouping, breadcrumbs, role-aware home/navigation, تفكيك الشاشات المزدحمة | `PX-15` |
| `PX-17` | Async UX + Feedback + Action Safety | loading skeletons, Suspense fallbacks, persistent errors, retry, confirmation dialogs, login/navigation polish | `PX-15`, `PX-16` |
| `PX-18` | Visual System + Accessibility Refresh | typography/tokens, color system, reusable primitives, table states, focus-visible, dark mode, motion polish | `PX-15`, `PX-16`, `PX-17` |
| `PX-19` | Security / Runtime / Deployment Hardening | security headers, rate limiting, env policy, client lifecycle hardening, cart/runtime hardening, test coverage expansion | `PX-17`, `PX-18` |
| `PX-20` | Productization Release Gate | UX/device/accessibility/security/deployment audit, final Go/No-Go | `PX-15..PX-19` |

### PX-15 — User-Facing Cleanup + Product Copy Hygiene

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-15-T01` | إزالة `PX-*`, `baseline`, `SOP`, وكل المصطلحات التنفيذية من الأسطح المرئية للمستخدم | لا يظهر أي مصطلح داخلي في UI النهائية |
| `PX-15-T02` | إخفاء `idempotency_key` وأي معرفات تشغيلية أو raw admin strings من الواجهات | كل المعرفات التشغيلية تبقى خلف الكواليس فقط |
| `PX-15-T03` | توحيد عناوين الصفحات, metadata, context headers, وlanding copy حسب الدور | كل صفحة تحمل عنوانًا واضحًا وغير تقني |
| `PX-15-T04` | تحسين empty states وrole summaries وcopy الخاصة بالصفحة الرئيسية/الدخول | كل سطح فارغ يقدم next action واضح |
| `PX-15-T05` | proof `no internal terminology leakage` على الهاتف/التابلت/اللابتوب | grep + screenshots + UAT تثبت اختفاء التسريبات |

### PX-16 — Navigation + Information Architecture + Role Experience

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-16-T01` | تحويل navigation إلى sidebar/drawer responsive مع icons وgrouping | الهاتف والتابلت واللابتوب قابلة للاستخدام دون ازدحام |
| `PX-16-T02` | role-aware home/navigation بين `Admin` و`POS` | كل دور يرى surface أنظف وأوضح |
| `PX-16-T03` | إضافة breadcrumbs أو page hierarchy واضحة | المستخدم يعرف أين هو دائمًا |
| `PX-16-T04` | تفكيك الشاشات المزدحمة (`invoices`, `inventory`, `notifications`, `reports`, `settings`) | تقليل الضوضاء وتحسين discoverability |
| `PX-16-T05` | global search placement + mobile IA proof | البحث والتنقل يعملان بوضوح على 360px |

### PX-17 — Async UX + Feedback + Action Safety

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-17-T01` | loading skeletons وSuspense fallbacks للأسطح الحرجة | لا توجد صفحات تبدو فارغة أو "جامدة" عند التحميل |
| `PX-17-T02` | persistent error states + retry patterns + non-silent failures | الخطأ يبقى مفهومًا وقابلًا لإعادة المحاولة |
| `PX-17-T03` | استبدال full reload flows مثل `window.location.assign()` بمسارات App Router صحيحة | transitions أنعم وبدون refresh كامل |
| `PX-17-T04` | confirmation dialogs للأفعال التخريبية أو الحساسة | لا يوجد destructive action بلا تأكيد واضح |
| `PX-17-T05` | pending/optimistic decision pass للعمليات الآمنة + offline/error banners | feedback واضح أثناء التنفيذ والانقطاع |

### PX-18 — Visual System + Accessibility Refresh

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-18-T01` | typography حديثة + design tokens + spacing/shadows/radii | هوية بصرية موحدة على كل الشاشات |
| `PX-18-T02` | reusable component primitives + table/list/form states | الاتساق البصري والسلوكي يصبح واضحًا |
| `PX-18-T03` | home/login/POS/report visual refresh + visual hierarchy | الأسطح الأساسية لم تعد developer-facing شكليًا |
| `PX-18-T04` | accessibility pass (`focus-visible`, labels, keyboard, touch targets) | اجتياز accessibility/device UAT |
| `PX-18-T05` | dark mode + micro-interactions + motion policy | المظهر والتفاعل متسقان ومتحكمان |

### PX-19 — Security / Runtime / Deployment Hardening

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-19-T01` | dependency/runtime policy (`Next`, `React`, `xlsx`, build compatibility) | سياسة تحديث واعتماد واضحة ومختبرة |
| `PX-19-T02` | security headers + rate limiting + internal error sanitization | hardening فعلي دون privacy leakage |
| `PX-19-T03` | env/deployment policy (`CRON_SECRET`, Supabase env, cross-env compatibility, Replit/Babel decision`) | البيئة لا تعطل المنتج بصمت |
| `PX-19-T04` | request/client/cart/runtime hardening | idempotency bootstrap, stale stock, rounding, client reuse, route strictness |
| `PX-19-T05` | توسيع test coverage (workspace components + formatters + cross-env/browser verification) | gaps الاختبارية الحرجة مغلقة |

### PX-20 — Productization Release Gate

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-20-T01` | UX/content/navigation UAT | user-facing productization scenarios = Pass |
| `PX-20-T02` | accessibility/device/visual audit | لا regressions على الهاتف/التابلت/اللابتوب + a11y pass |
| `PX-20-T03` | security/runtime/deployment audit | لا `P0/P1` مفتوح في hardening track |
| `PX-20-T04` | قرار `Go/No-Go` لما بعد V2 | قرار موثق بالأدلة |

### إضافات لازمة اكتُشفت أثناء التطبيع

هذه البنود لم تكن موجودة كمرحلة مستقلة في الخطة السابقة، لكنها أصبحت ضرورية بعد دمج التقارير الثلاثة:

1. **فصل Track المنتج/UX عن Track البيئة والتشغيل**
   - لأن غياب env vars أو مشاكل Replit لا يجب أن يختلط مع مشاكل التصميم والتنقل.

2. **تنظيف affordances غير المنفذة قبل تحسين الشكل**
   - مثل barcode affordance في POS أو أي surface توحي بقدرة غير موجودة.

3. **إضافة Layer صريح لسلامة التفاعل**
   - loading, pending, retry, confirmation, persistent errors.

4. **تعريف Productization كمرحلة مستقلة بعد V2**
   - حتى لا تبقى V2 "مكتملة وظيفيًا" بينما الواجهة والصلابة التشغيلية دون المستوى التجاري.

### معيار اكتمال ما بعد V2

```
✅ كل ما في V2 +
   - لا مصطلحات داخلية أو معرفات تشغيلية مكشوفة للمستخدم
   - navigation وIA تعمل بوضوح على الهاتف/التابلت/اللابتوب
   - loading/error/confirmation patterns مكتملة
   - visual system موحد + accessibility مجتازة
   - hardening الأمني والتشغيلي والبيئي مكتمل
   - test coverage ارتفعت في طبقة الـ UI/runtime
   - `PX-20` = `Go`
```

---

## 🧭 المرحلة 5: Frontend Redesign / Experience Consolidation

**المدة التقديرية:** `4-6 أسابيع`

هذه المرحلة لا تضيف features business جديدة، بل تعيد تنظيم تجربة الواجهة بالكامل على مستوى:
- shell/navigation
- transactional UX
- operational IA
- analytical/configuration readability
- device/RTL/accessibility polish

**المبدأ الحاكم:** Frontend-only.
ممنوع تعديل:
- backend logic
- APIs
- authentication flow
- database structure
- business logic
- permissions model
- operational rules

**الهدف:** تحويل النظام من واجهة وظيفية ناجحة إلى تجربة منتج متماسكة، سريعة، عربية RTL أصلية، وقابلة للاستخدام التجاري اليومي على الهاتف والتابلت واللابتوب.

### توزيع المراحل

| Phase | الاسم | التركيز | Outcome |
|------|------|---------|---------|
| `PX-21` | UI Foundation + Shell + Auth Entry | visual direction + shell + login/home + shared patterns | قاعدة تصميمية موحدة ونقطة دخول احترافية |
| `PX-22` | Transactional UX | POS + cart + checkout + invoice/debt transactional clarity | سرعة ووضوح الأسطح البيعية عالية التكرار |
| `PX-23` | Operational Workspaces | notifications + products + inventory + suppliers + expenses + operations + maintenance | أسطح تشغيلية structured وmaster-detail friendly |
| `PX-24` | Analytical + Configuration Surfaces | reports + settings + permissions + portability | أسطح تحليل/إعدادات calmer وأوضح وأكثر أمانًا |
| `PX-25` | Frontend UX Release Gate | device/RTL/a11y/consistency/non-regression | قرار جاهزية الواجهة للإغلاق النهائي |

**ملاحظة تنفيذية رسمية**
- ابتداءً من `PX-22` وحتى `PX-25` تعتمد هذه الموجة `Lean Execution Mode` لأنها Frontend-only.
- هذا لا يلغي:
  - `Phase Contract`
  - independent review
  - `Phase Execution/Review/Close`
  - full verification قبل الإغلاق
- لكنه يقلل التكرار الإداري في تغليف كل task فرعية ما دامت لا تمس backend/auth/business/security-sensitive logic.

### PX-21 — UI Foundation + Shell + Auth Entry

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-21-T01` | visual direction + brand tokens + typography hierarchy | design tokens ثابتة + palette مقيدة + hierarchy موحدة |
| `PX-21-T02` | dashboard shell + grouped navigation + breadcrumbs | shell RTL أصلية + sidebar/drawer واضحة role-aware |
| `PX-21-T03` | reusable page header + section card + KPI/stat primitives | patterns قابلة لإعادة الاستخدام عبر الأسطح |
| `PX-21-T04` | homepage + login refresh | نقطة دخول product-facing بدون technical clutter |
| `PX-21-T05` | RTL interaction rules + responsive shell proof | shell تعمل بوضوح على desktop/tablet/mobile |

### PX-22 — Transactional UX

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-22-T01` | POS browsing speed + category rail + search prominence | إضافة المنتجات وتعديلها والبحث عنها أسرع وأوضح |
| `PX-22-T02` | cart panel + totals hierarchy + checkout emphasis | cart sticky/persistent وcheckout CTA مهيمنة |
| `PX-22-T03` | invoice detail/action grouping | receipt/return/cancel actions أوضح وأقل ازدحامًا |
| `PX-22-T04` | debts payment clarity + customer summary | debt payment flow واضح وآمن وسهل المسح بصريًا |
| `PX-22-T05` | transactional device ergonomics | touch targets وstate visibility مناسبة لبيئة POS |

### PX-23 — Operational Workspaces

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-23-T01` | notifications inbox + alerts + search structure | الإشعارات والنتائج والتنبيهات مفصولة وواضحة |
| `PX-23-T02` | products catalog/admin usability | catalog قابلة للتصفح والإدارة بدون فوضى |
| `PX-23-T03` | inventory + suppliers + purchases master-detail patterns | الأسطح التشغيلية أقل تكدسًا وأكثر عملية |
| `PX-23-T04` | expenses + operations + maintenance restructuring | workflows التشغيلية grouped وسريعة القراءة |
| `PX-23-T05` | operational list/table system | tables/lists scannable وتتحول جيدًا على mobile |

### PX-24 — Analytical + Configuration Surfaces

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-24-T01` | reports filter-first redesign | KPIs/charts/comparisons أوضح وأقل ضوضاء |
| `PX-24-T02` | advanced charts/table storytelling | الأسطح التحليلية insight-driven بدل flat density |
| `PX-24-T03` | settings grouping + risk-aware layout | الإعدادات أوضح وأقل رهبة وأكثر أمانًا |
| `PX-24-T04` | permissions + portability clarity | configuration surfaces understandable مع progressive disclosure |
| `PX-24-T05` | analytical/configuration responsive proof | surfaces التحليلية والإعدادية تعمل جيدًا عبر الأجهزة |

### PX-25 — Frontend UX Release Gate

| المهمة | التفاصيل | معيار "تم" |
|--------|----------|------------|
| `PX-25-T01` | UX/content/navigation/device walkthrough | walkthrough كامل Pass بدون technical leakage |
| `PX-25-T02` | RTL/accessibility/visual consistency audit | RTL/a11y/visual rhythm = Pass |
| `PX-25-T03` | frontend performance/non-regression audit | لا regressions UX أو device blockers مفتوحة |
| `PX-25-T04` | final `Go/No-Go` decision | قرار موثق لإغلاق موجة Frontend Redesign |

### إضافات لازمة اكتُشفت أثناء التطبيع

1. **فصل Frontend Redesign عن Productization Gate القديمة**
   - لأن `PX-15 .. PX-20` عالجت productization baseline، بينما هذه الموجة تعالج redesign أوسع وأكثر توجيهًا بصريًا.

2. **تعريف فئات surfaces صراحة**
   - `Transactional`
   - `Operational`
   - `Analytical`
   - `Configuration`
   - حتى لا تُعامل جميع الشاشات بنفس منطق الكثافة والـ CTA hierarchy.

3. **الاعتراف بالسياق التشغيلي الحقيقي**
   - tablet في بيئة متجر
   - mobile للوصول السريع
   - desktop للمهام الإدارية والتحليلية
   - installable/PWA كسياق استخدام فعلي

4. **اعتبار design system مخرجًا مرحليًا بحد ذاته**
   - لا مجرد polish لاحق.

### معيار اكتمال Frontend Redesign

```
✅ كل ما في `PX-21 .. PX-25` +
   - shell RTL واضحة ومقسمة حسب workflow والدور
   - POS أسرع وأكثر وضوحًا وأفضل لمسًا
   - الأسطح التشغيلية أقل تكدسًا وأكثر تنظيمًا
   - التقارير والإعدادات calmer وأكثر قابلية للفهم
   - patterns المشتركة موحدة: headers / cards / tables / forms / states
   - device ergonomics + installable behavior + a11y = Pass
   - لا regression في workflows الحالية
   - `PX-25` = `Go`
```
