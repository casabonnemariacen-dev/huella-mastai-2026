import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuardadoAnonimo from './GuardadoAnonimo.jsx';
import { TEXTOS } from '../textos/es-AR.js';
import { calcularHuella } from '../calculo/total.js';
import { crearEstadoInicial } from '../estado/respuestas.js';

const guardarResultado = vi.fn();
const borrarResultado = vi.fn();
const obtenerResumen = vi.fn();
vi.mock('../servicios/almacenamiento.js', () => ({
  guardarResultado: (...a) => guardarResultado(...a),
  borrarResultado: (...a) => borrarResultado(...a),
  obtenerResumen: (...a) => obtenerResumen(...a),
}));

const T = TEXTOS.guardado;
const CONFIG = {
  url: 'https://proyecto.supabase.co',
  clavePublica: 'sb_publishable_abc',
  minimoParaPromedio: 30,
  esperaGuardadoMs: 0,
  tiempoLimiteMs: 1000,
  versionRegistro: 1,
};

const respuestas = (comida = 'vegetariana') => {
  const r = crearEstadoInicial();
  r.movilidad = { ...r.movilidad, distanciaKm: 5, ida: { medio: 'colectivo', ocupantes: 1 } };
  r.alimentacion = { comida, bebidas: ['reutilizable'], vasosCerveza: 1 };
  r.residuos = 'separe';
  r.compras = 'nada';
  return r;
};
const montar = (r = respuestas(), config = CONFIG) => {
  const huella = calcularHuella(r);
  const utils = render(<GuardadoAnonimo respuestas={r} huella={huella} config={config} />);
  return { ...utils, huella, actualizar: (nuevas) => utils.rerender(<GuardadoAnonimo respuestas={nuevas} huella={calcularHuella(nuevas)} config={config} />) };
};

beforeEach(() => {
  window.sessionStorage.clear();
  guardarResultado.mockReset().mockResolvedValue({ ok: true });
  borrarResultado.mockReset().mockResolvedValue({ ok: true });
  obtenerResumen.mockReset().mockResolvedValue({ cantidad: 40, promedio_total: 10 });
});

describe('GuardadoAnonimo', () => {
  it('sin configuración de Supabase no muestra nada ni llama a la red', async () => {
    const { container } = montar(respuestas(), { ...CONFIG, url: '' });
    await new Promise((r) => setTimeout(r, 20));
    expect(container).toBeEmptyDOMElement();
    expect(guardarResultado).not.toHaveBeenCalled();
    expect(obtenerResumen).not.toHaveBeenCalled();
  });

  it('guarda el registro anónimo, muestra el aviso y la comparación con el promedio', async () => {
    const { huella } = montar();
    expect(screen.getByText(T.aviso, { exact: false })).toBeInTheDocument();
    await waitFor(() => expect(guardarResultado).toHaveBeenCalledTimes(1));
    const registro = guardarResultado.mock.calls[0][0];
    expect(registro.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(registro.token).toMatch(/^[0-9a-f]{64}$/);
    expect(registro.total).toBeCloseTo(huella.total, 2);
    expect(await screen.findByRole('heading', { name: T.comparacionTitulo })).toBeInTheDocument();
    expect(screen.getByText(/Tu huella está un \d+ % por debajo del promedio de la Fiesta\./)).toBeInTheDocument();
    expect(screen.getByText(T.visitas(40))).toBeInTheDocument();
  });

  it('con menos de 30 resultados no compara y lo explica', async () => {
    obtenerResumen.mockResolvedValue({ cantidad: 7, promedio_total: 10 });
    montar();
    expect(await screen.findByText(T.pocos(7, 30))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: T.comparacionTitulo })).not.toBeInTheDocument();
  });

  it('si Supabase falla, la pantalla sigue sin comparación y avisa sin alarmar', async () => {
    guardarResultado.mockResolvedValue({ ok: false, motivo: 'red' });
    obtenerResumen.mockResolvedValue(null);
    montar();
    expect(await screen.findByText(T.errorGuardar)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: T.comparacionTitulo })).not.toBeInTheDocument();
  });

  it('editar las respuestas actualiza el mismo registro (mismo id)', async () => {
    const { actualizar } = montar();
    await waitFor(() => expect(guardarResultado).toHaveBeenCalledTimes(1));
    actualizar(respuestas('vacuna'));
    await waitFor(() => expect(guardarResultado).toHaveBeenCalledTimes(2));
    const [primero, segundo] = guardarResultado.mock.calls.map((c) => c[0]);
    expect(segundo.id).toBe(primero.id);
    expect(segundo.comida).toBe('vacuna');
  });

  it('"No guardar" borra el registro y no lo vuelve a guardar', async () => {
    const user = userEvent.setup();
    const { actualizar } = montar();
    await waitFor(() => expect(guardarResultado).toHaveBeenCalledTimes(1));
    const { id, token } = guardarResultado.mock.calls[0][0];
    await user.click(screen.getByRole('button', { name: T.noGuardar }));
    expect(await screen.findByText(T.noGuardado)).toBeInTheDocument();
    expect(borrarResultado).toHaveBeenCalledWith(id, token, CONFIG);
    actualizar(respuestas('blanca'));
    await new Promise((r) => setTimeout(r, 20));
    expect(guardarResultado).toHaveBeenCalledTimes(1);
  });
});
