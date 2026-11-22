import Lucide from '@react-native-vector-icons/lucide';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarrasPorMes, MESES, SelectorAnio, TarjetaDato, TarjetaDestacada } from '../components/resumen';
import { AvisoSinConexion, Cargando, EstadoVacio, Tarjeta } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import { aniosDisponibles, resumenAnual } from '../dominio/resumenAnual';
import type { PropsPestana } from '../navigation';
import { espacio, MARGEN, radio, type Tema } from '../tema';
import type { ItemLista } from '../types';

/** 37.5 → "37,5 h" (D7). */
const horasTexto = (horas: number) => `${horas.toFixed(1).replace('.', ',')} h`;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export function MiAnioScreen({ navigation }: PropsPestana<'MiAnio'>) {
  const insets = useSafeAreaInsets();
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const { lista, cargandoLista, sinConexion, recargar, prepararResumen } = useCartelera();

  // La pantalla lee la fecha del sistema; el dominio la recibe como parámetro.
  const anioActual = useMemo(() => new Date().getFullYear(), []);
  const [anio, setAnio] = useState(anioActual); // D4: abre en el año actual
  const [progreso, setProgreso] = useState<{ hechas: number; total: number } | null>(null);

  const anios = useMemo(() => aniosDisponibles(lista, anioActual), [lista, anioActual]);
  const resumen = useMemo(() => resumenAnual(lista, anio), [lista, anio]);

  // D2 + D6 al abrir, al cambiar de año y cuando termina de cargar la lista. Sin conexión no hace nada (D13).
  // Repetir una tarea es inofensivo: cada escritura deja el mismo valor.
  useEffect(() => {
    if (cargandoLista) return;
    let vigente = true;
    void prepararResumen(anio, (hechas, total) => {
      if (vigente) setProgreso(total > 0 && hechas < total ? { hechas: hechas + 1, total } : null);
    });
    return () => {
      vigente = false;
    };
  }, [anio, cargandoLista, prepararResumen]);

  const abrir = useCallback(
    (obra: ItemLista) => navigation.navigate('Editar', { tipo: obra.tipo, tmdbId: obra.tmdbId }),
    [navigation],
  );

  if (cargandoLista && lista.length === 0) {
    return (
      <View style={[s.pantalla, { paddingTop: insets.top }]}>
        <Cargando />
      </View>
    );
  }

  const faltantes = [
    resumen.obrasSinDatos > 0 && `${plural(resumen.obrasSinDatos, 'obra quedó', 'obras quedaron')} sin datos de TMDB.`,
    resumen.peliculasSinDuracion > 0 &&
      `${plural(resumen.peliculasSinDuracion, 'película no tiene', 'películas no tienen')} duración y no suman horas.`,
  ].filter(Boolean);

  return (
    <ScrollView style={s.pantalla} contentContainerStyle={[s.contenido, { paddingTop: insets.top + espacio.s }]}>
      <Text style={texto.display} accessibilityRole="header">
        Mi año
      </Text>

      <SelectorAnio anios={anios} valor={anio} onCambiar={setAnio} />

      {sinConexion && (
        <View style={s.sinMargen}>
          <AvisoSinConexion onReintentar={recargar} cargando={cargandoLista} />
        </View>
      )}

      {progreso && (
        <View style={s.aviso} accessibilityLiveRegion="polite">
          <Lucide name="loader" size={16} color={color.acento} />
          <Text style={texto.pequeno}>
            Completando datos de TMDB… {progreso.hechas} de {progreso.total}
          </Text>
        </View>
      )}

      {resumen.totalObras === 0 ? (
        // D12
        <View style={s.vacio}>
          <EstadoVacio
            icono="calendar-x"
            titulo={`No viste nada en ${anio}`}
            mensaje="Marca obras como vistas y aquí aparecerá tu año."
            accion={{ titulo: 'Ir a Mi lista', onPress: () => navigation.navigate('MiLista') }}
          />
        </View>
      ) : (
        <>
          {faltantes.length > 0 && (
            <View style={s.aviso}>
              <Lucide name="circle-alert" size={16} color={color.textoSecundario} />
              <Text style={[texto.pequeno, s.flex]}>{faltantes.join(' ')}</Text>
            </View>
          )}

          <View style={s.fila}>
            <TarjetaDato
              rotulo="Obras vistas"
              valor={String(resumen.totalObras)}
              nota={`${plural(resumen.peliculas, 'película', 'películas')} · ${plural(resumen.series, 'serie', 'series')}`}
            />
            <TarjetaDato
              rotulo="Horas de cine"
              valor={horasTexto(resumen.horas)}
              nota={
                resumen.peliculasSinDuracion > 0 ? `${resumen.peliculasSinDuracion} sin duración` : 'Solo películas'
              }
            />
          </View>
          <View style={s.fila}>
            <TarjetaDato
              compacto
              rotulo="Género"
              valor={resumen.generoTop?.nombre ?? '—'}
              nota={resumen.generoTop ? plural(resumen.generoTop.obras, 'obra', 'obras') : 'Sin datos suficientes'}
            />
            <TarjetaDato
              compacto
              rotulo="Director"
              valor={resumen.directorTop?.nombre ?? '—'}
              nota={
                resumen.directorTop
                  ? plural(resumen.directorTop.obras, 'película', 'películas')
                  : 'No hay datos suficientes'
              }
            />
          </View>

          <Tarjeta titulo={resumen.mesTop === null ? 'Obras por mes' : `Mes más activo · ${MESES[resumen.mesTop]}`}>
            <BarrasPorMes obrasPorMes={resumen.obrasPorMes} mesTop={resumen.mesTop} />
          </Tarjeta>

          <TarjetaDestacada obra={resumen.destacada} onAbrir={abrir} />
        </>
      )}
    </ScrollView>
  );
}

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pantalla: { flex: 1, backgroundColor: color.fondo },
    contenido: { paddingHorizontal: MARGEN, paddingBottom: espacio.xxl, gap: espacio.l },
    sinMargen: { marginHorizontal: -MARGEN, marginBottom: -espacio.m },
    fila: { flexDirection: 'row', gap: espacio.m },
    aviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: espacio.s,
      padding: espacio.m,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    vacio: { minHeight: 360 },
  });
