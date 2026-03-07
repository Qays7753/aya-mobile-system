# آية موبايل - سياسة الأجهزة والمتصفحات
## 29) Device & Browser Policy (Authoritative)

---

## الهدف

مصدر مرجعي واحد (Single Source of Truth) لعقد التشغيل على الأجهزة والمتصفحات قبل البناء.

---

## العقد المعتمد

### 1) الأجهزة المسموحة

| الجهاز | الدعم |
|--------|-------|
| الهاتف | مدعوم |
| التابلت | مدعوم |
| اللابتوب | مدعوم |
| الديسكتوب | مدعوم |

### 2) المتصفحات المسموحة

| المتصفح | الدعم |
|---------|-------|
| Chrome | مدعوم بالكامل |
| Edge | مدعوم بالكامل |
| Safari | مدعوم للوظائف الأساسية |
| Firefox | مدعوم للوظائف الأساسية |

> معيار القبول: آخر إصدارين رئيسيين (Latest-2).

### 3) التثبيت على الجهاز (Installability / PWA)

- **ضمن النطاق** في MVP.
- التثبيت يعتمد على قدرات المتصفح/النظام (A2HS / Install App).
- التثبيت لا يغيّر أي صلاحيات أو منطق أمني.
- النظام يبقى **Online-only** (لا معاملات Offline).

### 4) حدود الواجهة Responsive

- الحد الأدنى للتشغيل: `360px` عرض فعّال.
- نقاط مرجعية: `360 / 768 / 1024`.
- شاشات POS: Touch-first.
- شاشات Admin: Keyboard + Mouse friendly.

---

## سياسة التوافق (Regression Rule)

يُعتبر Regression أي نص توثيقي جديد يحصر النظام في:
- Chrome-only.
- Tablet/Desktop only.
- إلغاء installability من نطاق MVP.

---

## الملفات الملزمة بالتوافق

- [01_Overview_Assumptions.md](./01_Overview_Assumptions.md)
- [11_Design_UX_Guidelines.md](./11_Design_UX_Guidelines.md)
- [13_Tech_Config.md](./13_Tech_Config.md)
- [22_Operations_Guide.md](./22_Operations_Guide.md)
- [README.md](./README.md)

---

**الإصدار:** 1.0  
**تاريخ التحديث:** 5 مارس 2026  
**الحالة:** Authoritative
