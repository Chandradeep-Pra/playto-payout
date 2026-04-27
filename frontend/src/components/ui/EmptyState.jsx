export function EmptyState({ title, copy }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}
