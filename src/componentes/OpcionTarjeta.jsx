/** Radio o checkbox nativo con estilo de tarjeta (accesible por teclado). */
export default function OpcionTarjeta({ tipo = 'radio', name, value, checked, onChange, etiqueta, detalle }) {
  return (
    <label className="opcion">
      <input type={tipo} name={name} value={value} checked={checked} onChange={onChange} />
      <span className="opcion__texto">
        <span>{etiqueta}</span>
        {detalle && <span className="opcion__detalle">{detalle}</span>}
      </span>
    </label>
  );
}
