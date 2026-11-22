import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { COLORES } from './colores.js';

const css = readFileSync(resolve(process.cwd(), 'src/estilos/variables.css'), 'utf8');
const variable = (nombre) => css.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

describe('colores.js coincide con variables.css', () => {
  it.each([
    ['texto', 'texto'],
    ['textoSuave', 'texto-suave'],
    ['acento', 'acento'],
    ['acentoClaro', 'acento-claro'],
    ['borde', 'borde'],
    ['error', 'error'],
    ['avisoBorde', 'aviso-borde'],
  ])('%s', (js, cssVar) => expect(COLORES[js]).toBe(variable(cssVar)));

  it('categorías', () => {
    for (const [id, color] of Object.entries(COLORES.categorias)) expect(color).toBe(variable(`cat-${id}`));
  });
});
