export const convertPrice = (eurPrice, currency, rate) => {
  if (currency === "EUR") return eurPrice;
  if (currency === "FCFA") return eurPrice * rate;
  return eurPrice;
};

export const formatCurrency = (value, currency) => {
  return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
};
