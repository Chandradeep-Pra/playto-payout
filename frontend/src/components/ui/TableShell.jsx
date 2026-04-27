export function TableShell({ children }) {
  return (
    <div className="table-shell">
      <div className="table-scroll">{children}</div>
    </div>
  );
}
