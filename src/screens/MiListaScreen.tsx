import Lucide from '@react-native-vector-icons/lucide';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EtiquetaEstado, NOMBRE_ESTADO, Poster } from '../components/obra';
import { AvisoSinConexion, Chip, Etiqueta, EstadoVacio } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import type { PropsPestana } from '../navigation';
import { MARGEN, type Tema } from '../theme';
import type { EstadoVisionado, ItemLista, TipoObra } from '../types';

const ESPACIO = 12;
const ESTADOS: ('todas' | EstadoVisionado)[] = ['todas', 'por_ver', 'viendo', 'vista'];
const TIPOS: { valor: TipoObra; nombre: string }[] = [
  { valor: 'movie', nombre: 'Películas' },
  { valor: 'tv', nombre: 'Series' },
];

export function MiListaScreen({ navigation }: PropsPestana<'MiLista'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const { lista, sinConexion, cargandoLista, recargar } = useCartelera();
  const [estado, setEstado] = useState<'todas' | EstadoVisionado>('todas');
  const [tipo, setTipo] = useState<TipoObra | null>(null); // null = películas y series

  const ancho = (width - MARGEN * 2 - ESPACIO * 2) / 3;
  const visibles = useMemo(
    () => lista.filter((i) => (estado === 'todas' || i.estado === estado) && (!tipo || i.tipo === tipo)),
    [lista, estado, tipo],
  );

  const abrir = useCallback(
    (item: ItemLista) => navigation.navigate('Editar', { tipo: item.tipo, tmdbId: item.tmdbId }),
    [navigation],
  );
  const renderItem = useCallback(
    ({ item }: { item: ItemLista }) => <TarjetaItem item={item} ancho={ancho} onAbrir={abrir} />,
    [ancho, abrir],
  );

  return (
    <View style={[s.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={s.cabecera}>
        <Text style={texto.display} accessibilityRole="header">
          Mi lista
        </Text>
        <Etiqueta texto={`${lista.length} ${lista.length === 1 ? 'título' : 'títulos'}`} tono="neutro" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtros} contentContainerStyle={s.filtrosFila}>
        {ESTADOS.map((e) => (
          <Chip key={e} texto={e === 'todas' ? 'Todas' : NOMBRE_ESTADO[e]} activo={estado === e} onPress={() => setEstado(e)} />
        ))}
        <View style={s.separador} />
        {TIPOS.map((t) => (
          <Chip
            key={t.valor}
            texto={t.nombre}
            activo={tipo === t.valor}
            onPress={() => setTipo((actual) => (actual === t.valor ? null : t.valor))}
          />
        ))}
      </ScrollView>

      {sinConexion && <AvisoSinConexion onReintentar={recargar} cargando={cargandoLista} />}

      <FlatList
        data={visibles}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={s.columnas}
        contentContainerStyle={[s.lista, visibles.length === 0 && s.listaVacia]}
        refreshControl={
          <RefreshControl
            refreshing={cargandoLista}
            onRefresh={recargar}
            tintColor={color.acento}
            colors={[color.sobreAcento]}
            progressBackgroundColor={color.acento}
          />
        }
        ListEmptyComponent={
          cargandoLista ? undefined : lista.length === 0 ? (
            <EstadoVacio
              icono="bookmark"
              titulo="Tu lista está vacía"
              mensaje="Busca una película o serie y toca «Agregar a mi lista»."
              accion={{ titulo: 'Buscar títulos', onPress: () => navigation.navigate('Buscar') }}
            />
          ) : (
            <EstadoVacio icono="list-filter" titulo="Nada con estos filtros" mensaje="Prueba con otro estado o tipo." />
          )
        }
        initialNumToRender={12}
        windowSize={7}
      />
    </View>
  );
}

const TarjetaItem = memo(function TarjetaItem({
  item,
  ancho,
  onAbrir,
}: {
  item: ItemLista;
  ancho: number;
  onAbrir: (item: ItemLista) => void;
}) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  const nota = item.calificacionPersonal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.titulo}, ${NOMBRE_ESTADO[item.estado]}${nota ? `, tu calificación ${nota} de 5` : ''}`}
      onPress={() => onAbrir(item)}
      style={({ pressed }) => [{ width: ancho }, pressed && s.presionado]}
    >
      {/* w342 = mismo archivo que en Buscar, así sale de la caché de disco */}
      <Poster path={item.posterPath} tamano="w342" />
      <Text style={s.titulo} numberOfLines={2}>
        {item.titulo}
      </Text>
      <View style={s.pie}>
        <EtiquetaEstado estado={item.estado} />
        {nota ? (
          <View style={s.nota}>
            <Lucide name="star" size={11} color={color.acento} />
            <Text style={s.notaTexto}>{nota}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    presionado: { opacity: 0.85 },
    cabecera: {
      paddingHorizontal: MARGEN,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    filtros: { flexGrow: 0, marginTop: 16, marginBottom: 16 },
    filtrosFila: { paddingHorizontal: MARGEN, gap: 8, alignItems: 'center' },
    separador: { width: 1, height: 24, backgroundColor: color.borde, marginHorizontal: 4 },

    lista: { paddingHorizontal: MARGEN, paddingBottom: 24, gap: 18 },
    listaVacia: { flexGrow: 1 },
    columnas: { gap: ESPACIO },

    titulo: { color: color.texto, fontSize: 13, fontWeight: '700', marginTop: 8, lineHeight: 17 },
    pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 4 },
    nota: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    notaTexto: { color: color.texto, fontSize: 12, fontWeight: '700' },
  });
