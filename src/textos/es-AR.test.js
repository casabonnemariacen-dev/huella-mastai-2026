import { describe, it, expect } from 'vitest';
import { TEXTOS } from './es-AR.js';
import { MEDIOS, COMIDAS, BEBIDAS, RESIDUOS, COMPRAS } from '../data/opciones.js';
import { PASOS, validarPaso, crearEstadoInicial } from '../estado/respuestas.js';

/** Recorre todos los textos (incluidas las funciones, evaluadas con valores de prueba). */
function todosLosTextos(obj, acumulado = []) {
  for (const valor of Object.values(obj)) {
    if (typeof valor === 'string') acumulado.push(valor);
    else if (typeof valor === 'function') acumulado.push(String(valor(1, 6)));
    else if (valor && typeof valor === 'object') todosLosTextos(valor, acumulado);
  }
  return acumulado;
}

describe('textos', () => {
  it('cada opción tiene su etiqueta', () => {
    const grupos = { medios: MEDIOS, comidas: COMIDAS, bebidas: BEBIDAS, residuos: RESIDUOS, compras: COMPRAS };
    for (const [grupo, lista] of Object.entries(grupos)) {
      for (const o of lista) expect(TEXTOS.opciones[grupo][o.id], `${grupo}.${o.id}`).toBeTruthy();
    }
  });

  it('cada paso tiene título', () => {
    for (const p of PASOS) expect(TEXTOS[p]?.titulo, p).toBeTruthy();
  });

  it('cada error de validación tiene mensaje', () => {
    const vacio = crearEstadoInicial();
    vacio.movilidad.idaYVuelta = false;
    vacio.movilidad.vuelta.medio = 'auto';
    const ids = PASOS.flatMap((_, i) => validarPaso(i, vacio));
    for (const id of [...ids, 'sinMedioVuelta', 'distanciaCero']) expect(TEXTOS.errores[id], id).toBeTruthy();
  });

  it('usa voseo: sin formas de "tú" ni "usted"', () => {
    const prohibidas =
      /\b(tú|usted|ustedes|puedes|tienes|eliges?|ingresa|selecciona|calcula tu|revisa|marca|escribe|desactívalo|usa)\b/i;
    for (const t of todosLosTextos(TEXTOS)) expect(t, t).not.toMatch(prohibidas);
  });

  it('la unidad siempre se escribe "kg CO₂e"', () => {
    for (const t of todosLosTextos(TEXTOS)) {
      expect(t, t).not.toMatch(/kg ?CO2|kgCO₂|kg de CO₂e|CO₂-e/);
    }
  });
});
