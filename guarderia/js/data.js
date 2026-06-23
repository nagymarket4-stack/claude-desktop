// ─── Configuración del centro (editable por superadmin) ──────────────────────
let CONFIGURACION = {
  nombre:    'Sol & Luna',
  subtitulo: 'Guardería Infantil',
  logo:      '🌱',
};

// ─── Usuarios del sistema ─────────────────────────────────────────────────────
// Roles: 'superadmin' | 'admin' | 'profesor' | 'padre'
// alumnoIds: solo para rol 'padre', indica qué hijos puede ver
// Contraseñas demo: superadmin→"super2024", admin→"admin", carmen→"carmen123", marta→"marta123"
//                   padres→"padres123" (todos los padres demo usan la misma)
// SHA-256 calculado en browser vía crypto.subtle
const USUARIOS_INIT = [
  { id:1,  usuario:'superadmin',  passHash:'4fa5c6a9cbc417f39a65f18659bb376dc48a457c3a75c2544e7baa289b7c7a3e', nombre:'Director General',   rol:'superadmin', activo:true, alumnoIds:[]  },
  { id:2,  usuario:'admin',       passHash:'8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', nombre:'Ana Díaz',           rol:'admin',       activo:true, alumnoIds:[]  },
  { id:3,  usuario:'carmen',      passHash:'955dcfcdb605d30b38ab03059f7843f3e91af79abfee13588ec980d29f4b7c3d', nombre:'Carmen Rodríguez',   rol:'profesor',    activo:true, alumnoIds:[]  },
  { id:4,  usuario:'marta',       passHash:'1012b10a6172a9e0c9cf0f81db785db1abc7cdd2eecb4a45b03442c7beb8b719', nombre:'Marta Jiménez',      rol:'profesor',    activo:true, alumnoIds:[]  },
  { id:5,  usuario:'mama_sofia',  passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'María Martínez',     rol:'padre',       activo:true, alumnoIds:[1] },
  { id:6,  usuario:'papa_sofia',  passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'Carlos Martínez',    rol:'padre',       activo:true, alumnoIds:[1] },
  { id:7,  usuario:'mama_lucas',  passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'Pedro García',       rol:'padre',       activo:true, alumnoIds:[2] },
  { id:8,  usuario:'mama_emma',   passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'Ana López',          rol:'padre',       activo:true, alumnoIds:[3] },
  { id:9,  usuario:'papa_pablo',  passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'Carlos Sánchez',     rol:'padre',       activo:true, alumnoIds:[4] },
  { id:10, usuario:'mama_torres', passHash:'58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c', nombre:'Laura Torres',       rol:'padre',       activo:true, alumnoIds:[5] },
];
// SHA-256 de "padres123" = 58d699cf0b96ebd759f8cdefb501489d1d291862114343861373763caa05138c
// SHA-256 de "super2024" = c7b4b01ad5a0dee7bd25ea6c93c45b9fcbbbbf1b0fef7cbe31f1e4ccec2a1547

// ─── Sample data ────────────────────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

const ALUMNOS = [
  { id:1, nombre:'Sofía Martínez',  edad:3, grupo:'Ositos',    avatar:'S', color:'av-pink',   estado:'entrada',  hora_entrada:'08:15', hora_salida:null,    tutor:'María Martínez', tel:'612 345 678' },
  { id:2, nombre:'Lucas García',    edad:4, grupo:'Conejitos', avatar:'L', color:'av-blue',   estado:'entrada',  hora_entrada:'08:30', hora_salida:null,    tutor:'Pedro García',   tel:'623 456 789' },
  { id:3, nombre:'Emma López',      edad:3, grupo:'Ositos',    avatar:'E', color:'av-green',  estado:'salida',   hora_entrada:'08:00', hora_salida:'13:00', tutor:'Ana López',      tel:'634 567 890' },
  { id:4, nombre:'Pablo Sánchez',   edad:5, grupo:'Estrellitas',avatar:'P', color:'av-orange', estado:'entrada', hora_entrada:'09:00', hora_salida:null,    tutor:'Carlos Sánchez', tel:'645 678 901' },
  { id:5, nombre:'Valentina Torres',edad:4, grupo:'Conejitos', avatar:'V', color:'av-purple', estado:'ausente',  hora_entrada:null,    hora_salida:null,    tutor:'Laura Torres',   tel:'656 789 012' },
  { id:6, nombre:'Mateo Ruiz',      edad:3, grupo:'Ositos',    avatar:'M', color:'av-blue',   estado:'entrada',  hora_entrada:'08:45', hora_salida:null,    tutor:'José Ruiz',      tel:'667 890 123' },
  { id:7, nombre:'Isabella Flores', edad:5, grupo:'Estrellitas',avatar:'I', color:'av-pink',  estado:'entrada',  hora_entrada:'08:20', hora_salida:null,    tutor:'Rosa Flores',    tel:'678 901 234' },
  { id:8, nombre:'Daniel Moreno',   edad:4, grupo:'Conejitos', avatar:'D', color:'av-green',  estado:'salida',   hora_entrada:'07:55', hora_salida:'14:00', tutor:'Fernando Moreno', tel:'689 012 345' },
];

const PROFESORES = [
  { id:1, nombre:'Carmen Rodríguez', cargo:'Tutora Ositos',     avatar:'C', color:'av-green',  estado:'fichado',  hora_entrada:'07:45', hora_salida:null },
  { id:2, nombre:'Marta Jiménez',    cargo:'Tutora Conejitos',  avatar:'M', color:'av-blue',   estado:'fichado',  hora_entrada:'08:00', hora_salida:null },
  { id:3, nombre:'Laura Fernández',  cargo:'Tutora Estrellitas',avatar:'L', color:'av-purple', estado:'fichado',  hora_entrada:'08:30', hora_salida:null },
  { id:4, nombre:'Rosa Hernández',   cargo:'Apoyo',             avatar:'R', color:'av-orange', estado:'salida',   hora_entrada:'07:30', hora_salida:'13:30' },
  { id:5, nombre:'Ana Díaz',         cargo:'Directora',         avatar:'A', color:'av-pink',   estado:'fichado',  hora_entrada:'07:00', hora_salida:null },
];

const ACTIVIDADES = [
  {
    id:1, titulo:'Taller de Pintura con Dedos', fecha:'Hoy, 10:00',
    descripcion:'Los niños exploraron colores primarios y mezclas usando pintura de dedos no tóxica. Fue una sesión llena de creatividad y risas.',
    etiquetas:['Arte','Creatividad','Motricidad'], fotos:['🎨','🖌️','🌈'],
    grupo:'Ositos', publicada:true
  },
  {
    id:2, titulo:'Cuentacuentos: "El León y el Ratón"', fecha:'Hoy, 11:30',
    descripcion:'La profesora Carmen narró el cuento clásico con marionetas. Los niños participaron activamente imitando los personajes.',
    etiquetas:['Lectura','Lenguaje','Valores'], fotos:['📖','🦁','🐭'],
    grupo:'Todos', publicada:true
  },
  {
    id:3, titulo:'Juego en el Patio', fecha:'Hoy, 12:00',
    descripcion:'Tiempo libre en el patio con juegos de cooperación y carrera de sacos. Se fomentó el trabajo en equipo.',
    etiquetas:['Deporte','Socialización','Aire libre'], fotos:['⚽','🏃','🤸'],
    grupo:'Conejitos', publicada:true
  },
  {
    id:4, titulo:'Taller de Música', fecha:'Ayer, 10:30',
    descripcion:'Aprendimos canciones con instrumentos de percusión artesanal. Los niños decoraron sus propias maracas.',
    etiquetas:['Música','Arte','Ritmo'], fotos:['🎵','🥁','🎶'],
    grupo:'Estrellitas', publicada:true
  },
];

// ─── Bienestar diario ─────────────────────────────────────────────────────────
// sueno: horas (0-12), humor: emoji key
// comidas: { desayuno|snack|comida|merienda: { cantidad:'nada'|'poco'|'normal'|'todo', hora:'HH:MM' } }
const BIENESTAR_DEFAULT = { sueno: null, comidas: {}, humor: null };

const BIENESTAR_INIT = {
  1: { sueno: 10, humor: '😊', comidas: { desayuno:{cantidad:'todo',hora:'09:00'}, snack:{cantidad:'normal',hora:'11:00'}, comida:{cantidad:'todo',hora:'13:00'}, merienda:{cantidad:'poco',hora:'16:30'} } },
  2: { sueno: 9,  humor: '😄', comidas: { desayuno:{cantidad:'normal',hora:'08:45'}, comida:{cantidad:'normal',hora:'13:15'} } },
  3: { sueno: 8,  humor: '😐', comidas: { desayuno:{cantidad:'poco',hora:'09:10'} } },
  4: { sueno: 11, humor: '😄', comidas: { desayuno:{cantidad:'todo',hora:'09:00'}, snack:{cantidad:'todo',hora:'11:00'}, comida:{cantidad:'todo',hora:'13:00'} } },
  5: { sueno: null, humor: null, comidas: {} },
  6: { sueno: 7,  humor: '😴', comidas: { desayuno:{cantidad:'normal',hora:'08:50'}, comida:{cantidad:'poco',hora:'13:00'} } },
  7: { sueno: 10, humor: '😊', comidas: { desayuno:{cantidad:'todo',hora:'08:30'}, snack:{cantidad:'normal',hora:'11:15'}, comida:{cantidad:'todo',hora:'13:00'}, merienda:{cantidad:'normal',hora:'16:30'} } },
  8: { sueno: 9,  humor: '🤒', comidas: { desayuno:{cantidad:'poco',hora:'09:00'} } },
};

// ─── Perfiles de familia (hasta 2 por alumno) ────────────────────────────────
const FAMILIAS_INIT = {
  1: [
    { id:'f1a', nombre:'María Martínez', rol:'Mamá',  avatar:'M', color:'av-pink'   },
    { id:'f1b', nombre:'Carlos Martínez',rol:'Papá',  avatar:'C', color:'av-blue'   },
  ],
  2: [
    { id:'f2a', nombre:'Pedro García',   rol:'Papá',  avatar:'P', color:'av-blue'   },
    { id:'f2b', nombre:'Lucía García',   rol:'Mamá',  avatar:'L', color:'av-purple' },
  ],
  3: [
    { id:'f3a', nombre:'Ana López',      rol:'Mamá',  avatar:'A', color:'av-green'  },
  ],
  4: [
    { id:'f4a', nombre:'Carlos Sánchez', rol:'Papá',  avatar:'C', color:'av-orange' },
    { id:'f4b', nombre:'Elena Sánchez',  rol:'Mamá',  avatar:'E', color:'av-pink'   },
  ],
  5: [
    { id:'f5a', nombre:'Laura Torres',   rol:'Mamá',  avatar:'L', color:'av-purple' },
    { id:'f5b', nombre:'Raúl Torres',    rol:'Papá',  avatar:'R', color:'av-blue'   },
  ],
  6: [
    { id:'f6a', nombre:'José Ruiz',      rol:'Papá',  avatar:'J', color:'av-blue'   },
    { id:'f6b', nombre:'Carmen Ruiz',    rol:'Mamá',  avatar:'C', color:'av-green'  },
  ],
  7: [
    { id:'f7a', nombre:'Rosa Flores',    rol:'Mamá',  avatar:'R', color:'av-pink'   },
  ],
  8: [
    { id:'f8a', nombre:'Fernando Moreno',rol:'Papá',  avatar:'F', color:'av-green'  },
    { id:'f8b', nombre:'Pilar Moreno',   rol:'Mamá',  avatar:'P', color:'av-orange' },
  ],
};

// ─── Mensajes de chat (por alumnoId) ─────────────────────────────────────────
// tipo: 'centro' | familiaId
const MENSAJES_INIT = {
  1: [
    { id:1, de:'centro',    texto:'¡Buenos días! Sofía ha llegado muy contenta hoy.', hora:'08:20', leido:true  },
    { id:2, de:'f1a',       texto:'¡Qué buena noticia! Anoche durmió muy bien 😊', hora:'08:35', leido:true  },
    { id:3, de:'centro',    texto:'Ha comido todo en el almuerzo, incluida la fruta.', hora:'10:45', leido:true  },
    { id:4, de:'f1b',       texto:'Genial, gracias por avisarnos. ¿A qué hora la recogemos?', hora:'11:02', leido:false },
  ],
  2: [
    { id:1, de:'centro',    texto:'Lucas está participando mucho en las actividades de hoy.', hora:'09:15', leido:true },
    { id:2, de:'f2b',       texto:'Me alegro mucho, lleva días hablando del taller de música 🎵', hora:'09:30', leido:true },
  ],
  3: [
    { id:1, de:'f3a',       texto:'Hola, Emma tiene cita médica a las 13h, ¿podéis tenerla lista?', hora:'07:50', leido:true },
    { id:2, de:'centro',    texto:'Por supuesto, la tendremos lista a las 12:50. ¡Sin problema!', hora:'08:05', leido:true },
  ],
  4: [], 5: [], 6: [], 7: [], 8: [],
};

// ─── Estado global ────────────────────────────────────────────────────────────
let state = {
  alumnos:    JSON.parse(JSON.stringify(ALUMNOS)),
  profesores: JSON.parse(JSON.stringify(PROFESORES)),
  actividades:JSON.parse(JSON.stringify(ACTIVIDADES)),
  bienestar:  JSON.parse(JSON.stringify(BIENESTAR_INIT)),
  familias:   JSON.parse(JSON.stringify(FAMILIAS_INIT)),
  mensajes:   JSON.parse(JSON.stringify(MENSAJES_INIT)),
  usuarios:   JSON.parse(JSON.stringify(USUARIOS_INIT)),
  fichajes:   [],   // registro de entradas/salidas de profesores (solo superadmin)
  currentPage:       'dashboard',
  familiaAlumnoId:   1,
  chatAlumnoId:      1,
  _chatAbierto:      false,
};
