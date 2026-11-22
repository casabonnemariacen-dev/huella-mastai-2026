import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import { dibujarPdf, cadenaPdf } from './pdf.js';
import { armarContenidoPdf } from '../calculo/pdfContenido.js';
import { calcularHuella } from '../calculo/total.js';
import { crearEstadoInicial } from '../estado/respuestas.js';

const peor = () => {
  const r = crearEstadoInicial();
  r.movilidad = {
    ...r.movilidad,
    origen: { texto: 'Avenida Pedro Ferré 1234, Barrio San Benito, Corrientes, Departamento Capital', lat: 0, lon: 0 },
    distanciaKm: 2.5,
    fuenteDistancia: 'estimada',
    ida: { medio: 'auto', ocupantes: 1 },
    idaYVuelta: false,
    vuelta: { medio: 'moto', ocupantes: 2 },
  };
  r.alimentacion = { comida: 'vacuna', bebidas: ['alcohol', 'botella', 'reutilizable'], vasosCerveza: 6 };
  r.residuos = 'fuera';
  r.compras = 'varias';
  return r;
};

const generar = () => {
  const r = peor();
  const contenido = armarContenidoPdf(r, calcularHuella(r), new Date(), 'https://ejemplo.org/app/');
  return { contenido, doc: dibujarPdf(jsPDF, contenido, null) };
};

describe('dibujarPdf (jsPDF real)', () => {
  it('genera una sola página A4 sin texto fuera de la hoja, aun en el caso más largo', () => {
    const { contenido, doc } = generar();
    expect(contenido.recomendaciones.items.length).toBeGreaterThanOrEqual(6);
    expect(doc.getNumberOfPages()).toBe(1);
    const { width, height } = doc.internal.pageSize;
    expect(Math.round(width)).toBe(210);
    expect(Math.round(height)).toBe(297);

    // Posición de cada bloque de texto (operador Td, en puntos desde abajo).
    const salida = doc.output();
    const k = doc.internal.scaleFactor;
    const ys = [...salida.matchAll(/([\d.]+) ([\d.]+) Td/g)].map((m) => 297 - Number(m[2]) / k);
    expect(ys.length).toBeGreaterThan(40);
    expect(Math.max(...ys)).toBeLessThan(292);
    expect(Math.min(...ys)).toBeGreaterThan(5);
    expect(salida).toContain('Huella total');
    expect(salida).not.toContain('(\x85)'); // todas las recomendaciones entraron (sin "…")
  });

  it('escribe "CO₂" como un solo bloque con el 2 en subíndice (operador Ts)', () => {
    const salida = generar().doc.output();
    expect(salida).not.toContain('₂');
    expect(salida).toMatch(/\(CO\) Tj \/F\d+ [\d.]+ Tf -[\d.]+ Ts \(2\) Tj \/F\d+ [\d.]+ Tf 0 Ts \(e/);
  });
});

describe('cadenaPdf', () => {
  it('codifica en WinAnsi y escapa paréntesis y barras', () => {
    expect(cadenaPdf('Año (1) \\ – •')).toBe('(A\xf1o \\(1\\) \\\\ \x96 \x95)');
    expect(cadenaPdf('→')).toBe('(?)');
  });
});
