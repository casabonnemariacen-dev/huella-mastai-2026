import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { guardarResultado, borrarResultado, obtenerResumen, encabezados } from './almacenamiento.js';
import { leerRegistroVisita, marcarNoGuardar, renovarRegistroVisita } from '../estado/registroVisita.js';

const CONFIG = {
  url: 'https://proyecto.supabase.co',
  clavePublica: 'sb_publishable_abc123',
  minimoParaPromedio: 30,
  esperaGuardadoMs: 0,
  tiempoLimiteMs: 50,
  versionRegistro: 1,
};
const respuesta = (status, cuerpo = '') => ({ ok: status >= 200 && status < 300, status, text: async () => cuerpo });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('almacenamiento (Supabase)', () => {
  it('registrar_resultado: POST a la función RPC con la clave pública y { p: registro }', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(204));
    vi.stubGlobal('fetch', fetchMock);
    const r = await guardarResultado({ id: 'x', total: 1 }, CONFIG);
    expect(r).toEqual({ ok: true, motivo: undefined });
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/rpc/registrar_resultado');
    expect(opciones.method).toBe('POST');
    expect(opciones.headers.apikey).toBe('sb_publishable_abc123');
    expect(opciones.headers.Authorization).toBeUndefined();
    expect(JSON.parse(opciones.body)).toEqual({ p: { id: 'x', total: 1 } });
  });

  it('las claves anteriores (JWT anon) van también como Bearer', () => {
    expect(encabezados('eyJhbGciOi.xxx.yyy').Authorization).toBe('Bearer eyJhbGciOi.xxx.yyy');
  });

  it('borrar_resultado envía { p_id } y resumen_publico devuelve los agregados', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respuesta(204))
      .mockResolvedValueOnce(respuesta(200, '{"cantidad":42,"promedio_total":7.5}'));
    vi.stubGlobal('fetch', fetchMock);
    expect((await borrarResultado('id-1', CONFIG)).ok).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ p_id: 'id-1' });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/rpc\/borrar_resultado$/);
    expect(await obtenerResumen(CONFIG)).toEqual({ cantidad: 42, promedio_total: 7.5 });
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/rpc\/resumen_publico$/);
  });

  it('sin configuración no llama a la red', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const sin = { ...CONFIG, url: '', clavePublica: '' };
    expect(await guardarResultado({ id: 'x' }, sin)).toEqual({ ok: false, motivo: 'sin-configuracion' });
    expect(await obtenerResumen(sin)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registro incompleto no se envía', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect((await guardarResultado(null, CONFIG)).motivo).toBe('registro-incompleto');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('errores HTTP, de red y tiempo agotado no lanzan excepciones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(403, '{"message":"permission denied"}')));
    expect(await guardarResultado({ id: 'x' }, CONFIG)).toEqual({ ok: false, motivo: 'http-403' });
    expect(await obtenerResumen(CONFIG)).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await guardarResultado({ id: 'x' }, CONFIG)).toEqual({ ok: false, motivo: 'red' });

    vi.stubGlobal(
      'fetch',
      vi.fn((url, { signal }) => new Promise((_, rechazar) => signal.addEventListener('abort', () => rechazar(new DOMException('x', 'AbortError'))))),
    );
    expect(await guardarResultado({ id: 'x' }, CONFIG)).toEqual({ ok: false, motivo: 'tiempo-agotado' });
  });
});

describe('registro de la visita (sessionStorage)', () => {
  beforeEach(() => window.sessionStorage.clear());
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  it('crea un UUID v4 y lo mantiene durante la visita', () => {
    const a = leerRegistroVisita();
    expect(a.idRegistro).toMatch(UUID_V4);
    expect(a.noGuardar).toBe(false);
    expect(leerRegistroVisita().idRegistro).toBe(a.idRegistro);
  });

  it('"No guardar" se recuerda y "Volver a calcular" crea un id nuevo', () => {
    const a = leerRegistroVisita();
    expect(marcarNoGuardar()).toEqual({ idRegistro: a.idRegistro, noGuardar: true });
    expect(leerRegistroVisita().noGuardar).toBe(true);
    const b = renovarRegistroVisita();
    expect(b.idRegistro).not.toBe(a.idRegistro);
    expect(b.idRegistro).toMatch(UUID_V4);
    expect(b.noGuardar).toBe(false);
  });

  it('datos corruptos generan un registro nuevo', () => {
    window.sessionStorage.setItem('huella-mastai-2026-registro', '{roto');
    expect(leerRegistroVisita().idRegistro).toMatch(UUID_V4);
  });
});
