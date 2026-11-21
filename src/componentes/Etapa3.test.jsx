import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { TEXTOS } from '../textos/es-AR.js';
import { crearEstadoInicial } from '../estado/respuestas.js';

// Leaflet no funciona en jsdom: se reemplaza el mapa por un marcador.
vi.mock('./Mapa.jsx', () => ({ default: () => <div data-testid="mapa" /> }));

const R = TEXTOS.resultados;

function abrirEn(paso, respuestas) {
  window.sessionStorage.setItem('huella-mastai-2026', JSON.stringify({ paso, respuestas }));
  return render(<App />);
}

const visitaCero = () => {
  const r = crearEstadoInicial();
  r.movilidad.ida.medio = 'pie_bici';
  r.alimentacion = { comida: 'ninguna', bebidas: ['ninguna'], vasosCerveza: 1 };
  r.residuos = 'separe';
  r.compras = 'nada';
  return r;
};

beforeEach(() => window.sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('resultados', () => {
  it('visita en auto: total, nivel, equivalencias, gráficos y recomendación de colectivo', () => {
    const r = visitaCero();
    r.movilidad = { ...r.movilidad, distanciaKm: 10, ida: { medio: 'auto', ocupantes: 1 } };
    abrirEn(5, r);
    expect(screen.getByText(R.total).querySelector('strong').textContent).toMatch(/^\d+,\d{2} kg CO₂e$/);
    expect(screen.getByRole('heading', { name: /Nivel de tu huella: Medio/ })).toBeInTheDocument();
    expect(screen.getByText(/cargar un celular/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Gráfico de anillo/ })).toBeInTheDocument();
    expect(screen.getByText(/Si hubieras venido en colectivo, tu huella sería \d+,\d{2} kg CO₂e menor\./)).toBeInTheDocument();
  });

  it('huella 0 (sin residuos): no dibuja gráficos ni equivalencias', () => {
    const r = visitaCero();
    r.residuos = null;
    const { container } = abrirEn(5, r);
    expect(screen.getByText(R.sinEmisiones)).toBeInTheDocument();
    expect(container.querySelector('svg circle')).toBeNull();
    expect(container.querySelector('.barras__barra')).toBeNull();
    expect(screen.queryByText(/cargar un celular/)).not.toBeInTheDocument();
    expect(screen.getByText(R.sinRecomendaciones)).toBeInTheDocument();
  });

  it('solo dibuja las categorías con emisiones', () => {
    const { container } = abrirEn(5, visitaCero()); // solo residuos separados
    expect(container.querySelectorAll('svg circle')).toHaveLength(1);
    expect(container.querySelectorAll('.barras__barra')).toHaveLength(1);
  });

  it('compartir sin Web Share copia el texto al portapapeles', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    abrirEn(5, visitaCero());
    await user.click(screen.getByRole('button', { name: R.compartir }));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/generó 0,\d{2} kg CO₂e/));
    expect(screen.getByText(R.copiado)).toBeInTheDocument();
  });

  it('abre la metodología con la tabla de factores y fuentes', async () => {
    const user = userEvent.setup();
    abrirEn(5, visitaCero());
    await user.click(screen.getByRole('button', { name: R.metodologiaEnlace }));
    const dialogo = screen.getByRole('dialog', { hidden: true });
    expect(within(dialogo).getByText(/Red eléctrica argentina/)).toBeInTheDocument();
    expect(within(dialogo).getAllByText(TEXTOS.metodologia.estimado).length).toBeGreaterThan(0);
  });

  it('editar un paso conserva las respuestas', async () => {
    const user = userEvent.setup();
    abrirEn(5, visitaCero());
    await user.click(screen.getByRole('button', { name: R.editarPaso('Residuos') }));
    expect(screen.getByRole('radio', { name: TEXTOS.opciones.residuos.separe })).toBeChecked();
  });
});

describe('buscador de direcciones y ruta', () => {
  const photon = {
    features: [
      {
        properties: { street: 'Junín', housenumber: '1200', city: 'Corrientes' },
        geometry: { coordinates: [-58.8355, -27.4678] },
      },
    ],
  };

  it('elegir una sugerencia calcula la ruta y carga la distancia', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (url) => ({
      ok: true,
      json: async () =>
        String(url).includes('photon')
          ? photon
          : { code: 'Ok', routes: [{ distance: 2840, geometry: { coordinates: [[-58.8355, -27.4678], [-58.83, -27.49]] } }] },
    }));
    vi.stubGlobal('fetch', fetchMock);
    abrirEn(1, crearEstadoInicial());

    await user.type(screen.getByRole('combobox', { name: TEXTOS.movilidad.origenEtiqueta }), 'Junín 1200');
    const opcion = await screen.findByRole('option', { name: 'Junín 1200, Corrientes' }, { timeout: 3000 });
    await user.click(opcion);

    expect(await screen.findByText(/Distancia por calle \(solo ida\): 2,8 km/, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByLabelText(TEXTOS.movilidad.distanciaCampo)).toHaveValue('2,8');
    expect(screen.getByTestId('mapa')).toBeInTheDocument();
  });

  it('si la ruta falla, estima la distancia y permite seguir a mano', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('photon')) {
          // Otro origen: la caché de rutas guarda el del test anterior.
          const otro = { features: [{ properties: { street: 'Salta', housenumber: '900', city: 'Corrientes' }, geometry: { coordinates: [-58.84, -27.47] } }] };
          return { ok: true, json: async () => otro };
        }
        throw new TypeError('sin red');
      }),
    );
    abrirEn(1, crearEstadoInicial());
    await user.type(screen.getByRole('combobox'), 'Salta 900');
    await user.click(await screen.findByRole('option', {}, { timeout: 3000 }));
    expect(await screen.findByText(/No pudimos calcular la ruta\. Estimamos \d+,\d km/, {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('si la búsqueda falla, avisa que se puede cargar a mano', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('sin red')));
    abrirEn(1, crearEstadoInicial());
    await user.type(screen.getByRole('combobox'), 'Calle inexistente');
    expect(await screen.findByText(TEXTOS.movilidad.errorBusqueda, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
