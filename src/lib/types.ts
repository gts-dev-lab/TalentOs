import { z } from 'zod';

export type Role =
  | 'Trabajador'
  | 'Personal Externo'
  | 'Formador'
  | 'Gestor de RRHH'
  | 'Jefe de Formación'
  | 'Administrador General';

export type Department =
  | 'Técnicos de Emergencias'
  | 'Teleoperadores'
  | 'Administración'
  | 'Formación'
  | 'Logística';

export type NotificationChannel = 'email' | 'whatsapp' | 'app';
export const notificationChannels: NotificationChannel[] = ['email', 'whatsapp', 'app'];

export type UserStatus = 'pending_approval' | 'approved' | 'suspended';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string; // Added phone number
  avatar: string;
  role: Role;
  department: Department;
  points: number;
  status: UserStatus;
  fcmToken?: string; // Deprecated: Ya no se usa Firebase. Mantenido para compatibilidad.

  notificationSettings: {
    consent: boolean;
    channels: NotificationChannel[];
  };

  isSynced?: boolean;
  updatedAt?: string; // ISO date string
  /** UUID v4 del inquilino (multi-tenant; TT-102) */
  tenantId?: string;
  /** RGPD derecho al olvido: marca de tiempo UTC (ISO 8601). Si está definido, el usuario está borrado lógicamente (TT-110). */
  deletedAt?: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  duration: string;
  modality: 'Online' | 'Presencial' | 'Mixta';
  image: string;
  aiHint: string;
  modules: Module[];
  status: 'draft' | 'published';
  isScorm?: boolean;
  scormPackage?: Blob;
  mandatoryForRoles?: Role[];
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  category?: string;
  capacity?: number;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export const enrollmentStatuses = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'waitlisted',
  'active',
  'completed',
  'expelled',
  'expired',
  'needs_review',
] as const;
export type EnrollmentStatus = (typeof enrollmentStatuses)[number];

export type Enrollment = {
  id?: number; // auto-incremented primary key
  studentId: string;
  courseId: string;
  requestDate: string; // ISO date string
  status: EnrollmentStatus;
  justification?: string; // For admin feedback on approval/rejection
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type UserProgress = {
  id?: number; // auto-incremented primary key
  userId: string;
  courseId: string;
  completedModules: string[]; // Array of completed module IDs
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type Module = {
  id: string;
  title: string;
  duration: string;
  content: string;
};

export type CustomCostCategory = {
  id?: number;
  name: string;
};

export type Cost = {
  id?: number;
  item: string;
  category: string;
  amount: number;
  date: string; // ISO date string
  courseId?: string;
  userId?: string; // Who registered the cost
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type LearningPath = {
  id?: number;
  title: string;
  description: string;
  targetRole: Role;
  courseIds: string[]; // Ordered list of course IDs
  isSynced?: boolean;
  updatedAt?: string;
};

export type UserLearningPathProgress = {
  id?: number;
  userId: string;
  learningPathId: number;
  completedCourseIds: string[]; // Unordered list of completed course IDs from the path
  isSynced?: boolean;
  updatedAt?: string;
};

export type PDIStatus = 'draft' | 'active' | 'completed' | 'archived';

export type PDIMilestone = {
  id: string;
  title: string;
  description?: string;
  targetDate?: string; // ISO date string
  completed: boolean;
  completedAt?: string; // ISO date string
  notes?: string;
};

export type PDIReview = {
  id: string;
  reviewDate: string; // ISO date string
  reviewerId: string; // Manager/supervisor who reviewed
  reviewerName: string;
  progress: number; // 0-100
  feedback: string;
  nextSteps?: string;
  createdAt: string; // ISO date string
};

export type IndividualDevelopmentPlan = {
  id: string;
  userId: string; // Employee this PDI belongs to
  managerId: string; // Manager/supervisor who created/manages this PDI
  title: string;
  description?: string;
  objectives: string[]; // Development objectives
  courseIds: string[]; // Courses assigned for this PDI
  milestones: PDIMilestone[];
  reviews: PDIReview[];
  startDate: string; // ISO date string
  endDate?: string; // ISO date string (optional, can be ongoing)
  status: PDIStatus;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  isSynced?: boolean;
};

export type RegulationType =
  | 'ISO'
  | 'PRL'
  | 'GDPR'
  | 'LOPD'
  | 'Ley'
  | 'Normativa'
  | 'Certificación'
  | 'Otro';

export type Regulation = {
  id: string;
  code: string; // e.g., "ISO 9001:2015", "RD 39/1997"
  name: string;
  description?: string;
  type: RegulationType;
  applicableRoles: Role[]; // Roles that must comply with this regulation
  applicableDepartments?: Department[]; // Optional: specific departments
  courseIds: string[]; // Courses that fulfill this regulation
  validityPeriod?: number; // Validity period in months (e.g., 24 for 2 years)
  requiresRenewal: boolean; // Whether this regulation requires periodic renewal
  renewalPeriod?: number; // Renewal period in months
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  isActive: boolean;
  isSynced?: boolean;
};

export type RegulationCompliance = {
  id: string;
  userId: string;
  regulationId: string;
  complianceDate: string; // ISO date string - when user became compliant
  expirationDate?: string; // ISO date string - when compliance expires (if applicable)
  certificateId?: string; // Optional: link to certificate
  verifiedBy?: string; // User ID who verified the compliance
  verifiedAt?: string; // ISO date string
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  isSynced?: boolean;
};

export type ComplianceAudit = {
  id: string;
  regulationId: string;
  auditDate: string; // ISO date string
  auditorId: string; // User ID of the auditor
  auditorName: string;
  scope: string; // What was audited (e.g., "All employees in Técnicos de Emergencias")
  findings: string; // Audit findings
  complianceRate: number; // 0-100
  nonCompliantUserIds: string[]; // Users who are not compliant
  recommendations?: string;
  status: 'draft' | 'completed' | 'archived';
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  isSynced?: boolean;
};

// For displaying pending enrollments with user and course names
export type PendingEnrollmentDetails = Enrollment & {
  userName: string;
  courseTitle: string;
};

// For displaying ANY enrollment with details
export type EnrollmentWithDetails = Enrollment & {
  userName: string;
  userEmail: string;
  courseTitle: string;
  courseImage: string;
};

export type ForumMessage = {
  id?: number;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string; // ISO date string
  parentId: number | null; // For threading
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ForumMessageWithReplies = ForumMessage & {
  replies: ForumMessageWithReplies[];
};

export type Notification = {
  id?: number;
  userId: string;
  message: string;
  type:
    | 'enrollment_approved'
    | 'new_course'
    | 'forum_reply'
    | 'course_announcement'
    | 'badge_unlocked'
    | 'course_deadline_reminder'
    | 'push_test';
  relatedUrl?: string;
  isRead: boolean;
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ResourceType = 'pdf' | 'video' | 'link' | 'document';

export type Resource = {
  id?: number;
  name: string;
  type: ResourceType;
  url: string; // For links, this is the URL. For files, it will be a data URI.
  uploadedAt: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type CourseResource = {
  id?: number;
  courseId: string;
  resourceId: number;
};

export type AnnouncementType = 'Urgente' | 'Informativo' | 'Mantenimiento';

export const announcementTypes: AnnouncementType[] = ['Urgente', 'Informativo', 'Mantenimiento'];

export type Announcement = {
  id?: number;
  title: string;
  content: string;
  type: AnnouncementType;
  channels: string[]; // Array of Role, Department names, or 'Todos'
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ChatChannel = {
  id: number | string; // Can be number (auto-inc) or string (manual)
  name: string;
  description?: string;
  type: 'public' | 'private';
  participantIds?: string[];
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ChatMessage = {
  id?: number;
  channelId: number | string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type ComplianceReportData = {
  userId: string;
  userName: string;
  userRole: Role;
  mandatoryCoursesCount: number;
  completedCoursesCount: number;
  complianceRate: number;
};

export type DirectMessageThread = ChatChannel & {
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
  };
};

export type CalendarEventType = 'clase' | 'examen' | 'entrega' | 'taller' | 'otro';
export const calendarEventTypes: CalendarEventType[] = [
  'clase',
  'examen',
  'entrega',
  'taller',
  'otro',
];

export type CalendarEvent = {
  id?: number;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  courseId: string;
  type: CalendarEventType;
  videoCallLink?: string;
  createdBy: string;
  modifiedBy: string;
  isCompleted: boolean;
  isSynced?: boolean;
  updatedAt?: string;
};

export const externalTrainingTypes = [
  'Curso',
  'Certificación',
  'Máster',
  'Taller',
  'Conferencia',
  'Otro',
] as const;
export type ExternalTrainingType = (typeof externalTrainingTypes)[number];

export type ExternalTraining = {
  id?: number;
  userId: string;
  title: string;
  type: ExternalTrainingType;
  institution: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  fileUrl?: string; // URL to the certificate
  comments?: string;
  isRelevant?: boolean;
  isSynced?: boolean;
  updatedAt?: string; // ISO date string
};

export type StudentForManagement = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  progress: number;
  status: EnrollmentStatus;
};

// --- Gamification Types ---

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
};

export type UserBadge = {
  id?: number;
  userId: string;
  badgeId: string;
  earnedAt: string; // ISO date string
  isSynced?: boolean;
  updatedAt?: string;
};

// --- AI & General App Management Types ---

export const aiModels = ['Gemini', 'OpenAI', 'Claude', 'HuggingFace', 'Whisper'] as const;
export type AIModel = (typeof aiModels)[number];

export const aiFeatures = [
  {
    id: 'courseGeneration',
    label: 'Generador de Cursos',
    description: 'Permite crear una estructura de curso desde un tema.',
  },
  {
    id: 'questionGeneration',
    label: 'Generador de Cuestionarios',
    description: 'Crea tests a partir del contenido del curso.',
  },
  {
    id: 'summarization',
    label: 'Resumen Automático de Módulos',
    description: 'Genera resúmenes del contenido de los módulos.',
  },
  {
    id: 'tutor',
    label: 'Tutor Virtual IA',
    description: 'Permite a los usuarios chatear con una IA sobre el curso.',
  },
  {
    id: 'recommendations',
    label: 'Recomendaciones de Cursos',
    description: 'Sugiere cursos basados en el perfil del usuario.',
  },
  {
    id: 'feedback',
    label: 'Feedback de Ejercicios',
    description: 'Da feedback personalizado sobre los resultados de los tests.',
  },
  {
    id: 'abandonmentPrediction',
    label: 'Predicción de Abandono',
    description: 'Analiza el riesgo de que un alumno abandone.',
  },
  {
    id: 'emailGeneration',
    label: 'Redacción de Emails',
    description: 'Genera borradores de emails para comunicaciones.',
  },
] as const;

export type AIFeature = (typeof aiFeatures)[number]['id'];

export const certificateTemplates = ['Clásico', 'Moderno', 'Profesional'] as const;
export type CertificateTemplateType = (typeof certificateTemplates)[number];

// --- Certificate Types ---
export type CertificateStatus = 'active' | 'expired' | 'revoked';

export type CertificateTemplate = {
  id: string;
  name: string;
  type: CertificateTemplateType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  isSynced?: boolean;
};

export type Certificate = {
  id: string;
  userId: string;
  courseId: string;
  templateId: string;
  verificationCode: string;
  issuedAt: string;
  expiresAt?: string;
  renewedFromId?: string;
  status: CertificateStatus;
  pdfDataUrl?: string;
  isSynced?: boolean;
  updatedAt?: string;
};

export type AIConfig = {
  id: 'singleton'; // Primary key for the single config object
  activeModel: AIModel;
  enabledFeatures: Record<AIFeature, boolean>;
  defaultCertificateTemplate: CertificateTemplateType;
};

export type AIUsageLog = {
  id?: number;
  timestamp: string; // ISO string
  userId: string;
  feature: AIFeature;
  modelUsed: AIModel;
  isSynced?: boolean;
};

// --- Survey and Rating Types ---

export type CourseRating = {
  id?: number;
  courseId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  instructorName: string;
  rating: number; // 1-5
  instructorRating: number; // 1-5
  comment: string;
  timestamp: string; // ISO string
  isPublic?: boolean;
  isSynced?: boolean;
  updatedAt?: string;
};

// --- Permission Types ---
export type RolePermission = {
  role: Role;
  visibleNavs: string[]; // Array of nav item hrefs
};

// --- System Log Types ---
export const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
export type LogLevel = (typeof logLevels)[number];

export type SystemLog = {
  id?: number;
  timestamp: string; // ISO date string
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
};

/** TT-108: Estado CMI SCORM 2004 por usuario/curso (persistencia RTE). */
export type ScormCmiState = {
  id?: number;
  userId: string;
  courseId: string;
  /** SCORM 2004: incomplete | completed */
  completionStatus: string;
  /** SCORM 2004: passed | failed | unknown */
  successStatus: string;
  /** 0–1, precisión según RTE */
  scoreScaled: number;
  /** String max 1000 (SCORM RTE) */
  location: string;
  suspendData: string;
  updatedAt: string; // ISO 8601 UTC
};

// --- AI Flow Schemas ---

// From: src/ai/flows/announcement-email-generation.ts
export const GenerateAnnouncementEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  announcementTitle: z.string().describe('The title of the announcement.'),
  announcementContent: z.string().describe('The content of the announcement.'),
});
export type GenerateAnnouncementEmailInput = z.infer<typeof GenerateAnnouncementEmailInputSchema>;

export const GenerateAnnouncementEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email, formatted for an email client.'),
});
export type GenerateAnnouncementEmailOutput = z.infer<typeof GenerateAnnouncementEmailOutputSchema>;

// From: src/ai/flows/course-suggestion.ts
export const PersonalizedCourseRecommendationsInputSchema = z.object({
  userRole: z
    .string()
    .describe(
      "The user's current role in the organization (e.g., 'Técnico de Emergencias', 'Jefe de Formación')."
    ),
  enrolledCourseTitles: z
    .array(z.string())
    .describe(
      'A list of titles of internal courses the user is already enrolled in or has completed.'
    ),
  externalTrainingTitles: z
    .array(z.string())
    .describe('A list of titles of external courses or certifications the user has registered.'),
  allAvailableCourseTitles: z
    .array(z.string())
    .describe(
      'The complete list of internal course titles available in the catalog for suggestion.'
    ),
});
export type PersonalizedCourseRecommendationsInput = z.infer<
  typeof PersonalizedCourseRecommendationsInputSchema
>;

const SuggestionSchema = z.object({
  courseTitle: z
    .string()
    .describe(
      'The title of the suggested course. Must be one of the titles from the `allAvailableCourseTitles` list.'
    ),
  reason: z
    .string()
    .describe(
      'A brief, one-sentence explanation for why this course is being recommended to the user, in Spanish.'
    ),
});

export const PersonalizedCourseRecommendationsOutputSchema = z.object({
  suggestions: z
    .array(SuggestionSchema)
    .max(3)
    .describe('An array of up to 3 course recommendations.'),
});
export type PersonalizedCourseRecommendationsOutput = z.infer<
  typeof PersonalizedCourseRecommendationsOutputSchema
>;

// From: src/ai/flows/course-tutor.ts
const ChatHistoryPartSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});
export const CourseTutorInputSchema = z.object({
  courseContent: z.string().describe('The full content of the course.'),
  question: z.string().describe("The user's current question about the course."),
  history: z
    .array(ChatHistoryPartSchema)
    .optional()
    .describe('The history of the conversation so far.'),
});
export type CourseTutorInput = z.infer<typeof CourseTutorInputSchema>;

export const CourseTutorOutputSchema = z.object({
  answer: z.string().describe("The AI tutor's answer to the question."),
});
export type CourseTutorOutput = z.infer<typeof CourseTutorOutputSchema>;

// From: src/ai/flows/feedback-personalization.ts
export const PersonalizedFeedbackInputSchema = z.object({
  studentName: z.string().describe('The name of the student receiving feedback.'),
  assignmentName: z.string().describe('The name of the assignment or test.'),
  score: z.number().describe('The final score of the student as a percentage.'),
  questions: z
    .array(
      z.object({
        question: z.string(),
        studentAnswer: z.string(),
        correctAnswer: z.string(),
      })
    )
    .describe('The list of questions, student answers, and correct answers.'),
});
export type PersonalizedFeedbackInput = z.infer<typeof PersonalizedFeedbackInputSchema>;

export const PersonalizedFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Personalized feedback for the student.'),
});
export type PersonalizedFeedbackOutput = z.infer<typeof PersonalizedFeedbackOutputSchema>;

// From: src/ai/flows/generate-course-from-topic.ts
export const GenerateCourseFromTopicInputSchema = z
  .string()
  .describe('The topic for which to generate the course.');
export type GenerateCourseFromTopicInput = z.infer<typeof GenerateCourseFromTopicInputSchema>;

const AIGeneratedModuleSchema = z.object({
  title: z.string().describe('The title of the module.'),
  duration: z.string().describe('An estimated duration for the module, e.g., "2 horas".'),
  content: z.string().describe('A detailed summary of the content to be covered in this module.'),
});

export const GenerateCourseFromTopicOutputSchema = z.object({
  title: z.string().describe('A compelling and professional title for the course.'),
  description: z
    .string()
    .describe('A short, engaging description for the course card (1-2 sentences).'),
  longDescription: z
    .string()
    .describe(
      'A detailed description for the course page, outlining its objectives and what students will learn.'
    ),
  instructor: z
    .string()
    .describe('A plausible Spanish name for a suitable instructor for this course.'),
  duration: z
    .string()
    .describe("The total estimated duration for the entire course, e.g., '16 horas'."),
  modality: z
    .enum(['Online', 'Presencial', 'Mixta'])
    .describe('The most suitable modality for this course.'),
  modules: z
    .array(AIGeneratedModuleSchema)
    .min(3)
    .max(7)
    .describe('An array of 3 to 7 well-structured modules for the course.'),
});
export type GenerateCourseFromTopicOutput = z.infer<typeof GenerateCourseFromTopicOutputSchema>;

// From: src/ai/flows/generate-test-questions.ts
export const GenerateTestQuestionsInputSchema = z.object({
  courseContent: z
    .string()
    .describe('The content of the course for which to generate test questions.'),
  numberOfQuestions: z.number().default(5).describe('The number of test questions to generate.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .default('medium')
    .describe('The difficulty level of the test questions.'),
});
export type GenerateTestQuestionsInput = z.infer<typeof GenerateTestQuestionsInputSchema>;

export const GenerateTestQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe('The test question.'),
        options: z.array(z.string()).describe('The possible answers for the question.'),
        correctAnswer: z.string().describe('The correct answer to the question.'),
      })
    )
    .describe('The generated test questions.'),
});
export type GenerateTestQuestionsOutput = z.infer<typeof GenerateTestQuestionsOutputSchema>;

// From: src/ai/flows/notification-email-generation.ts
export const GenerateNotificationEmailInputSchema = z.object({
  recipientName: z.string().describe('The name of the person receiving the email.'),
  courseName: z.string().describe('The name of the course the notification is about.'),
  notificationType: z
    .enum(['course_reminder', 'new_course_available', 'feedback_ready'])
    .describe('The type of notification being sent.'),
});
export type GenerateNotificationEmailInput = z.infer<typeof GenerateNotificationEmailInputSchema>;

export const GenerateNotificationEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body content of the email.'),
});
export type GenerateNotificationEmailOutput = z.infer<typeof GenerateNotificationEmailOutputSchema>;

// From: src/ai/flows/summarize-module-content.ts
export const SummarizeModuleContentInputSchema = z
  .string()
  .describe('The content of the module to be summarized.');
export type SummarizeModuleContentInput = z.infer<typeof SummarizeModuleContentInputSchema>;

export const SummarizeModuleContentOutputSchema = z.object({
  summary: z
    .string()
    .describe("A concise summary of the module's content, highlighting key learning points."),
});
export type SummarizeModuleContentOutput = z.infer<typeof SummarizeModuleContentOutputSchema>;

// From: src/ai/flows/predict-abandonment.ts
export const PredictAbandonmentInputSchema = z.object({
  userName: z.string().describe('The name of the student.'),
  lastLogin: z
    .string()
    .describe('Time since the student last logged in (e.g., "hace 3 días", "hace 2 semanas").'),
  activeCoursesCount: z
    .number()
    .describe('The number of courses the student is currently enrolled in.'),
  completedCoursesCount: z.number().describe('The number of courses the student has completed.'),
  averageProgress: z
    .number()
    .describe('The average completion percentage across all active courses.'),
});
export type PredictAbandonmentInput = z.infer<typeof PredictAbandonmentInputSchema>;

export const PredictAbandonmentOutputSchema = z.object({
  riskLevel: z.enum(['Bajo', 'Medio', 'Alto']).describe('The predicted risk level of abandonment.'),
  justification: z
    .string()
    .describe(
      'A brief, 2-3 sentence justification for the predicted risk level, explaining the key factors.'
    ),
});
export type PredictAbandonmentOutput = z.infer<typeof PredictAbandonmentOutputSchema>;
