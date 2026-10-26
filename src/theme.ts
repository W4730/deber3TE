import { StyleSheet } from 'react-native';

const BASE = {
  fondo: '#0A0A0A',
  superficie: '#131313',
  superficieAlta: '#1B1B1B',
  borde: '#262626',
  texto: '#F4F4F1',
  textoSecundario: '#A3A3A0', // 7.4:1 sobre superficie
  textoTenue: '#8A8A86', // 5.4:1 sobre superficie; también placeholder
  estrellaVacia: '#4A4A47',
  acento: '#D4FF3A',
  sobreAcento: '#0A0A0A',
  acentoSuave: 'rgba(212, 255, 58, 0.12)',
  peligro: '#FF7A6B',
  velo: 'rgba(10, 10, 10, 0.62)', // fondo de controles sobre imágenes
};

// Alto contraste: textos secundarios casi blancos, bordes visibles y velos más oscuros.
const CONTRASTE: typeof BASE = {
  ...BASE,
  fondo: '#000000',
  superficie: '#0D0D0D',
  superficieAlta: '#1F1F1F',
  borde: '#6B6B66',
  textoSecundario: '#E6E6E2',
  textoTenue: '#CFCFCA',
  estrellaVacia: '#8A8A86',
  acentoSuave: 'rgba(212, 255, 58, 0.22)',
  peligro: '#FF9C90',
  velo: 'rgba(0, 0, 0, 0.85)',
};

export const radio = { s: 10, m: 14, l: 20 };
export const MARGEN = 20; // margen lateral de todas las pantallas
export const TOQUE = 44; // alto mínimo de cualquier elemento tocable

export type EscalaTexto = 1 | 1.15 | 1.3;

export interface Preferencias {
  escalaTexto: EscalaTexto;
  altoContraste: boolean;
  reducirMovimiento: boolean;
}

export const PREFERENCIAS_INICIALES: Preferencias = {
  escalaTexto: 1,
  altoContraste: false,
  reducirMovimiento: false,
};

export function crearTema(p: Preferencias) {
  const color = p.altoContraste ? CONTRASTE : BASE;
  const f = p.escalaTexto;
  return {
    color,
    escala: f,
    transicion: p.reducirMovimiento ? 0 : 150, // ms para expo-image
    animado: !p.reducirMovimiento,
    texto: StyleSheet.create({
      display: { color: color.texto, fontSize: 32 * f, fontWeight: '800', letterSpacing: -0.8 },
      titulo: { color: color.texto, fontSize: 22 * f, fontWeight: '700', letterSpacing: -0.3 },
      subtitulo: { color: color.texto, fontSize: 16 * f, fontWeight: '600' },
      cuerpo: { color: color.textoSecundario, fontSize: 15 * f, lineHeight: 22 * f },
      pequeno: { color: color.textoSecundario, fontSize: 13 * f, lineHeight: 18 * f },
      etiqueta: {
        color: color.acento,
        fontSize: 11 * f,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
      },
    }),
  };
}

export type Tema = ReturnType<typeof crearTema>;
