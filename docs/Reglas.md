function esDueno(uid) {
  return request.auth != null && request.auth.uid == uid;
}

function nombreValido(n) {
  return n is string && n.size() >= 1 && n.size() <= 40;
}

// ---------- Perfil: usuarios/{uid} ----------

function perfilValido() {
  let d = request.resource.data;
  return d.keys().hasOnly(['nombre', 'apellido', 'usuario', 'foto', 'creadoEn', 'actualizadoEn'])
    && nombreValido(d.nombre)
    && nombreValido(d.apellido)
    && d.usuario is string && d.usuario.matches('^[a-z0-9_.]{3,20}$')
    // Foto JPEG pequeña como data URI (la app la reduce a ~30 KB).
    && (d.foto == null || (d.foto is string && d.foto.size() <= 200000
                           && d.foto.matches('^data:image/jpeg;base64,[A-Za-z0-9+/=]+$')))
    && d.actualizadoEn == request.time;
}

// El usuario del perfil debe estar reservado a nombre de este uid (después del lote).
function usuarioReservado(uid) {
  return getAfter(/databases/$(database)/documents/nombresUsuario/$(request.resource.data.usuario)).data.uid == uid;
}

match /usuarios/{uid} {
  allow read: if esDueno(uid);
  allow create: if esDueno(uid) && perfilValido() && usuarioReservado(uid)
    && request.resource.data.creadoEn == request.time;
  allow update: if esDueno(uid) && perfilValido() && usuarioReservado(uid)
    && request.resource.data.creadoEn == resource.data.creadoEn;
  allow delete: if false;
}

// ---------- Nombres de usuario únicos: nombresUsuario/{usuario} = { uid } ----------
// Crear un documento que ya existe cuenta como "update", que está prohibido: no hay dos iguales.

match /nombresUsuario/{usuario} {
  // Solo se puede preguntar por un nombre concreto (no listar); revela el uid, nunca datos personales.
  allow get: if true;
  allow list: if false;
  allow create: if request.auth != null
    && request.resource.data.keys().hasOnly(['uid'])
    && request.resource.data.uid == request.auth.uid
    && usuario.matches('^[a-z0-9_.]{3,20}$')
    && getAfter(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.usuario == usuario;
  // Se libera solo al cambiarlo por otro en el mismo lote.
  allow delete: if request.auth != null
    && resource.data.uid == request.auth.uid
    && getAfter(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.usuario != usuario;
  allow update: if false;
}

// ---------- Mi lista: usuarios/{uid}/mi_lista/{itemId} ----------

// Reglas de negocio que también valida el servidor (RF4, RF6).
function itemValido() {
  let d = request.resource.data;
  return d.keys().hasOnly(['tmdbId', 'tipo', 'titulo', 'anio', 'posterPath', 'estado',
                           'calificacionPersonal', 'comentario', 'agregadoEn', 'actualizadoEn'])
    && d.tmdbId is int
    && d.tipo in ['movie', 'tv']
    && d.titulo is string && d.titulo.size() <= 300
    && d.anio is string && d.anio.size() <= 4
    && (d.posterPath == null || d.posterPath is string)
    && d.estado in ['por_ver', 'viendo', 'vista']
    && d.comentario is string && d.comentario.size() <= 500
    && (d.calificacionPersonal == null
        || (d.estado == 'vista' && d.calificacionPersonal is int
            && d.calificacionPersonal >= 1 && d.calificacionPersonal <= 5))
    && d.actualizadoEn == request.time;
}

// Cada usuario solo ve y modifica su propia subcolección.
match /usuarios/{uid}/mi_lista/{itemId} {
  allow read, delete: if esDueno(uid);

  // El id debe ser tipo_tmdbId (movie_550): así una obra no se guarda dos veces.
  allow create: if esDueno(uid) && itemValido()
    && itemId == request.resource.data.tipo + '_' + string(request.resource.data.tmdbId)
    && request.resource.data.agregadoEn == request.time;

  // La obra y la fecha en que se agregó no cambian.
  allow update: if esDueno(uid) && itemValido()
    && request.resource.data.tmdbId == resource.data.tmdbId
    && request.resource.data.tipo == resource.data.tipo
    && request.resource.data.agregadoEn == resource.data.agregadoEn;
}