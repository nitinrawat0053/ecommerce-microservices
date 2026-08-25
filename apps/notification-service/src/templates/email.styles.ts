export const emailStyles = {
  emailBody:
    'margin: 0; padding: 0; width: 100%; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',

  container:
    'max-width: 600px; margin: 0 auto; background-color: #ffffff;',

  header:
    'padding: 24px 40px; border-bottom: 1px solid #e5e7eb;',

  headerTable:
    'width: 100%; border-collapse: collapse;',

  logoCell:
    'font-size: 20px; font-weight: 700; color: #2563eb; text-decoration: none;',

  orderNumCell:
    'text-align: right; font-size: 13px; color: #6b7280; letter-spacing: 0.5px;',

  content:
    'padding: 40px;',

  heading:
    'font-size: 28px; font-weight: 600; color: #111827; margin: 0 0 16px 0; line-height: 1.3;',

  paragraph:
    'font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;',

  ctaButton:
    'display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; letter-spacing: 0.3px;',

  linkText:
    'display: inline-block; margin-left: 16px; font-size: 14px; color: #6b7280; text-decoration: underline;',

  divider:
    'border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;',

  sectionHeading:
    'font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 20px 0;',

  // Order item row
  itemRow:
    'border-bottom: 1px solid #f3f4f6; padding: 16px 0;',

  itemImage:
    'width: 64px; height: 64px; border-radius: 8px; object-fit: contain; background-color: #f9fafb; border: 1px solid #e5e7eb;',

  itemName:
    'font-size: 14px; font-weight: 500; color: #111827; margin: 0;',

  itemVariant:
    'font-size: 12px; color: #9ca3af; margin: 2px 0 0 0;',

  itemQty:
    'font-size: 13px; color: #6b7280;',

  itemPrice:
    'font-size: 14px; font-weight: 600; color: #111827; text-align: right; white-space: nowrap;',

  // Summary
  summaryLabel:
    'font-size: 14px; color: #6b7280; padding: 6px 0;',

  summaryValue:
    'font-size: 14px; color: #111827; text-align: right; padding: 6px 0;',

  totalLabel:
    'font-size: 16px; font-weight: 700; color: #111827; padding: 12px 0;',

  totalValue:
    'font-size: 16px; font-weight: 700; color: #111827; text-align: right; padding: 12px 0;',

  // Info section
  infoLabel:
    'font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0; font-weight: 600;',

  infoValue:
    'font-size: 14px; color: #111827; margin: 0 0 20px 0; line-height: 1.5;',

  // Footer
  footer:
    'padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;',

  footerText:
    'font-size: 12px; color: #9ca3af; line-height: 1.6;',

  footerLink:
    'color: #6b7280; text-decoration: underline;',

  // Savings badge
  savingsBadge:
    'display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #059669; border-radius: 4px; font-size: 13px; font-weight: 500; margin-top: 8px;',

  // Discount code
  discountCode:
    'display: inline-block; padding: 2px 8px; background-color: #fef3c7; color: #92400e; border-radius: 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px;',
};

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}