export function Panel({ children, className = "", id }) {
  return (
    <section id={id} className={`surface ${className}`.trim()}>
      {children}
    </section>
  );
}
