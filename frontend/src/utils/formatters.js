export function formatCurrency(paise = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatDate(value) {
  if (!value) {
    return "Not processed yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatShortDate(value) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function pluralize(value, word) {
  return `${value} ${value === 1 ? word : `${word}s`}`;
}
