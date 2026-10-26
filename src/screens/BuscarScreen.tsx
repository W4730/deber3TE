import Lucide from '@react-native-vector-icons/lucide';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Poster } from '../components/obra';
import { Cargando, Etiqueta, EstadoVacio, Marca } from '../components/ui';
import { useEstilos, useTema } from '../context/AccesibilidadContext';
import { useCartelera } from '../context/CarteleraContext';
import type { PropsPestana } from '../navigation';
import { crearItemId } from '../services/listaService';
import { buscar } from '../services/tmdbService';
import { MARGEN, radio, TOQUE, type Tema } from '../theme';
import type { EstadoPeticion, PaginaBusqueda, ResultadoBusqueda } from '../types';

const ESPACIO = 14;
const INACTIVO: EstadoPeticion<never> = { estado: 'inactivo' };
const claveDe = (r: ResultadoBusqueda) => crearItemId(r.tipo, r.tmdbId);

export function BuscarScreen({ navigation }: PropsPestana<'Buscar'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { color, texto } = useTema();
  const s = useEstilos(estilos);
  const { lista, agregar } = useCartelera();
  const [entrada, setEntrada] = useState('');
  const [guardada, setPeticion] = useState<EstadoPeticion<PaginaBusqueda>>(INACTIVO);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [intento, setIntento] = useState(0);

  const consulta = entrada.trim();
  const peticion = consulta ? guardada : INACTIVO; // campo vacío = sin búsqueda
  const anchoTarjeta = (width - MARGEN * 2 - ESPACIO) / 2;
  const guardados = useMemo(() => new Set(lista.map((i) => i.id)), [lista]);

  // Busca 400 ms después de la última tecla y descarta respuestas de búsquedas anteriores.
  useEffect(() => {
    if (!consulta) return;
    let vigente = true;
    const espera = setTimeout(() => {
      setPeticion({ estado: 'cargando' });
      buscar(consulta, 1).then(
        (datos) => vigente && setPeticion({ estado: 'exito', datos }),
        (e: Error) => vigente && setPeticion({ estado: 'error', mensaje: e.message }),
      );
    }, 400);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [consulta, intento]);

  const cargarMas = async () => {
    if (peticion.estado !== 'exito' || cargandoMas) return;
    const actual = peticion.datos;
    if (actual.pagina >= actual.totalPaginas) return;
    setCargandoMas(true);
    try {
      const siguiente = await buscar(consulta, actual.pagina + 1);
      setPeticion((prev) => {
        if (prev.estado !== 'exito' || prev.datos !== actual) return prev; // la búsqueda cambió mientras tanto
        const vistos = new Set(actual.resultados.map(claveDe));
        const nuevos = siguiente.resultados.filter((r) => !vistos.has(claveDe(r)));
        return { estado: 'exito', datos: { ...siguiente, resultados: [...actual.resultados, ...nuevos] } };
      });
    } catch {
      // Se reintenta solo la próxima vez que se llegue al final.
    } finally {
      setCargandoMas(false);
    }
  };

  const abrir = useCallback(
    (obra: ResultadoBusqueda) => navigation.navigate('Detalle', { tipo: obra.tipo, tmdbId: obra.tmdbId }),
    [navigation],
  );

  const guardar = useCallback(
    (obra: ResultadoBusqueda, guardado: boolean) => {
      if (guardado) return navigation.navigate('Editar', { tipo: obra.tipo, tmdbId: obra.tmdbId });
      agregar(obra).catch(() => Alert.alert('No se pudo agregar', 'Vuelve a intentarlo en un momento.'));
    },
    [navigation, agregar],
  );

  const renderItem = useCallback(
    ({ item }: { item: ResultadoBusqueda }) => (
      <TarjetaResultado
        obra={item}
        ancho={anchoTarjeta}
        guardado={guardados.has(claveDe(item))}
        onAbrir={abrir}
        onGuardar={guardar}
      />
    ),
    [anchoTarjeta, guardados, abrir, guardar],
  );

  return (
    <View style={[s.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={s.cabecera}>
        <Marca />
      </View>

      <View style={s.buscador}>
        <Lucide name="search" size={18} color={color.textoTenue} />
        <TextInput
          value={entrada}
          onChangeText={setEntrada}
          placeholder="Buscar película o serie"
          placeholderTextColor={color.textoTenue}
          accessibilityLabel="Buscar película o serie"
          style={s.buscadorInput}
          returnKeyType="search"
          autoCorrect={false}
          selectionColor={color.acento}
          cursorColor={color.acento}
        />
        {peticion.estado === 'exito' && peticion.datos.total > 0 && (
          <View style={s.contador} accessibilityLabel={`${peticion.datos.total} coincidencias`}>
            <Text style={s.contadorTexto}>{peticion.datos.total > 999 ? '999+' : peticion.datos.total}</Text>
          </View>
        )}
        {entrada.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setEntrada('')} style={s.borrar}>
            <Lucide name="x" size={18} color={color.textoSecundario} />
          </Pressable>
        )}
      </View>

      {peticion.estado === 'inactivo' && (
        <EstadoVacio
          icono="popcorn"
          titulo="¿Qué quieres ver hoy?"
          mensaje="Busca películas y series por título y guárdalas en tu lista."
        />
      )}
      {peticion.estado === 'cargando' && <Cargando />}
      {peticion.estado === 'error' && (
        <EstadoVacio
          icono="circle-alert"
          titulo="No pudimos buscar"
          mensaje={peticion.mensaje}
          accion={{ titulo: 'Reintentar', onPress: () => setIntento((n) => n + 1) }}
        />
      )}
      {peticion.estado === 'exito' && peticion.datos.resultados.length === 0 && (
        <EstadoVacio
          icono="search-x"
          titulo={`Sin resultados para “${consulta}”`}
          mensaje="Revisa la ortografía o prueba con otro título."
        />
      )}
      {peticion.estado === 'exito' && peticion.datos.resultados.length > 0 && (
        <FlatList
          data={peticion.datos.resultados}
          keyExtractor={claveDe}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={s.columnas}
          contentContainerStyle={s.lista}
          ListHeaderComponent={
            <View style={s.resultadosCabecera}>
              <Text style={texto.titulo}>Resultados</Text>
              <Text style={texto.pequeno}>{peticion.datos.total} coincidencias en TMDB</Text>
            </View>
          }
          ListFooterComponent={cargandoMas ? <ActivityIndicator color={color.acento} style={s.pie} /> : undefined}
          onEndReached={cargarMas}
          onEndReachedThreshold={0.6}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
        />
      )}
    </View>
  );
}

const TarjetaResultado = memo(function TarjetaResultado({
  obra,
  ancho,
  guardado,
  onAbrir,
  onGuardar,
}: {
  obra: ResultadoBusqueda;
  ancho: number;
  guardado: boolean;
  onAbrir: (obra: ResultadoBusqueda) => void;
  onGuardar: (obra: ResultadoBusqueda, guardado: boolean) => void;
}) {
  const { color } = useTema();
  const s = useEstilos(estilos);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${obra.titulo}${obra.anio ? `, ${obra.anio}` : ''}`}
      onPress={() => onAbrir(obra)}
      style={({ pressed }) => [{ width: ancho }, pressed && s.presionado]}
    >
      <View>
        <Poster path={obra.posterPath} tamano="w342" />
        <View style={s.posterVelo} pointerEvents="none" />
        <View style={s.posterArriba}>
          <Etiqueta texto={obra.tipo === 'movie' ? 'Película' : 'Serie'} tono="contorno" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={guardado ? `Editar ${obra.titulo} en mi lista` : `Agregar ${obra.titulo} a mi lista`}
            onPress={() => onGuardar(obra, guardado)}
            style={s.guardar}
          >
            <View style={[s.guardarCirculo, guardado && s.guardarActivo]}>
              <Lucide
                name={guardado ? 'bookmark-check' : 'bookmark'}
                size={16}
                color={guardado ? color.sobreAcento : color.texto}
              />
            </View>
          </Pressable>
        </View>
        {obra.anio ? <Text style={s.anio}>{obra.anio}</Text> : null}
      </View>
      <Text style={s.titulo} numberOfLines={2}>
        {obra.titulo}
      </Text>
      <View style={s.calificacion}>
        <Lucide name="star" size={12} color={color.acento} />
        <Text style={s.calificacionValor}>{obra.calificacion ? obra.calificacion.toFixed(1) : '–'}</Text>
        <Text style={s.calificacionFuente}>TMDB</Text>
      </View>
    </Pressable>
  );
});

const estilos = ({ color }: Tema) =>
  StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: color.fondo },
    presionado: { opacity: 0.85 },
    cabecera: { paddingHorizontal: MARGEN, marginBottom: 16 },

    buscador: {
      marginHorizontal: MARGEN,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 16,
      borderRadius: radio.m,
      backgroundColor: color.superficie,
      borderWidth: 1,
      borderColor: color.borde,
    },
    buscadorInput: { flex: 1, minHeight: 50, color: color.texto, fontSize: 16 },
    contador: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: 7,
      borderRadius: 12,
      backgroundColor: color.acento,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contadorTexto: { color: color.sobreAcento, fontSize: 12, fontWeight: '800' },
    borrar: { width: TOQUE, height: TOQUE, alignItems: 'center', justifyContent: 'center', marginRight: 4 },

    lista: { paddingHorizontal: MARGEN, paddingBottom: 24, gap: 22 },
    columnas: { gap: ESPACIO },
    resultadosCabecera: { paddingTop: 22, gap: 2 },
    pie: { marginVertical: 16 },

    posterVelo: {
      ...StyleSheet.absoluteFill,
      borderRadius: radio.m,
      experimental_backgroundImage:
        'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0) 30%, rgba(10,10,10,0) 65%, rgba(10,10,10,0.8) 100%)',
    },
    posterArriba: {
      position: 'absolute',
      top: 0,
      left: 8,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    guardar: { width: TOQUE, height: TOQUE, alignItems: 'center', justifyContent: 'center' },
    guardarCirculo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.velo,
    },
    guardarActivo: { backgroundColor: color.acento },
    anio: { position: 'absolute', left: 10, bottom: 8, color: color.texto, fontSize: 12, fontWeight: '700' },

    titulo: { color: color.texto, fontSize: 15, fontWeight: '700', marginTop: 10, lineHeight: 20 },
    calificacion: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    calificacionValor: { color: color.texto, fontSize: 12, fontWeight: '700' },
    calificacionFuente: { color: color.textoTenue, fontSize: 11, fontWeight: '600' },
  });
