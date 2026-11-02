export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openPrintWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return; // popup blocked — fail quietly, nothing else we can do here
  const language = document.documentElement.lang === "ar" ? "ar" : "en";
  const direction = language === "ar" ? "rtl" : "ltr";
  win.document.write(`<!doctype html>
<html lang="${language}" dir="${direction}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #1F2A24; padding: 40px; text-align: start; }
      .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; margin-bottom: 28px; }
      .brand .mark { width: 11px; height: 11px; background: #0F6E56; transform: rotate(45deg); display: inline-block; }
      h1 { font-size: 19px; margin: 0 0 4px; }
      .muted { color: #5B6B63; font-size: 13px; margin: 0 0 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th, td { text-align: start; padding: 9px 10px; border-bottom: 1px solid #E4E7E2; font-size: 13px; }
      th { color: #5B6B63; font-weight: 600; }
      .totals { margin-top: 16px; font-size: 14px; max-width: 280px; margin-inline-start: auto; }
      .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
      .totals .row.total { border-top: 1px solid #1F2A24; font-weight: 700; margin-top: 4px; padding-top: 10px; }
      .footer-note { margin-top: 40px; font-size: 11px; color: #8A968F; }
      @media print {
        body { padding: 20px; }
      }
    </style>
  </head>
  <body>
    <div class="brand"><span class="mark"></span> ${language === "ar" ? "عيادات دايموند للأسنان" : "Diamond Dental Clinic"}</div>
    ${bodyHtml}
    <p class="footer-note">${language === "ar" ? "تاريخ الطباعة" : "Printed"} ${new Date().toLocaleString(language === "ar" ? "ar-EG" : "en-US")}</p>
  </body>
</html>`);
  win.document.close();
  win.focus();
  // give the new document a moment to paint before invoking print()
  setTimeout(() => win.print(), 300);
}

export function printInvoice(invoice, patient) {
  const isArabic = document.documentElement.lang === "ar";
  const numberFormat = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const balance = Number(invoice.total_amount) - Number(invoice.paid_amount);
  const rows = (invoice.items || [])
    .map(
      (it) => `<tr>
        <td>${escapeHtml(it.description)}</td>
        <td>${it.quantity}</td>
        <td>${numberFormat.format(Number(it.unit_price))}</td>
        <td>${numberFormat.format(Number(it.amount))}</td>
      </tr>`
    )
    .join("");

  const html = `
    <h1>${isArabic ? "فاتورة" : "Invoice"} ${escapeHtml(invoice.invoice_number)}</h1>
    <p class="muted">${escapeHtml(patient?.full_name)} · ${escapeHtml(patient?.phone)}${
      patient?.national_id ? " · " + escapeHtml(patient.national_id) : ""
    }</p>
    <table>
      <thead><tr><th>${isArabic ? "الوصف" : "Description"}</th><th>${isArabic ? "الكمية" : "Qty"}</th><th>${isArabic ? "سعر الوحدة" : "Unit price"}</th><th>${isArabic ? "المبلغ" : "Amount"}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="row"><span>${isArabic ? "الإجمالي" : "Total"}</span><span>${numberFormat.format(Number(invoice.total_amount))}</span></div>
      <div class="row"><span>${isArabic ? "المدفوع" : "Paid"}</span><span>${numberFormat.format(Number(invoice.paid_amount))}</span></div>
      <div class="row total"><span>${isArabic ? "الرصيد المستحق" : "Balance due"}</span><span>${numberFormat.format(balance)}</span></div>
    </div>`;

  openPrintWindow(`${isArabic ? "فاتورة" : "Invoice"} ${invoice.invoice_number}`, html);
}

export function printPrescription(visit, patient, prescription) {
  const isArabic = document.documentElement.lang === "ar";
  const visitDate = new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", { calendar: "gregory", dateStyle: "medium" })
    .format(new Date(`${visit.visit_date}T12:00:00`));
  const rows = (prescription.items || [])
    .map(
      (it) => `<tr>
        <td>${escapeHtml(it.medicine_name)}</td>
        <td>${escapeHtml(it.dosage)}</td>
        <td>${escapeHtml(it.frequency)}</td>
        <td>${escapeHtml(it.duration)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <h1>${isArabic ? "وصفة طبية" : "Prescription"}</h1>
    <p class="muted">
      ${escapeHtml(patient?.full_name)} · ${escapeHtml(visitDate)} ·
      ${isArabic ? "د." : "Dr."} ${escapeHtml(visit.doctor?.user?.full_name)}
    </p>
    <table>
      <thead><tr><th>${isArabic ? "الدواء" : "Medicine"}</th><th>${isArabic ? "الجرعة" : "Dosage"}</th><th>${isArabic ? "التكرار" : "Frequency"}</th><th>${isArabic ? "المدة" : "Duration"}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

  openPrintWindow(isArabic ? "وصفة طبية" : "Prescription", html);
}
