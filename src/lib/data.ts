import {
  User,
  Course,
  Role,
  Department,
  ChatChannel,
  AIConfig,
  Badge,
  CertificateTemplate,
} from './types';

export const roles: Role[] = [
  'Trabajador',
  'Personal Externo',
  'Formador',
  'Gestor de RRHH',
  'Jefe de Formación',
  'Administrador General',
];

export const departments: Department[] = [
  'Técnicos de Emergencias',
  'Teleoperadores',
  'Administración',
  'Formación',
  'Logística',
];

export const initialCostCategories: string[] = [
  'Honorarios Formador',
  'Licencias de Plataforma',
  'Equipamiento',
  'Logística y Dietas',
  'Otro',
];

export const announcementChannels: string[] = ['Todos', ...roles, ...departments];

const seedPasswordHash =
  '$argon2id$v=19$m=19456,t=3,p=1$fWWuu4iwZ3Dwpsyz4e8xTg$Rx5npDlr/O4dH2W7Ktb2eR6uF0g1AYoRxTTZLBkd8ko';

export const users: Omit<User, 'isSynced' | 'updatedAt'>[] = [
  {
    id: 'user_1',
    name: 'Elena Vargas',
    email: 'elena.vargas@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user1',
    role: 'Administrador General',
    department: 'Administración',
    points: 120,
    notificationSettings: { consent: true, channels: ['email', 'app'] },
    status: 'approved',
  },
  {
    id: 'user_2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user2',
    role: 'Trabajador',
    department: 'Técnicos de Emergencias',
    points: 50,
    notificationSettings: { consent: true, channels: ['app'] },
    status: 'approved',
  },
  {
    id: 'user_3',
    name: 'Ana Gómez',
    email: 'ana.gomez@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user3',
    role: 'Trabajador',
    department: 'Teleoperadores',
    points: 210,
    notificationSettings: { consent: false, channels: [] },
    status: 'approved',
  },
  {
    id: 'user_4',
    name: 'Dr. Alejandro Torres',
    email: 'alejandro.torres@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user4',
    role: 'Formador',
    department: 'Formación',
    points: 0,
    notificationSettings: { consent: true, channels: ['email'] },
    status: 'approved',
  },
  {
    id: 'user_5',
    name: 'Lucía Fernández',
    email: 'lucia.fernandez@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user5',
    role: 'Jefe de Formación',
    department: 'Formación',
    points: 300,
    notificationSettings: { consent: true, channels: ['email', 'whatsapp', 'app'] },
    status: 'approved',
  },
  {
    id: 'user_6',
    name: 'Marcos Solís',
    email: 'marcos.solis@example.com',
    passwordHash: seedPasswordHash,
    avatar: 'https://i.pravatar.cc/150?u=user6',
    role: 'Gestor de RRHH',
    department: 'Administración',
    points: 15,
    notificationSettings: { consent: true, channels: ['email'] },
    status: 'approved',
  },
];

export const courses: Omit<Course, 'progress'>[] = [
  {
    id: 'course_1',
    title: 'Soporte Vital Básico (SVB) y DEA',
    description: 'Aprende técnicas de SVB y el manejo del Desfibrilador Externo Automático.',
    longDescription:
      'Este curso esencial proporciona la formación necesaria para responder ante una parada cardiorrespiratoria. Incluye prácticas con maniquíes de última generación, el uso correcto del DEA, y la aplicación del protocolo PAS (Proteger, Alertar, Socorrer). Formación obligatoria y certificada para todo el personal técnico.',
    instructor: 'Dr. Alejandro Torres',
    duration: '8 horas',
    modality: 'Presencial',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'paramedic cpr',
    startDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    modules: [
      {
        id: 'm1_1',
        title: 'Cadena de Supervivencia',
        duration: '1 hora',
        content: 'Contenido sobre la cadena de supervivencia.',
      },
      {
        id: 'm1_2',
        title: 'Maniobras de RCP en Adultos y Niños',
        duration: '4 horas',
        content: 'Contenido sobre maniobras de RCP.',
      },
      {
        id: 'm1_3',
        title: 'Uso del Desfibrilador (DEA)',
        duration: '3 horas',
        content: 'Contenido sobre el uso del DEA.',
      },
    ],
  },
  {
    id: 'course_2',
    title: 'Conducción de Vehículos de Emergencia',
    description: 'Perfecciona tus habilidades de conducción segura y eficiente de ambulancias.',
    longDescription:
      'Curso avanzado de conducción enfocado en la seguridad y la eficiencia en el transporte sanitario urgente. Se practican técnicas de conducción evasiva, uso de señales acústicas y luminosas, y mantenimiento preventivo del vehículo. Incluye sesiones en simulador y prácticas en circuito cerrado.',
    instructor: 'Javier Roca',
    duration: '20 horas',
    modality: 'Mixta',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'ambulance driving',
    startDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 16)).toISOString(),
    modules: [
      {
        id: 'm2_1',
        title: 'Normativa y Seguridad Vial',
        duration: '4 horas',
        content: 'Contenido sobre normativa.',
      },
      {
        id: 'm2_2',
        title: 'Técnicas de Conducción Segura',
        duration: '8 horas',
        content: 'Contenido sobre técnicas de conducción.',
      },
      {
        id: 'm2_3',
        title: 'Prácticas en Simulador',
        duration: '8 horas',
        content: 'Contenido sobre prácticas en simulador.',
      },
    ],
  },
  {
    id: 'course_3',
    title: 'Gestión de Comunicaciones en Emergencias',
    description: 'Protocolos de comunicación para teleoperadores y equipos en terreno.',
    longDescription:
      'Este curso para teleoperadores y técnicos se centra en la correcta gestión de las comunicaciones. Aprenderás a utilizar los sistemas de radio, a clasificar incidentes según su prioridad (triage telefónico), a dar instrucciones pre-llegada y a coordinarte eficazmente con los equipos en el terreno. Se realizan simulacros de llamadas de emergencia.',
    instructor: 'Lucía Fernández',
    duration: '12 horas',
    modality: 'Online',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'emergency dispatcher',
    startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    modules: [
      {
        id: 'm3_1',
        title: 'Protocolo de Comunicaciones',
        duration: '3 horas',
        content: 'Contenido sobre protocolos.',
      },
      {
        id: 'm3_2',
        title: 'Triage Telefónico',
        duration: '5 horas',
        content: 'Contenido sobre triage.',
      },
      {
        id: 'm3_3',
        title: 'Coordinación de Equipos',
        duration: '4 horas',
        content: 'Contenido sobre coordinación.',
      },
    ],
  },
  {
    id: 'course_4',
    title: 'Manejo de Estrés y Apoyo Psicológico',
    description:
      'Herramientas para la gestión del estrés y el cuidado de la salud mental del interviniente.',
    longDescription:
      'El trabajo en emergencias es altamente estresante. Este curso proporciona herramientas prácticas para el manejo del estrés agudo y crónico, técnicas de desactivación emocional post-incidente y pautas para la detección precoz de problemas de salud mental en uno mismo y en los compañeros. Impartido por psicólogos especializados en emergencias.',
    instructor: 'Dra. Isabel Soler',
    duration: '10 horas',
    modality: 'Online',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'mental health support',
    startDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(),
    modules: [
      {
        id: 'm4_1',
        title: 'Fisiología del Estrés',
        duration: '2 horas',
        content: 'Contenido sobre estrés.',
      },
      {
        id: 'm4_2',
        title: 'Técnicas de Afrontamiento',
        duration: '5 horas',
        content: 'Contenido sobre técnicas de afrontamiento.',
      },
      {
        id: 'm4_3',
        title: 'Primeros Auxilios Psicológicos',
        duration: '3 horas',
        content: 'Contenido sobre primeros auxilios psicológicos.',
      },
    ],
  },
  {
    id: 'course_5',
    title: 'Manejo Avanzado de la Vía Aérea',
    description:
      'Técnicas y dispositivos para el manejo avanzado de la vía aérea en situaciones críticas.',
    longDescription:
      'Este curso práctico está diseñado para que los técnicos de emergencias dominen las habilidades de intubación, uso de mascarillas laríngeas y otros dispositivos supraglóticos. Incluye prácticas intensivas en simuladores de alta fidelidad.',
    instructor: 'Dr. Alejandro Torres',
    duration: '16 horas',
    modality: 'Presencial',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'airway management paramedic',
    startDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
    modules: [
      {
        id: 'm5_1',
        title: 'Anatomía y Fisiología de la Vía Aérea',
        duration: '2 horas',
        content: 'Repaso anatómico y fisiológico.',
      },
      {
        id: 'm5_2',
        title: 'Dispositivos Supraglóticos',
        duration: '6 horas',
        content: 'Uso de mascarilla laríngea, tubo laríngeo, etc.',
      },
      {
        id: 'm5_3',
        title: 'Intubación Endotraqueal',
        duration: '8 horas',
        content: 'Técnicas de laringoscopia e intubación.',
      },
    ],
  },
  {
    id: 'course_6',
    title: 'Farmacología en Urgencias',
    description:
      'Conoce los fármacos más comunes en emergencias, sus dosis y vías de administración.',
    longDescription:
      'Curso online completo sobre la farmacología de uso frecuente en el ámbito prehospitalario. Se revisan las indicaciones, contraindicaciones, dosis y vías de administración de medicamentos para patologías cardíacas, respiratorias, neurológicas y traumatismos.',
    instructor: 'Dra. Isabel Soler',
    duration: '25 horas',
    modality: 'Online',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'pharmacology emergency',
    modules: [
      {
        id: 'm6_1',
        title: 'Principios de Farmacocinética',
        duration: '5 horas',
        content: 'Conceptos básicos de farmacología.',
      },
      {
        id: 'm6_2',
        title: 'Fármacos en SVB y SVA',
        duration: '10 horas',
        content: 'Adrenalina, amiodarona, atropina, etc.',
      },
      {
        id: 'm6_3',
        title: 'Analgesia y Sedación',
        duration: '10 horas',
        content: 'Manejo del dolor y sedoanalgesia.',
      },
    ],
  },
  {
    id: 'course_7',
    title: 'Técnicas de Inmovilización y Movilización',
    description:
      'Aprende a movilizar e inmovilizar pacientes con sospecha de lesión medular de forma segura.',
    longDescription:
      'Este curso mixto combina teoría online con talleres prácticos intensivos para asegurar la correcta inmovilización y movilización de pacientes traumatizados. Se practica el uso de collarines, tablero espinal, colchón de vacío y férulas.',
    instructor: 'Javier Roca',
    duration: '14 horas',
    modality: 'Mixta',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'patient immobilization training',
    startDate: new Date(new Date().setDate(new Date().getDate() + 45)).toISOString(),
    modules: [
      {
        id: 'm7_1',
        title: 'Biomecánica del Trauma',
        duration: '4 horas',
        content: 'Estudio de las lesiones por trauma (online).',
      },
      {
        id: 'm7_2',
        title: 'Taller de Inmovilización Cervical',
        duration: '5 horas',
        content: 'Prácticas de colocación de collarín y DAMA (presencial).',
      },
      {
        id: 'm7_3',
        title: 'Taller de Movilización en Bloque',
        duration: '5 horas',
        content: 'Uso de tablero espinal y cuchara (presencial).',
      },
    ],
  },
  {
    id: 'course_8',
    title: 'Atención al Paciente Pediátrico',
    description: 'Protocolos y técnicas específicas para la atención de emergencias pediátricas.',
    longDescription:
      'Curso esencial que cubre las diferencias anatómicas y fisiológicas de los niños, la evaluación pediátrica, el manejo de la vía aérea, y las emergencias más comunes en pediatría.',
    instructor: 'Dra. Ana Gómez',
    duration: '18 horas',
    modality: 'Presencial',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'pediatric emergency care',
    modules: [
      {
        id: 'm8_1',
        title: 'Triángulo de Evaluación Pediátrica',
        duration: '4 horas',
        content: 'Contenido sobre evaluación pediátrica.',
      },
      {
        id: 'm8_2',
        title: 'RCP Pediátrica y OVACE',
        duration: '8 horas',
        content: 'Contenido sobre reanimación pediátrica.',
      },
      {
        id: 'm8_3',
        title: 'Manejo de Fiebre y Convulsiones',
        duration: '6 horas',
        content: 'Contenido sobre emergencias pediátricas comunes.',
      },
    ],
  },
  {
    id: 'course_9',
    title: 'Actualización en Traumatología Grave',
    description: 'Revisión de los últimos protocolos para el manejo del paciente politraumatizado.',
    longDescription:
      'Curso online de actualización sobre la evaluación y manejo del trauma grave, siguiendo las directrices del PHTLS. Incluye control de hemorragias, manejo de shock y trauma torácico.',
    instructor: 'Dr. Carlos Ruiz',
    duration: '30 horas',
    modality: 'Online',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'trauma care update',
    modules: [
      {
        id: 'm9_1',
        title: 'Evaluación Primaria (XABCDE)',
        duration: '10 horas',
        content: 'Contenido sobre evaluación de trauma.',
      },
      {
        id: 'm9_2',
        title: 'Manejo del Shock Hemorrágico',
        duration: '10 horas',
        content: 'Contenido sobre shock.',
      },
      {
        id: 'm9_3',
        title: 'Traumatismo Craneoencefálico y Torácico',
        duration: '10 horas',
        content: 'Contenido sobre tipos de trauma.',
      },
    ],
  },
  {
    id: 'course_10',
    title: 'Intervención en Incidentes con Múltiples Víctimas',
    description: 'Aprende los principios de triage y organización en catástrofes y accidentes.',
    longDescription:
      'Este curso mixto combina teoría online y un simulacro presencial para preparar a los equipos a responder en situaciones de IMV (Incidentes de Múltiples Víctimas). Se practica el triage START y la coordinación entre equipos.',
    instructor: 'Javier Roca',
    duration: '22 horas',
    modality: 'Mixta',
    status: 'published',
    image: 'https://placehold.co/600x400.png',
    aiHint: 'mass casualty incident',
    modules: [
      {
        id: 'm10_1',
        title: 'Principios de IMV y Mando',
        duration: '8 horas',
        content: 'Contenido teórico sobre IMV.',
      },
      {
        id: 'm10_2',
        title: 'Técnicas de Triage (START, Sieve)',
        duration: '6 horas',
        content: 'Contenido sobre métodos de triage.',
      },
      {
        id: 'm10_3',
        title: 'Simulacro Práctico Integrado',
        duration: '8 horas',
        content: 'Ejercicio práctico de un IMV.',
      },
    ],
  },
];

export const initialCosts = [
  {
    item: 'Honorarios Dr. Torres (SVB)',
    category: 'Honorarios Formador',
    amount: 1800,
    date: '2024-05-15',
    courseId: 'course_1',
  },
  {
    item: 'Licencias Simulador Conducción',
    category: 'Licencias de Plataforma',
    amount: 1200,
    date: '2024-05-10',
    courseId: 'course_2',
  },
  {
    item: 'Maniquíes RCP (x5)',
    category: 'Equipamiento',
    amount: 3500,
    date: '2024-05-20',
    courseId: 'course_1',
  },
  {
    item: 'Alquiler circuito prácticas',
    category: 'Logística y Dietas',
    amount: 900,
    date: '2024-04-25',
    courseId: 'course_2',
  },
  {
    item: 'Honorarios L. Fernández (Comms)',
    category: 'Honorarios Formador',
    amount: 1550,
    date: '2024-06-01',
    courseId: 'course_3',
  },
  {
    item: 'Suscripción General Plataforma E-learning',
    category: 'Licencias de Plataforma',
    amount: 400,
    date: '2024-06-05',
  },
  {
    item: 'Catering curso SVB',
    category: 'Logística y Dietas',
    amount: 800,
    date: '2024-05-21',
    courseId: 'course_1',
  },
];

export const initialChatChannels: ChatChannel[] = [
  {
    id: 'channel_general',
    name: 'general',
    description: 'Canal para temas generales y avisos para toda la empresa.',
    type: 'public',
  },
  {
    id: 'channel_formacion',
    name: 'dudas-formacion',
    description: 'Preguntas y respuestas sobre los cursos de la plataforma.',
    type: 'public',
  },
  {
    id: 'channel_rrhh',
    name: 'rrhh',
    description: 'Consultas sobre recursos humanos, nóminas y contratos.',
    type: 'public',
  },
  {
    id: 'channel_soporte',
    name: 'soporte-tecnico',
    description: '¿Problemas con la plataforma? Informa de incidencias aquí.',
    type: 'public',
  },
  {
    id: 'channel_emergencias',
    name: 'casos-clinicos',
    description: 'Discusión de casos clínicos y procedimientos.',
    type: 'public',
  },
  {
    id: 'channel_random',
    name: 'random',
    description: 'Para conversaciones distendidas y temas no relacionados con el trabajo.',
    type: 'public',
  },
];

export const initialBadges: Badge[] = [
  {
    id: 'first_module',
    name: 'Primeros Pasos',
    description: 'Completa tu primer módulo.',
    icon: 'StepForward',
  },
  {
    id: '5_modules',
    name: 'Alumno Constante',
    description: 'Completa 5 módulos en total.',
    icon: 'BookMarked',
  },
  {
    id: '15_modules',
    name: 'Maestro del Saber',
    description: 'Completa 15 módulos en total.',
    icon: 'Library',
  },
  { id: 'first_course', name: 'Pionero', description: 'Completa tu primer curso.', icon: 'Rocket' },
  {
    id: '3_courses',
    name: 'Especialista',
    description: 'Completa 3 cursos.',
    icon: 'GraduationCap',
  },
  {
    id: 'perfect_score',
    name: 'Perfeccionista',
    description: 'Obtén un 100% en un test de IA.',
    icon: 'Target',
  },
  {
    id: 'forum_first_post',
    name: 'Rompiendo el Hielo',
    description: 'Publica tu primer mensaje en un foro.',
    icon: 'MessageSquarePlus',
  },
  {
    id: 'forum_collaborator',
    name: 'Colaborador Activo',
    description: 'Publica 5 mensajes en los foros.',
    icon: 'MessagesSquare',
  },
  {
    id: 'weekend_warrior',
    name: 'Guerrero de Fin de Semana',
    description: 'Completa un módulo durante el fin de semana.',
    icon: 'Coffee',
  },
  {
    id: 'on_time_completion',
    name: 'Puntualidad Impecable',
    description: 'Completa un curso antes de su fecha de finalización.',
    icon: 'CalendarCheck',
  },
];

export const initialCertificateTemplates: CertificateTemplate[] = [
  {
    id: 'tpl_clasico',
    name: 'Certificado Clásico',
    type: 'Clásico',
    description: 'Plantilla clásica con diseño formal.',
    isActive: true,
    createdAt: new Date().toISOString(),
    isSynced: true,
  },
  {
    id: 'tpl_moderno',
    name: 'Certificado Moderno',
    type: 'Moderno',
    description: 'Diseño moderno con estilos limpios.',
    isActive: true,
    createdAt: new Date().toISOString(),
    isSynced: true,
  },
  {
    id: 'tpl_profesional',
    name: 'Certificado Profesional',
    type: 'Profesional',
    description: 'Plantilla profesional con énfasis corporativo.',
    isActive: true,
    createdAt: new Date().toISOString(),
    isSynced: true,
  },
];

export const defaultAIConfig: AIConfig = {
  id: 'singleton',
  activeModel: 'Gemini',
  enabledFeatures: {
    courseGeneration: true,
    questionGeneration: true,
    summarization: true,
    tutor: true,
    recommendations: true,
    feedback: true,
    abandonmentPrediction: true,
    emailGeneration: true,
  },
  defaultCertificateTemplate: 'Clásico',
};

// Enrollments de ejemplo para usuarios demo
import type { Enrollment, UserProgress } from './types';

export const initialEnrollments: Omit<Enrollment, 'id'>[] = [
  // Elena Vargas (user_1) - Administrador General
  {
    studentId: 'user_1',
    courseId: 'course_1',
    requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },
  {
    studentId: 'user_1',
    courseId: 'course_3',
    requestDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },
  {
    studentId: 'user_1',
    courseId: 'course_4',
    requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },
  {
    studentId: 'user_1',
    courseId: 'course_6',
    requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },

  // Carlos Ruiz (user_2) - Trabajador
  {
    studentId: 'user_2',
    courseId: 'course_1',
    requestDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },
  {
    studentId: 'user_2',
    courseId: 'course_2',
    requestDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },

  // Ana Gómez (user_3) - Trabajador
  {
    studentId: 'user_3',
    courseId: 'course_3',
    requestDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },
  {
    studentId: 'user_3',
    courseId: 'course_5',
    requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    isSynced: true,
  },

  // Lucía Fernández (user_5) - Jefe de Formación
  {
    studentId: 'user_5',
    courseId: 'course_1',
    requestDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    isSynced: true,
  },
  {
    studentId: 'user_5',
    courseId: 'course_2',
    requestDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    isSynced: true,
  },
  {
    studentId: 'user_5',
    courseId: 'course_3',
    requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    isSynced: true,
  },
];

// Progreso de usuario de ejemplo
export const initialUserProgress: Omit<UserProgress, 'id'>[] = [
  // Elena Vargas - Progreso en curso 1 (2 de 3 módulos completados)
  {
    userId: 'user_1',
    courseId: 'course_1',
    completedModules: ['m1_1', 'm1_2'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
  // Elena Vargas - Progreso en curso 3 (1 de 3 módulos completados)
  {
    userId: 'user_1',
    courseId: 'course_3',
    completedModules: ['m3_1'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
  // Elena Vargas - Progreso en curso 4 (0 de 3 módulos - recién empezado)
  {
    userId: 'user_1',
    courseId: 'course_4',
    completedModules: [],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },

  // Carlos Ruiz - Progreso en curso 1 (completado)
  {
    userId: 'user_2',
    courseId: 'course_1',
    completedModules: ['m1_1', 'm1_2', 'm1_3'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
  // Carlos Ruiz - Progreso en curso 2 (1 de 3 módulos)
  {
    userId: 'user_2',
    courseId: 'course_2',
    completedModules: ['m2_1'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },

  // Ana Gómez - Progreso en curso 3 (2 de 3 módulos)
  {
    userId: 'user_3',
    courseId: 'course_3',
    completedModules: ['m3_1', 'm3_2'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },

  // Lucía Fernández - Todos los cursos completados
  {
    userId: 'user_5',
    courseId: 'course_1',
    completedModules: ['m1_1', 'm1_2', 'm1_3'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'user_5',
    courseId: 'course_2',
    completedModules: ['m2_1', 'm2_2', 'm2_3'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'user_5',
    courseId: 'course_3',
    completedModules: ['m3_1', 'm3_2', 'm3_3'],
    isSynced: true,
    updatedAt: new Date().toISOString(),
  },
];
