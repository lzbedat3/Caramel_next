export function toTelHref(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  return compact ? `tel:${compact}` : `tel:${phone}`;
}
