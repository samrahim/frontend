import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function printInvoice(invoices: any[]) {
  // Guard clause against empty arrays
  if (!invoices || invoices.length === 0) return;

  // Since student, cashier, and dates are typically identical for a single payment transaction,
  // we pull them safely from the first item in the list.
  const referenceInvoice = invoices[0];
  console.log("Printing invoice for:", referenceInvoice);

  const cashierName = referenceInvoice.cashierName || "N/A";

  const doc = new jsPDF();

  // Header Company Info
  doc.setFontSize(20);
  doc.text("Noor Quran School", 14, 18);

  doc.setFontSize(11);
  doc.text("Payment Receipt", 160, 18);

  // Metadata Block
  doc.setFontSize(10);
  doc.text(`Student: ${referenceInvoice.studentName || "N/A"}`, 14, 32);
  doc.text(`Cashier: ${cashierName}`, 14, 39);
  doc.text(`Payment Date: ${referenceInvoice.paidDate || "N/A"}`, 14, 46);

  doc.text(`Status: ${referenceInvoice.status || "PAID"}`, 120, 32);

  // Prepare table rows dynamically from the list of paid invoices
  let totalAmountPaid = 0;

  const tableBody = invoices.map((invoice) => {
    const due = parseFloat(invoice.amountDue?.toString() || "0");
    const paid = parseFloat(invoice.amountPaid?.toString() || "0");
    totalAmountPaid += paid;

    return [
      `Group: ${invoice.group || "N/A"} (Invoice ref: ${invoice.id || "N/A"})`,
      `${due.toFixed(2)}`,
      `${paid.toFixed(2)}`,
    ];
  });

  // Append a neat overall total row at the very bottom of the table body
  tableBody.push(["TOTAL PAID AMOUNT", "", `${totalAmountPaid.toFixed(2)}`]);

  // Table Generation
  autoTable(doc, {
    startY: 55,
    head: [["Description / Group", "Amount Due", "Amount Paid"]],
    body: tableBody,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] }, // Nice clean blue header accent
    didParseCell: (data) => {
      // Bold our summary row at the very bottom
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Convert PDF stream cleanly into blob and push to printer context
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    }, 200);
  };
}

export function printWithDraw() { }
