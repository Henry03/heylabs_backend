export const formatCurrency = (
  value: number,
  currency: string = 'IDR',
  locale: string = 'id-ID',
  minimumFractionDigits: number = 0
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits
  }).format(value);
};
