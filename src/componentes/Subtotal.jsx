export default function Subtotal({ children }) {
  return (
    <p className="subtotal" aria-live="polite">
      {children}
    </p>
  );
}
