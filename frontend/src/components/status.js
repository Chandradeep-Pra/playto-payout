function getStatusClass(status) {
  return `status-pill status-${status}`;
}

function renderStatus(status) {
  return `<span class="${getStatusClass(status)}">${status}</span>`;
}

export { renderStatus };
