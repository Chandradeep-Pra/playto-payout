function formatCurrency(paise = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

function formatDate(value) {
  if (!value) {
    return "Not processed yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value = 0, noun = "item") {
  const suffix = value === 1 ? noun : `${noun}s`;
  return `${value} ${suffix}`;
}

export { formatCount, formatCurrency, formatDate };
