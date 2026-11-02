import { cloneElement, createContext, isValidElement, useContext, useEffect, useMemo, useState } from "react";

const LocaleContext = createContext(null);
let activeLanguage = typeof localStorage === "undefined" ? "en" : localStorage.getItem("diamond_language") || "en";

const AR = {
  "Diamond Clinic": "عيادات دايموند",
  "Dental clinic management": "إدارة عيادة الأسنان",
  "Patients": "المرضى",
  "Appointments": "المواعيد",
  "Reports": "التقارير",
  "Users": "المستخدمون",
  "Users & roles": "المستخدمون والأدوار",
  "Dashboard": "لوحة التحكم",
  "Receptionist dashboard": "لوحة تحكم موظف الاستقبال",
  "Appointments today": "مواعيد اليوم",
  "Today's appointments": "مواعيد اليوم",
  "Patient services": "خدمات المرضى",
  "Open patients": "فتح قائمة المرضى",
  "Open calendar": "فتح التقويم",
  "No appointments for this day": "لا توجد مواعيد في هذا اليوم",
  "Could not load today's appointments.": "تعذّر تحميل مواعيد اليوم.",
  "Primary navigation": "التنقل الرئيسي",
  "Switch language to English": "التبديل إلى الإنجليزية",
  "Create account": "إنشاء حساب",
  "Create an account": "إنشاء حساب جديد",
  "Creating account…": "جارٍ إنشاء الحساب…",
  "Already have an account?": "لديك حساب بالفعل؟",
  "Don't have an account?": "ليس لديك حساب؟",
  "Your full name": "أدخل اسمك الكامل",
  "Show password": "إظهار كلمة المرور",
  "Hide password": "إخفاء كلمة المرور",
  "Account created. Your account is pending administrator approval.": "تم إنشاء الحساب. ينتظر حسابك موافقة المدير قبل التمكن من تسجيل الدخول.",
  "Could not create account. Please try again.": "تعذّر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
  "The email has already been taken.": "هذا البريد الإلكتروني مستخدم بالفعل.",
  "The full_name field is required.": "الاسم مطلوب.",
  "The email field is required.": "البريد الإلكتروني مطلوب.",
  "The email field must be a valid email address.": "يرجى إدخال عنوان بريد إلكتروني صالح.",
  "The password field is required.": "كلمة المرور مطلوبة.",
  "The password field must be at least 8 characters.": "يجب ألا تقل كلمة المرور عن 8 أحرف.",
  "This account has been deactivated.": "تم تعطيل هذا الحساب.",
  "Previous month": "الشهر السابق",
  "Next month": "الشهر التالي",
  "Sun": "الأحد",
  "Mon": "الاثنين",
  "Tue": "الثلاثاء",
  "Wed": "الأربعاء",
  "Thu": "الخميس",
  "Fri": "الجمعة",
  "Sat": "السبت",
  "Tooth number (FDI notation, 11–48)": "رقم السن (ترقيم FDI من 11 إلى 48)",
  "— select —": "— اختر —",
  "No national ID on file": "لا يوجد رقم هوية مسجل",
  "no national ID on file": "لا يوجد رقم هوية مسجل",
  "Policy": "وثيقة",
  "covers": "تغطي",
  "valid until": "صالحة حتى",
  "session(s)": "جلسات",
  "estimated": "التكلفة التقديرية",
  "more": "مواعيد إضافية",
  "Dr.": "د.",
  "Close": "إغلاق",
  "Save": "حفظ",
  "Invoice total ": "إجمالي الفاتورة ",
  "This doctor already has an appointment in that time slot.": "لدى الطبيب موعد آخر في هذه الفترة الزمنية.",
  "Male": "ذكر",
  "Female": "أنثى",
  "e.g. type 2 diabetes, hypertension": "مثال: داء السكري من النوع الثاني، ارتفاع ضغط الدم",
  "e.g. penicillin": "مثال: البنسلين",
  "e.g. Full mouth restoration": "مثال: إعادة تأهيل الفم بالكامل",
  "Tooth #": "رقم السن",
  "Cost": "التكلفة",
  "Description": "الوصف",
  "Qty": "الكمية",
  "Unit price": "سعر الوحدة",
  "Account is active": "الحساب نشط",
  "+ Add prescription": "+ إضافة وصفة طبية",
  "+ line": "+ إضافة بند",
  "+ procedure": "+ إضافة إجراء",
  "+ line item": "+ إضافة بند فاتورة",
  "Amount (balance due: ": "المبلغ (الرصيد المستحق: ",
  "The company/patient split is calculated from the policy's coverage percentage.": "يُحسب توزيع المبلغ بين الشركة والمريض وفقًا لنسبة تغطية الوثيقة.",
  "Create invoice": "إنشاء الفاتورة",
  "Add record": "إضافة السجل",
  "Log out": "تسجيل الخروج",
  "Hide navigation": "إخفاء القائمة",
  "Show navigation": "إظهار القائمة",
  "Close navigation": "إغلاق القائمة",
  "Sign in": "تسجيل الدخول",
  "Email": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Loading…": "جارٍ التحميل…",
  "Incorrect email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "Signing in…": "جارٍ تسجيل الدخول…",
  "Search, register, and open patient files": "ابحث عن المرضى وسجّلهم وافتح ملفاتهم",
  "New patient": "مريض جديد",
  "Register a patient": "تسجيل مريض",
  "Search by name, phone, or national ID": "ابحث بالاسم أو الهاتف أو رقم الهوية",
  "Name": "الاسم",
  "Phone": "الهاتف",
  "Gender": "الجنس",
  "Status": "الحالة",
  "No patients yet": "لا يوجد مرضى بعد",
  "Register your first patient to start building their dental record.": "سجّل أول مريض لبدء إنشاء ملفه الطبي.",
  "Showing": "عرض",
  "of": "من",
  "Prev": "السابق",
  "Next": "التالي",
  "Page": "الصفحة",
  "Register a new patient": "تسجيل مريض جديد",
  "Full name": "الاسم الكامل",
  "National ID": "رقم الهوية",
  "Date of birth": "تاريخ الميلاد",
  "Address": "العنوان",
  "Cancel": "إلغاء",
  "Saving…": "جارٍ الحفظ…",
  "Register patient": "تسجيل المريض",
  "Schedule across all doctors": "جدولة مواعيد جميع الأطباء",
  "Book appointment": "حجز موعد",
  "Book an appointment": "حجز موعد",
  "Date": "التاريخ",
  "Month": "الشهر",
  "Day": "اليوم",
  "Book the first appointment for this date.": "احجز أول موعد لهذا التاريخ.",
  "Time": "الوقت",
  "Patient": "المريض",
  "Doctor": "الطبيب",
  "pending": "قيد الانتظار",
  "confirmed": "مؤكد",
  "cancelled": "ملغى",
  "attended": "تمت الزيارة",
  "New appointment": "موعد جديد",
  "Search by name or phone…": "ابحث بالاسم أو الهاتف…",
  "Change": "تغيير",
  "Start": "البداية",
  "End": "النهاية",
  "Notes": "ملاحظات",
  "Could not book this appointment.": "تعذّر حجز هذا الموعد.",
  "Select a patient first.": "يرجى اختيار مريض أولاً.",
  "Booking…": "جارٍ الحجز…",
  "Revenue, collections, and patient demand": "الإيرادات والتحصيل واحتياجات المرضى",
  "Outstanding balance": "الرصيد المستحق",
  "New patients (last 30 days)": "مرضى جدد (آخر 30 يومًا)",
  "Most visited doctor": "الطبيب الأكثر زيارة",
  "Revenue collected": "الإيرادات المحصّلة",
  "Daily": "يومي",
  "Monthly": "شهري",
  "Yearly": "سنوي",
  "Doctors by visit volume": "الأطباء حسب عدد الزيارات",
  "No visit data in this range yet.": "لا توجد بيانات زيارات في هذه الفترة.",
  "Manage staff accounts and what each role can access": "إدارة حسابات الموظفين وصلاحيات الأدوار",
  "New user": "مستخدم جديد",
  "Role": "الدور",
  "inactive": "غير نشط",
  "active": "نشط",
  "archived": "مؤرشف",
  "No users yet": "لا يوجد مستخدمون بعد",
  "Edit": "تعديل",
  "Edit ": "تعديل ",
  "Create a user": "إنشاء مستخدم",
  "Temporary password": "كلمة مرور مؤقتة",
  "Specialty": "التخصص",
  "License number": "رقم الترخيص",
  "Create user": "إنشاء المستخدم",
  "Creating…": "جارٍ الإنشاء…",
  "Save changes": "حفظ التغييرات",
  "View-only clinical records": "السجلات السريرية للعرض فقط",
  "Overview & history": "نظرة عامة والسجل",
  "Dental chart": "مخطط الأسنان",
  "Treatment & visits": "العلاج والزيارات",
  "Treatment plans": "خطط العلاج",
  "Billing & insurance": "الفوترة والتأمين",
  "Medical history": "التاريخ الطبي",
  "Chronic diseases": "الأمراض المزمنة",
  "Drug allergies": "الحساسية الدوائية",
  "Previous surgeries": "العمليات السابقة",
  "Save medical history": "حفظ التاريخ الطبي",
  "Edit patient": "تعديل بيانات المريض",
  "Archive": "أرشفة",
  "Reactivate": "إعادة التفعيل",
  "Add tooth record": "إضافة سجل سن",
  "Tooth": "السن",
  "Condition": "الحالة",
  "Procedure": "الإجراء",
  "No dental chart entries yet": "لا توجد سجلات لمخطط الأسنان",
  "Add the first tooth record for this patient.": "أضف أول سجل سن لهذا المريض.",
  "No treatment plans yet": "لا توجد خطط علاج بعد",
  "New treatment plan": "خطة علاج جديدة",
  "No visits logged yet": "لم يتم تسجيل زيارات بعد",
  "Visits & prescriptions": "الزيارات والوصفات الطبية",
  "Log a visit": "تسجيل زيارة",
  "X-rays & photos": "الأشعة والصور",
  "No files uploaded yet.": "لم يتم رفع ملفات بعد.",
  "Diagnosis:": "التشخيص:",
  "Diagnosis": "التشخيص",
  "Print": "طباعة",
  "Open full size": "فتح بالحجم الكامل",
  "View": "عرض",
  "File": "الملف",
  "Type": "النوع",
  "X-ray": "أشعة سينية",
  "Photo": "صورة",
  "Document": "مستند",
  "Choose a file first.": "يرجى اختيار ملف أولاً.",
  "Upload failed.": "فشل رفع الملف.",
  "Uploading…": "جارٍ الرفع…",
  "Upload": "رفع",
  "Medicine": "الدواء",
  "Dosage": "الجرعة",
  "Frequency": "التكرار",
  "Duration": "المدة",
  "Save prescription": "حفظ الوصفة الطبية",
  "Title": "العنوان",
  "Procedures": "الإجراءات",
  "Create plan": "إنشاء الخطة",
  "Symptoms": "الأعراض",
  "Visit date": "تاريخ الزيارة",
  "Procedure performed": "الإجراء المنفذ",
  "Recommendations": "التوصيات",
  "Save visit": "حفظ الزيارة",
  "Invoices & payments": "الفواتير والمدفوعات",
  "New invoice": "فاتورة جديدة",
  "No invoices yet": "لا توجد فواتير بعد",
  "Generate an invoice once a procedure has been performed.": "أنشئ فاتورة بعد تنفيذ الإجراء.",
  "Insurance": "التأمين",
  "No insurance linked": "لا يوجد تأمين مرتبط",
  "Link a policy so invoices can be claimed against it.": "اربط وثيقة تأمين لتقديم مطالبات الفواتير.",
  "Link insurance policy": "ربط وثيقة تأمين",
  "Insurance company": "شركة التأمين",
  "Policy number": "رقم الوثيقة",
  "Coverage percentage": "نسبة التغطية",
  "Valid until": "صالحة حتى",
  "Link policy": "ربط الوثيقة",
  "Linking…": "جارٍ الربط…",
  "Record payment": "تسجيل دفعة",
  "Submit claim": "تقديم مطالبة",
  "Invoice": "الفاتورة",
  "Total": "الإجمالي",
  "Paid": "المدفوع",
  "Balance": "المتبقي",
  "Balance due": "الرصيد المستحق",
  "Insurance claim:": "مطالبة التأمين:",
  "company": "الشركة",
  "patient": "المريض",
  "Insurance policy": "وثيقة التأمين",
  "Payment method": "طريقة الدفع",
  "Amount": "المبلغ",
  "Cash": "نقدًا",
  "Card": "بطاقة",
  "Installment": "تقسيط",
  "Record payment — ": "تسجيل دفعة — ",
  "Submit insurance claim — ": "تقديم مطالبة تأمين — ",
  "Submitting…": "جارٍ الإرسال…",
  "Recording…": "جارٍ التسجيل…",
  "Link insurance": "ربط التأمين",
  "Receptionist": "موظف الاستقبال",
  "Administrator": "مدير النظام",
  "administrator": "مدير النظام",
  "admin": "مدير النظام",
  "doctor": "طبيب",
  "receptionist": "موظف الاستقبال",
  "male": "ذكر",
  "female": "أنثى",
  "proposed": "مقترحة",
  "accepted": "مقبولة",
  "in_progress": "قيد التنفيذ",
  "completed": "مكتملة",
  "paid": "مدفوعة",
  "unpaid": "غير مدفوعة",
  "partially_paid": "مدفوعة جزئيًا",
  "approved": "موافق عليها",
  "rejected": "مرفوضة",
  "healthy": "سليم",
  "decayed": "متسوس",
  "filled": "محشو",
  "missing": "مفقود",
  "crowned": "مغطى بتاج",
  "implant": "زرعة",
  "filling": "حشوة",
  "root_canal": "علاج عصب",
  "extraction": "خلع",
  "crown": "تاج",
  "cleaning": "تنظيف",
  "other": "أخرى",
  "planned": "مخطط",
  "open": "مفتوح",
  "closed": "مغلق",
  "Dashboard is available to reception staff only.": "لوحة التحكم متاحة لموظفي الاستقبال فقط.",
};

function translate(value, language) {
  if (language !== "ar" || typeof value !== "string") return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const key = value.trim();
  const direct = AR[key];
  if (direct) return direct;

  for (const [english, arabic] of Object.entries(AR)) {
    if (english.endsWith(" ") && key.startsWith(english)) {
      return `${leading}${arabic}${key.slice(english.length)}${trailing}`;
    }
  }
  return value;
}

const TRANSLATABLE_PROPS = [
  "alt", "aria-label", "description", "label", "placeholder", "subtitle", "title",
];

export function localizeNode(node, t) {
  if (typeof node === "string") return t(node);
  if (typeof node === "number" && activeLanguage === "ar") {
    return new Intl.NumberFormat("ar-EG").format(node);
  }
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, t));
  if (!isValidElement(node)) return node;

  const props = { ...node.props };
  props.children = localizeNode(props.children, t);
  for (const prop of TRANSLATABLE_PROPS) {
    if (typeof props[prop] === "string") props[prop] = t(props[prop]);
  }
  return cloneElement(node, props);
}

export function Localized({ children }) {
  const { t } = useLocale();
  return localizeNode(children, t);
}

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    activeLanguage = localStorage.getItem("diamond_language") || "en";
    return activeLanguage;
  });

  useEffect(() => {
    activeLanguage = language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = language;
    localStorage.setItem("diamond_language", language);
  }, [language]);

  const value = useMemo(() => ({
    language,
    direction: language === "ar" ? "rtl" : "ltr",
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar"),
    t: (text) => translate(text, language),
    formatNumber: (number, options) => new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", options).format(number),
    formatDate: (date, options) => formatLocaleDate(date, options),
  }), [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function formatLocaleNumber(value, options = {}) {
  const locale = activeLanguage === "ar" ? "ar-EG" : "en-US";
  return new Intl.NumberFormat(locale, options).format(Number(value));
}

export function formatLocaleDate(value, options = { dateStyle: "medium" }) {
  const locale = activeLanguage === "ar" ? "ar-EG" : "en-US";
  const date = value instanceof Date
    ? value
    : /^\d{4}-\d{2}-\d{2}$/.test(String(value))
      ? new Date(`${value}T12:00:00`)
      : new Date(value);
  return new Intl.DateTimeFormat(locale, { calendar: "gregory", ...options }).format(date);
}

export function formatLocaleTime(value) {
  if (!value) return "";
  const [hours, minutes] = String(value || "").split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat(activeLanguage === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
