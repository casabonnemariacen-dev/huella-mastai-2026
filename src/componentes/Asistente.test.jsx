import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { TEXTOS } from '../textos/es-AR.js';

const O = TEXTOS.opciones;

async function irAMovilidad(user) {
  render(<App />);
  await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.comenzar }));
}

describe('asistente', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('muestra la bienvenida con la duración', () => {
    render(<App />);
    expect(screen.getByText(TEXTOS.bienvenida.duracion, { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Paso 1 de 6')).toBeInTheDocument();
  });

  it('no deja avanzar sin elegir medio y muestra el error', async () => {
    const user = userEvent.setup();
    await irAMovilidad(user);
    await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.siguiente }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXTOS.errores.sinMedio);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(TEXTOS.movilidad.titulo);
  });

  it('auto con distancia 0 no avanza; con distancia sí, y el foco va al título', async () => {
    const user = userEvent.setup();
    await irAMovilidad(user);
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${O.medios.auto}`) }));
    await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.siguiente }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXTOS.errores.distanciaCero);

    const campo = screen.getByLabelText(TEXTOS.movilidad.distanciaCampo);
    await user.clear(campo);
    await user.type(campo, '7,5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/Movilidad: 2,72 kg CO₂e/)).toBeInTheDocument(); // 15 km × 181,6 g/km

    await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.siguiente }));
    const titulo = screen.getByRole('heading', { level: 2 });
    expect(titulo).toHaveTextContent(TEXTOS.alimentacion.titulo);
    expect(titulo).toHaveFocus();
  });

  it('pide ocupantes en auto y divide la emisión', async () => {
    const user = userEvent.setup();
    await irAMovilidad(user);
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${O.medios.auto}`) }));
    await user.type(screen.getByLabelText(TEXTOS.movilidad.distanciaCampo), '{selectall}10');
    await user.selectOptions(screen.getByLabelText(TEXTOS.movilidad.ocupantes), '2');
    expect(screen.getByText(/Movilidad: 1,82 kg CO₂e/)).toBeInTheDocument(); // 20 km × 181,6 / 2
  });

  it('desactivar ida y vuelta pide el medio de la vuelta', async () => {
    const user = userEvent.setup();
    await irAMovilidad(user);
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${O.medios.pie_bici}`) }));
    await user.click(screen.getByRole('switch', { name: TEXTOS.movilidad.idaYVuelta }));
    expect(screen.getByRole('heading', { name: TEXTOS.movilidad.vueltaTitulo })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.siguiente }));
    expect(screen.getByRole('alert')).toHaveTextContent(TEXTOS.errores.sinMedioVuelta);
  });

  it('"No tomé nada" desmarca las demás bebidas y viceversa; cerveza pide vasos', async () => {
    const user = userEvent.setup();
    await irAMovilidad(user);
    await user.click(screen.getByRole('radio', { name: new RegExp(`^${O.medios.pie_bici}`) }));
    await user.click(screen.getByRole('button', { name: TEXTOS.navegacion.siguiente }));

    const alcohol = screen.getByRole('checkbox', { name: new RegExp(`^${O.bebidas.alcohol.replace(/[()]/g, '\\$&')}`) });
    const ninguna = screen.getByRole('checkbox', { name: O.bebidas.ninguna });
    await user.click(alcohol);
    expect(screen.getByLabelText(TEXTOS.alimentacion.vasos)).toBeInTheDocument();
    await user.click(ninguna);
    expect(ninguna).toBeChecked();
    expect(alcohol).not.toBeChecked();
    await user.click(alcohol);
    expect(ninguna).not.toBeChecked();
  });

  it('recorrido completo con teclado hasta el resultado y edición sin perder datos', async () => {
    const user = userEvent.setup();
    render(<App />);
    const enter = async (nombre) => {
      screen.getByRole('button', { name: nombre }).focus();
      await user.keyboard('{Enter}');
    };
    await enter(TEXTOS.navegacion.comenzar);
    screen.getByRole('radio', { name: new RegExp(`^${O.medios.pie_bici}`) }).focus();
    await user.keyboard(' ');
    await enter(TEXTOS.navegacion.siguiente);
    screen.getByRole('radio', { name: new RegExp(`^${O.comidas.ninguna}`) }).focus();
    await user.keyboard(' ');
    screen.getByRole('checkbox', { name: O.bebidas.ninguna }).focus();
    await user.keyboard(' ');
    await enter(TEXTOS.navegacion.siguiente);
    screen.getByRole('radio', { name: O.residuos.separe }).focus();
    await user.keyboard(' ');
    await enter(TEXTOS.navegacion.siguiente);
    screen.getByRole('radio', { name: O.compras.nada }).focus();
    await user.keyboard(' ');
    await enter(TEXTOS.navegacion.calcular);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(TEXTOS.resultados.titulo);
    expect(screen.getByText('Paso 6 de 6')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: TEXTOS.resultados.editar }));
    expect(screen.getByRole('radio', { name: new RegExp(`^${O.medios.pie_bici}`) })).toBeChecked();
  });

  it('dejar residuos fuera muestra el aviso educativo', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('huella-mastai-2026', JSON.stringify({ paso: 3, respuestas: {} }));
    render(<App />);
    await user.click(screen.getByRole('radio', { name: O.residuos.fuera }));
    expect(screen.getByRole('heading', { name: TEXTOS.residuos.avisoBasuraTitulo })).toBeInTheDocument();
  });
});
