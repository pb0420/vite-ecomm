import jsPDF from 'jspdf';

// Utility to generate a bill PDF for an order
// Accepts: order object, bill object (optional), logoUrl (string)
// Returns: jsPDF instance
export function generateBillPDF({ order, bill, logoUrl }) {
  const doc = new jsPDF();

  // Add logo (rectangular, top left)
  if (logoUrl) {
    doc.addImage(logoUrl, 'WEBP', 15, 10, 50, 18); // wider rectangle
    doc.setFontSize(10);
    doc.text('ABN 257 558 402 06', 15, 30); // ABN below logo
  }

  doc.setFontSize(18);
  doc.text('Order Bill', 15, 42);
  doc.setFontSize(12);
  doc.text(`Order ID: ${order.id.slice(0, 6).toUpperCase()}`, 15, 52);
  doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 15, 60);
  doc.text(`Customer: ${order.customer_name || order.customer || ''}`, 15, 68);
  doc.text(`Address: ${order.customer_address || order.delivery_address || ''}`, 15, 76);

  // Bill details
  let y = 86;
  doc.setFontSize(14);
  doc.text('Items:', 15, y);
  y += 8;
  doc.setFontSize(12);
  (order.items || bill?.items || []).forEach((item, idx) => {
    doc.text(`${item.name} x${item.quantity} - ${item.price} each`, 20, y);
    y += 7;
  });

  // Fees
  if (order.fees_data) {
    y += 5;
    doc.text(`Delivery Fee: ${order.fees_data.delivery_fee || order.fees_data.deliveryFee || 0}`, 20, y);
    y += 7;
    doc.text(`Service Fee: ${order.fees_data.service_fee || order.fees_data.serviceFee || 0}`, 20, y);
    y += 7;
  }

  // Total
  y += 5;
  doc.setFontSize(14);
  doc.text(`Total: ${order.total || bill?.total || ''}`, 15, y);

  // Bill ID if present
  if (bill?.id) {
    y += 10;
    doc.setFontSize(10);
    doc.text(`Bill ID: ${bill.id}`, 15, y);
  }

  // ABN at bottom of bill details (redundant for clarity)
  y += 10;
  doc.setFontSize(10);
  doc.text('ABN 257 558 402 06', 15, y);

  return doc;
}
