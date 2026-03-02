/**
 * TT-114: Provider PostgreSQL para DBProvider.
 * Implementa la interfaz DBProvider usando PostgreSQL con RLS.
 * Cada método ejecuta SET app.current_tenant_id antes de queries.
 */

import type { DBProvider } from './types';
import type {
  User,
  Course,
  Enrollment,
  UserProgress,
  Certificate,
  CertificateTemplate,
  ForumMessage,
  Notification,
  Resource,
  Announcement,
  ChatChannel,
  ChatMessage,
  CalendarEvent,
  ExternalTraining,
  Cost,
  Badge,
  UserBadge,
  AIConfig,
  AIUsageLog,
  LearningPath,
  UserLearningPathProgress,
  CourseRating,
  RolePermission,
  SystemLog,
  IndividualDevelopmentPlan,
  Regulation,
  RegulationCompliance,
  ComplianceAudit,
  ScormCmiState,
  PendingEnrollmentDetails,
  EnrollmentWithDetails,
  StudentForManagement,
  ComplianceReportData,
  DirectMessageThread,
  CourseResource,
  Role,
  UserStatus,
  CustomCostCategory,
  EnrollmentStatus,
  CertificateStatus,
  PDIStatus,
  LogLevel,
} from '@/lib/types';
import Dexie from 'dexie';
import { getCurrentTenantId } from '@/lib/tenant-context';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { uuid } from '@/lib/uuid';

// Pool de conexiones PostgreSQL (se inicializa en initPostgresPool)
let pgPool: any = null;

/**
 * Inicializa el pool de conexiones PostgreSQL.
 * Debe llamarse antes de usar el provider.
 */
async function initPostgresPool() {
  if (pgPool) return pgPool;

  const pg = await import('pg');
  const { Pool } = pg;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for PostgreSQL provider');
  }

  pgPool = new Pool({
    connectionString,
    // El rol talentos_app no tiene BYPASSRLS (TT-101)
    // Cada conexión debe establecer app.current_tenant_id antes de queries
  });

  return pgPool;
}

/**
 * Ejecuta una query con el tenant_id establecido.
 * Establece SET app.current_tenant_id antes de ejecutar la query.
 */
async function queryWithTenant<T = any>(queryText: string, params?: any[]): Promise<T[]> {
  const pool = await initPostgresPool();
  const tenantId = getCurrentTenantId();

  if (!tenantId) {
    throw new Error(
      'Tenant context required. Use requireTenant() or runWithTenant() in API routes.'
    );
  }

  const client = await pool.connect();
  try {
    // Establecer el tenant_id para esta conexión (RLS filtra automáticamente)
    await client.query('SET app.current_tenant_id = $1', [tenantId]);

    const result = await client.query(queryText, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Ejecuta una query que devuelve una sola fila.
 */
async function queryOne<T = any>(queryText: string, params?: any[]): Promise<T | undefined> {
  const rows = await queryWithTenant<T>(queryText, params);
  return rows[0];
}

/**
 * Ejecuta una query que devuelve un número (ej. COUNT, UPDATE ... RETURNING id).
 */
async function queryScalar<T = number>(queryText: string, params?: any[]): Promise<T> {
  const rows = await queryWithTenant<any>(queryText, params);
  return rows[0]?.count ?? rows[0]?.id ?? rows[0];
}

/**
 * Adaptador Dexie mock para cumplir con la interfaz DBProvider.
 * En PostgreSQL no usamos Dexie, pero la interfaz lo requiere.
 */
const mockDexie = {
  transaction: () => Promise.resolve({}),
  table: () => ({}),
  enrollments: { toArray: () => Promise.resolve([]) } as any,
  userProgress: { toArray: () => Promise.resolve([]) } as any,
  courses: { toArray: () => Promise.resolve([]) } as any,
  users: { toArray: () => Promise.resolve([]) } as any,
  notifications: { toArray: () => Promise.resolve([]) } as any,
  systemLogs: { toArray: () => Promise.resolve([]) } as any,
  aiUsageLog: { toArray: () => Promise.resolve([]) } as any,
  chatChannels: { toArray: () => Promise.resolve([]) } as any,
  chatMessages: { toArray: () => Promise.resolve([]) } as any,
  calendarEvents: { toArray: () => Promise.resolve([]) } as any,
  costs: { toArray: () => Promise.resolve([]) } as any,
  certificates: { toArray: () => Promise.resolve([]) } as any,
  certificateTemplates: { toArray: () => Promise.resolve([]) } as any,
  learningPaths: { toArray: () => Promise.resolve([]) } as any,
  badges: { toArray: () => Promise.resolve([]) } as any,
  userBadges: { toArray: () => Promise.resolve([]) } as any,
  individualDevelopmentPlans: { toArray: () => Promise.resolve([]) } as any,
  regulations: { toArray: () => Promise.resolve([]) } as any,
  regulationCompliance: { toArray: () => Promise.resolve([]) } as any,
  complianceAudits: { toArray: () => Promise.resolve([]) } as any,
  courseRatings: { toArray: () => Promise.resolve([]) } as any,
  externalTrainings: { toArray: () => Promise.resolve([]) } as any,
  rolePermissions: { toArray: () => Promise.resolve([]) } as any,
  scormCmiState: { toArray: () => Promise.resolve([]) } as any,
  forumMessages: { toArray: () => Promise.resolve([]) } as any,
  resources: { toArray: () => Promise.resolve([]) } as any,
  courseResources: { toArray: () => Promise.resolve([]) } as any,
  announcements: { toArray: () => Promise.resolve([]) } as any,
  costCategories: { toArray: () => Promise.resolve([]) } as any,
  userLearningPathProgress: { toArray: () => Promise.resolve([]) } as any,
  aiConfig: { toArray: () => Promise.resolve([]) } as any,
} as unknown as Dexie & {
  enrollments: any;
  userProgress: any;
  courses: any;
  users: any;
  notifications: any;
  systemLogs: any;
  aiUsageLog: any;
  chatChannels: any;
  chatMessages: any;
  calendarEvents: any;
  costs: any;
  certificates: any;
  certificateTemplates: any;
  learningPaths: any;
  badges: any;
  userBadges: any;
  individualDevelopmentPlans: any;
  regulations: any;
  regulationCompliance: any;
  complianceAudits: any;
  courseRatings: any;
  externalTrainings: any;
  rolePermissions: any;
  scormCmiState: any;
  forumMessages: any;
  resources: any;
  courseResources: any;
  announcements: any;
  costCategories: any;
  userLearningPathProgress: any;
  aiConfig: any;
};

/**
 * Provider PostgreSQL que implementa DBProvider.
 * Todos los métodos filtran automáticamente por tenant_id usando RLS.
 */
export const postgresProvider: DBProvider = {
  db: mockDexie,

  async populateDatabase() {
    // En PostgreSQL, los datos se insertan vía migraciones o scripts.
    // Este método puede quedarse vacío o ejecutar seeds si se requiere.
    console.log('PostgreSQL provider: populateDatabase() - use migrations or seed scripts');
  },

  // ========== AUTH ==========

  async login(email: string, password?: string): Promise<User | null> {
    // RLS filtra automáticamente por tenant_id (establecido con SET app.current_tenant_id)
    const user = await queryOne<User>(
      `SELECT id, tenant_id, name, email, password_hash, phone, avatar, role, department,
              points, status, notification_settings, created_at, updated_at, deleted_at
       FROM public.users
       WHERE email = $1
         AND (deleted_at IS NULL OR deleted_at > NOW())`,
      [email.toLowerCase()]
    );

    if (!user) return null;

    if (password && user.passwordHash) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) return null;
    }

    return {
      ...user,
      passwordHash: undefined, // No devolver el hash
    } as User;
  },

  logout() {
    // En PostgreSQL no hay sesión local que limpiar; el logout se maneja en la capa de auth (JWT)
  },

  async getLoggedInUser(): Promise<User | null> {
    // En PostgreSQL, el usuario logueado se obtiene desde el JWT/sesión, no desde almacenamiento local
    // Este método puede devolver null o requerir que se pase el userId desde el contexto
    return null;
  },

  // ========== USER ==========

  async addUser(
    user: Omit<
      User,
      | 'id'
      | 'isSynced'
      | 'updatedAt'
      | 'notificationSettings'
      | 'points'
      | 'status'
      | 'fcmToken'
      | 'passwordHash'
    > & { password?: string }
  ): Promise<User> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    if (!user.password) {
      throw new Error('La contraseña es obligatoria.');
    }

    const passwordHash = await hashPassword(user.password);
    const requiresApproval = [
      'Formador',
      'Jefe de Formación',
      'Gestor de RRHH',
      'Administrador General',
    ].includes(user.role);
    const status: UserStatus = requiresApproval ? 'pending_approval' : 'approved';

    const newUser = await queryOne<User>(
      `INSERT INTO public.users (
        tenant_id, name, email, password_hash, phone, avatar, role, department,
        points, status, notification_settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, tenant_id, name, email, phone, avatar, role, department,
                points, status, notification_settings, created_at, updated_at, deleted_at`,
      [
        tenantId,
        user.name,
        user.email.toLowerCase(),
        passwordHash,
        user.phone || null,
        user.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`,
        user.role,
        user.department,
        0,
        status,
        JSON.stringify({ consent: false, channels: [] }),
      ]
    );

    if (!newUser) throw new Error('Failed to create user');

    return {
      ...newUser,
      passwordHash: undefined,
    } as User;
  },

  async bulkAddUsers(
    users: Array<
      Omit<
        User,
        | 'id'
        | 'isSynced'
        | 'updatedAt'
        | 'notificationSettings'
        | 'points'
        | 'status'
        | 'fcmToken'
        | 'passwordHash'
      > & { password?: string }
    >
  ): Promise<string[]> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const pool = await initPostgresPool();
    const client = await pool.connect();
    const userIds: string[] = [];

    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      await client.query('BEGIN');

      for (const user of users) {
        if (!user.password) continue;
        const passwordHash = await hashPassword(user.password);
        const requiresApproval = [
          'Formador',
          'Jefe de Formación',
          'Gestor de RRHH',
          'Administrador General',
        ].includes(user.role);
        const status: UserStatus = requiresApproval ? 'pending_approval' : 'approved';

        const result = await client.query(
          `INSERT INTO public.users (
            tenant_id, name, email, password_hash, phone, avatar, role, department,
            points, status, notification_settings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            tenantId,
            user.name,
            user.email.toLowerCase(),
            passwordHash,
            user.phone || null,
            user.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`,
            user.role,
            user.department,
            0,
            status,
            JSON.stringify({ consent: false, channels: [] }),
          ]
        );
        userIds.push(result.rows[0].id);
      }

      await client.query('COMMIT');
      return userIds;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllUsers(): Promise<User[]> {
    const users = await queryWithTenant<User>(
      `SELECT id, tenant_id, name, email, phone, avatar, role, department,
              points, status, notification_settings, created_at, updated_at, deleted_at
       FROM public.users
       WHERE deleted_at IS NULL OR deleted_at > NOW()
       ORDER BY name`
    );
    return users.map(u => ({ ...u, passwordHash: undefined })) as User[];
  },

  async getUserById(id: string): Promise<User | undefined> {
    const user = await queryOne<User>(
      `SELECT id, tenant_id, name, email, phone, avatar, role, department,
              points, status, notification_settings, created_at, updated_at, deleted_at
       FROM public.users
       WHERE id = $1
         AND (deleted_at IS NULL OR deleted_at > NOW())`,
      [id]
    );
    return user ? ({ ...user, passwordHash: undefined } as User) : undefined;
  },

  async updateUser(
    id: string,
    data: Partial<Omit<User, 'id' | 'isSynced' | 'passwordHash'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(data.email.toLowerCase());
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      params.push(data.phone);
    }
    if (data.avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      params.push(data.avatar);
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      params.push(data.role);
    }
    if (data.department !== undefined) {
      updates.push(`department = $${paramIndex++}`);
      params.push(data.department);
    }
    if (data.points !== undefined) {
      updates.push(`points = $${paramIndex++}`);
      params.push(data.points);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.notificationSettings !== undefined) {
      updates.push(`notification_settings = $${paramIndex++}`);
      params.push(JSON.stringify(data.notificationSettings));
    }

    if (updates.length === 0) return 0;

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.users
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING 1`,
      params
    );

    return result ? 1 : 0;
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<number> {
    return await this.updateUser(userId, { status });
  },

  async saveFcmToken(userId: string, fcmToken: string): Promise<number> {
    // En PostgreSQL, fcmToken podría almacenarse en una columna separada o en notification_settings
    // Por ahora, lo ignoramos (deprecated según tipos)
    return 0;
  },

  async deleteUser(id: string): Promise<void> {
    await queryWithTenant(`DELETE FROM public.users WHERE id = $1`, [id]);
  },

  async softDeleteUser(id: string): Promise<number> {
    const result = await queryScalar<number>(
      `UPDATE public.users
       SET deleted_at = NOW()
       WHERE id = $1
       RETURNING 1`,
      [id]
    );
    return result ? 1 : 0;
  },

  // ========== CERTIFICATES ==========

  async addCertificate(
    certificate: Omit<Certificate, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const newCert = await queryOne<{ id: string }>(
      `INSERT INTO public.certificates (
        tenant_id, user_id, course_id, verification_code, status, issued_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id`,
      [
        tenantId,
        certificate.userId,
        certificate.courseId,
        certificate.verificationCode || `CERT-${uuid().slice(0, 8).toUpperCase()}`,
        certificate.status || 'issued',
      ]
    );

    if (!newCert) throw new Error('Failed to create certificate');
    return newCert.id;
  },

  async getCertificateById(id: string): Promise<Certificate | undefined> {
    const cert = await queryOne<any>(
      `SELECT id, tenant_id, user_id, course_id, verification_code, status, issued_at, created_at, updated_at
       FROM public.certificates WHERE id = $1`,
      [id]
    );

    if (!cert) return undefined;

    return {
      id: cert.id,
      userId: cert.user_id,
      courseId: cert.course_id,
      verificationCode: cert.verification_code,
      status: cert.status,
      issuedAt: cert.issued_at,
    } as Certificate;
  },

  async getCertificatesForUser(userId: string): Promise<Certificate[]> {
    const certs = await queryWithTenant<any>(
      `SELECT c.id, c.tenant_id, c.user_id, c.course_id, c.verification_code, c.status, c.issued_at, c.created_at
       FROM public.certificates c
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [userId]
    );

    return certs.map(c => ({
      id: c.id,
      userId: c.user_id,
      courseId: c.course_id,
      verificationCode: c.verification_code,
      status: c.status,
      issuedAt: c.issued_at,
    })) as Certificate[];
  },

  async getCertificatesForCourse(courseId: string): Promise<Certificate[]> {
    const certs = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, course_id, verification_code, status, issued_at
       FROM public.certificates
       WHERE course_id = $1
       ORDER BY issued_at DESC`,
      [courseId]
    );

    return certs.map(c => ({
      id: c.id,
      userId: c.user_id,
      courseId: c.course_id,
      verificationCode: c.verification_code,
      status: c.status,
      issuedAt: c.issued_at,
    })) as Certificate[];
  },

  async getAllCertificates(): Promise<Certificate[]> {
    const certs = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, course_id, verification_code, status, issued_at, created_at
       FROM public.certificates
       ORDER BY issued_at DESC`
    );

    return certs.map(c => ({
      id: c.id,
      userId: c.user_id,
      courseId: c.course_id,
      verificationCode: c.verification_code,
      status: c.status,
      issuedAt: c.issued_at,
    })) as Certificate[];
  },

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    const cert = await queryOne<any>(
      `SELECT id, tenant_id, user_id, course_id, verification_code, status, issued_at
       FROM public.certificates
       WHERE verification_code = $1`,
      [code]
    );

    if (!cert) return undefined;

    return {
      id: cert.id,
      userId: cert.user_id,
      courseId: cert.course_id,
      verificationCode: cert.verification_code,
      status: cert.status,
      issuedAt: cert.issued_at,
    } as Certificate;
  },

  async updateCertificateStatus(id: string, status: CertificateStatus): Promise<number> {
    const result = await queryScalar<number>(
      `UPDATE public.certificates SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING 1`,
      [status, id]
    );
    return result ? 1 : 0;
  },

  async getCertificateForUserCourse(
    userId: string,
    courseId: string
  ): Promise<Certificate | undefined> {
    const cert = await queryOne<any>(
      `SELECT id, tenant_id, user_id, course_id, verification_code, status, issued_at
       FROM public.certificates
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (!cert) return undefined;

    return {
      id: cert.id,
      userId: cert.user_id,
      courseId: cert.course_id,
      verificationCode: cert.verification_code,
      status: cert.status,
      issuedAt: cert.issued_at,
    } as Certificate;
  },

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const templates = await queryWithTenant<any>(
      `SELECT id, tenant_id, name, description, background_image, body_template, created_at
       FROM public.certificate_templates
       ORDER BY created_at DESC`
    );

    return templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      backgroundImage: t.background_image,
      bodyTemplate: t.body_template,
    })) as CertificateTemplate[];
  },

  async getCertificateTemplateById(id: string): Promise<CertificateTemplate | undefined> {
    const template = await queryOne<any>(
      `SELECT id, tenant_id, name, description, background_image, body_template, created_at
       FROM public.certificate_templates WHERE id = $1`,
      [id]
    );

    if (!template) return undefined;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      backgroundImage: template.background_image,
      bodyTemplate: template.body_template,
    } as CertificateTemplate;
  },

  async updateCertificateTemplate(
    id: string,
    data: Partial<Omit<CertificateTemplate, 'id' | 'createdAt'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.backgroundImage !== undefined) {
      updates.push(`background_image = $${paramIndex++}`);
      params.push(data.backgroundImage);
    }
    if (data.bodyTemplate !== undefined) {
      updates.push(`body_template = $${paramIndex++}`);
      params.push(data.bodyTemplate);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.certificate_templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  // ========== COURSE ==========

  async addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const newCourse = await queryOne<{ id: string }>(
      `INSERT INTO public.courses (
        tenant_id, title, description, long_description, instructor, duration, modality,
        image, ai_hint, modules, status, mandatory_for_roles, start_date, end_date, category, capacity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        tenantId,
        course.title || 'Sin Título',
        course.description || '',
        course.longDescription || '',
        course.instructor || 'Por definir',
        course.duration || 'Por definir',
        course.modality || 'Online',
        course.image || '/images/courses/default.png',
        course.aiHint || '',
        JSON.stringify(course.modules || []),
        course.status || 'draft',
        course.mandatoryForRoles || [],
        course.startDate || null,
        course.endDate || null,
        course.category || null,
        course.capacity || null,
      ]
    );

    if (!newCourse) throw new Error('Failed to create course');
    return newCourse.id;
  },

  async getAllCourses(): Promise<Course[]> {
    const courses = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, long_description, instructor, duration, modality,
              image, ai_hint, modules, status, mandatory_for_roles, start_date, end_date, category, capacity,
              created_at, updated_at
       FROM public.courses
       ORDER BY created_at DESC`
    );

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      longDescription: c.long_description,
      instructor: c.instructor,
      duration: c.duration,
      modality: c.modality as 'Online' | 'Presencial' | 'Mixta',
      image: c.image,
      aiHint: c.ai_hint,
      modules: c.modules || [],
      status: c.status,
      mandatoryForRoles: c.mandatory_for_roles || [],
      startDate: c.start_date,
      endDate: c.end_date,
      category: c.category,
      capacity: c.capacity,
    })) as Course[];
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    const course = await queryOne<any>(
      `SELECT id, tenant_id, title, description, long_description, instructor, duration, modality,
              image, ai_hint, modules, status, mandatory_for_roles, start_date, end_date, category, capacity,
              created_at, updated_at
       FROM public.courses
       WHERE id = $1`,
      [id]
    );

    if (!course) return undefined;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      longDescription: course.long_description,
      instructor: course.instructor,
      duration: course.duration,
      modality: course.modality as 'Online' | 'Presencial' | 'Mixta',
      image: course.image,
      aiHint: course.ai_hint,
      modules: course.modules || [],
      status: course.status,
      mandatoryForRoles: course.mandatory_for_roles || [],
      startDate: course.start_date,
      endDate: course.end_date,
      category: course.category,
      capacity: course.capacity,
    } as Course;
  },

  async updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.longDescription !== undefined) {
      updates.push(`long_description = $${paramIndex++}`);
      params.push(data.longDescription);
    }
    if (data.instructor !== undefined) {
      updates.push(`instructor = $${paramIndex++}`);
      params.push(data.instructor);
    }
    if (data.duration !== undefined) {
      updates.push(`duration = $${paramIndex++}`);
      params.push(data.duration);
    }
    if (data.modality !== undefined) {
      updates.push(`modality = $${paramIndex++}`);
      params.push(data.modality);
    }
    if (data.image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      params.push(data.image);
    }
    if (data.aiHint !== undefined) {
      updates.push(`ai_hint = $${paramIndex++}`);
      params.push(data.aiHint);
    }
    if (data.modules !== undefined) {
      updates.push(`modules = $${paramIndex++}`);
      params.push(JSON.stringify(data.modules));
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.mandatoryForRoles !== undefined) {
      updates.push(`mandatory_for_roles = $${paramIndex++}`);
      params.push(data.mandatoryForRoles);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(data.endDate);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.capacity !== undefined) {
      updates.push(`capacity = $${paramIndex++}`);
      params.push(data.capacity);
    }

    if (updates.length === 0) return 0;

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.courses
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING 1`,
      params
    );

    return result ? 1 : 0;
  },

  async updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number> {
    return await this.updateCourse(id, { status });
  },

  async deleteCourse(id: string): Promise<void> {
    const pool = await initPostgresPool();
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const client = await pool.connect();
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);
      await client.query('BEGIN');

      // Eliminar enrollments y progress relacionados (RLS filtra por tenant automáticamente)
      await client.query('DELETE FROM public.enrollments WHERE course_id = $1', [id]);
      await client.query('DELETE FROM public.user_progress WHERE course_id = $1', [id]);
      await client.query('DELETE FROM public.courses WHERE id = $1', [id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // ========== ENROLLMENT ==========

  async requestEnrollment(courseId: string, studentId: string): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    // Verificar que el curso existe (RLS filtra por tenant)
    const course = await queryOne<{ capacity: number | null }>(
      `SELECT capacity FROM public.courses WHERE id = $1`,
      [courseId]
    );
    if (!course) throw new Error('El curso no existe.');

    // Verificar que no hay una solicitud activa
    const activeStatuses = [
      'pending',
      'approved',
      'active',
      'waitlisted',
      'needs_review',
      'completed',
    ];
    const existing = await queryOne<{ id: number }>(
      `SELECT id FROM public.enrollments
       WHERE student_id = $1 AND course_id = $2 AND status = ANY($3)`,
      [studentId, courseId, activeStatuses]
    );
    if (existing) throw new Error('Ya tienes una solicitud para este curso.');

    // Verificar capacidad
    if (course.capacity !== null && course.capacity > 0) {
      const approvedCount = await this.getApprovedEnrollmentCount(courseId);
      if (approvedCount >= course.capacity) {
        throw new Error('El curso está completo. No quedan plazas disponibles.');
      }
    }

    const enrollment = await queryOne<{ id: number }>(
      `INSERT INTO public.enrollments (tenant_id, student_id, course_id, request_date, status)
       VALUES ($1, $2, $3, NOW(), 'pending')
       RETURNING id`,
      [tenantId, studentId, courseId]
    );

    if (!enrollment) throw new Error('Failed to create enrollment');
    return enrollment.id;
  },

  async getApprovedEnrollmentCount(courseId: string): Promise<number> {
    const result = await queryScalar<{ count: string }>(
      `SELECT COUNT(*) as count FROM public.enrollments
       WHERE course_id = $1 AND status IN ('approved', 'active', 'completed')`,
      [courseId]
    );
    return parseInt(typeof result === 'object' ? result.count : result, 10);
  },

  async getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]> {
    const enrollments = await queryWithTenant<any>(
      `SELECT e.id, e.student_id, e.course_id, e.request_date, e.status, e.justification,
              u.name as user_name, c.title as course_title
       FROM public.enrollments e
       JOIN public.users u ON e.student_id = u.id
       JOIN public.courses c ON e.course_id = c.id
       WHERE e.status = 'pending'
       ORDER BY e.request_date DESC`
    );

    return enrollments.map(e => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      requestDate: e.request_date,
      status: e.status,
      justification: e.justification,
      userName: e.user_name,
      courseTitle: e.course_title,
    })) as PendingEnrollmentDetails[];
  },

  async getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]> {
    const enrollments = await queryWithTenant<any>(
      `SELECT e.id, e.student_id, e.course_id, e.request_date, e.status, e.justification,
              u.name as user_name, u.email as user_email,
              c.title as course_title, c.image as course_image
       FROM public.enrollments e
       JOIN public.users u ON e.student_id = u.id
       JOIN public.courses c ON e.course_id = c.id
       ORDER BY e.request_date DESC`
    );

    return enrollments.map(e => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      requestDate: e.request_date,
      status: e.status,
      justification: e.justification,
      userName: e.user_name,
      userEmail: e.user_email,
      courseTitle: e.course_title,
      courseImage: e.course_image,
    })) as EnrollmentWithDetails[];
  },

  async getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]> {
    const enrollments = await queryWithTenant<any>(
      `SELECT e.id, e.student_id, e.course_id, e.request_date, e.status, e.justification,
              u.name as user_name, u.email as user_email,
              c.title as course_title, c.image as course_image
       FROM public.enrollments e
       JOIN public.users u ON e.student_id = u.id
       JOIN public.courses c ON e.course_id = c.id
       WHERE e.student_id = $1
       ORDER BY e.request_date DESC`,
      [userId]
    );

    return enrollments.map(e => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      requestDate: e.request_date,
      status: e.status,
      justification: e.justification,
      userName: e.user_name,
      userEmail: e.user_email,
      courseTitle: e.course_title,
      courseImage: e.course_image,
    })) as EnrollmentWithDetails[];
  },

  async updateEnrollmentStatus(
    enrollmentId: number,
    status: EnrollmentStatus,
    justification?: string
  ): Promise<number> {
    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];
    let paramIndex = 2;

    if (justification !== undefined) {
      updates.push(`justification = $${paramIndex++}`);
      params.push(justification);
    }

    params.push(enrollmentId);

    const result = await queryScalar<number>(
      `UPDATE public.enrollments
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING 1`,
      params
    );

    return result ? 1 : 0;
  },

  async getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
    const courses = await queryWithTenant<any>(
      `SELECT DISTINCT c.id, c.tenant_id, c.title, c.description, c.long_description, c.instructor,
              c.duration, c.modality, c.image, c.ai_hint, c.modules, c.status, c.mandatory_for_roles,
              c.start_date, c.end_date, c.category, c.capacity, c.created_at, c.updated_at
       FROM public.courses c
       JOIN public.enrollments e ON c.id = e.course_id
       WHERE e.student_id = $1
         AND e.status IN ('approved', 'active', 'completed')`,
      [userId]
    );

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      longDescription: c.long_description,
      instructor: c.instructor,
      duration: c.duration,
      modality: c.modality as 'Online' | 'Presencial' | 'Mixta',
      image: c.image,
      aiHint: c.ai_hint,
      modules: c.modules || [],
      status: c.status,
      mandatoryForRoles: c.mandatory_for_roles || [],
      startDate: c.start_date,
      endDate: c.end_date,
      category: c.category,
      capacity: c.capacity,
    })) as Course[];
  },

  async getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    // Obtener cursos obligatorios para el rol del usuario que no están completados
    const courses = await queryWithTenant<any>(
      `SELECT c.id, c.tenant_id, c.title, c.description, c.long_description, c.instructor,
              c.duration, c.modality, c.image, c.ai_hint, c.modules, c.status, c.mandatory_for_roles,
              c.start_date, c.end_date, c.category, c.capacity, c.created_at, c.updated_at
       FROM public.courses c
       WHERE $1 = ANY(c.mandatory_for_roles)
         AND c.status = 'published'
         AND NOT EXISTS (
           SELECT 1 FROM public.enrollments e
           WHERE e.student_id = $2
             AND e.course_id = c.id
             AND e.status = 'completed'
         )`,
      [user.role, user.id]
    );

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      longDescription: c.long_description,
      instructor: c.instructor,
      duration: c.duration,
      modality: c.modality as 'Online' | 'Presencial' | 'Mixta',
      image: c.image,
      aiHint: c.ai_hint,
      modules: c.modules || [],
      status: c.status,
      mandatoryForRoles: c.mandatory_for_roles || [],
      startDate: c.start_date,
      endDate: c.end_date,
      category: c.category,
      capacity: c.capacity,
    })) as Course[];
  },

  // ========== USER PROGRESS ==========

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    const progress = await queryOne<any>(
      `SELECT id, tenant_id, user_id, course_id, completed_modules, created_at, updated_at
       FROM public.user_progress
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (!progress) return undefined;

    return {
      id: progress.id,
      userId: progress.user_id,
      courseId: progress.course_id,
      completedModules: progress.completed_modules || [],
    } as UserProgress;
  },

  async getUserProgressForUser(userId: string): Promise<UserProgress[]> {
    const progressList = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, course_id, completed_modules, created_at, updated_at
       FROM public.user_progress
       WHERE user_id = $1`,
      [userId]
    );

    return progressList.map(p => ({
      id: p.id,
      userId: p.user_id,
      courseId: p.course_id,
      completedModules: p.completed_modules || [],
    })) as UserProgress[];
  },

  async markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const pool = await initPostgresPool();
    const client = await pool.connect();
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Obtener o crear el registro de progreso
      let progress = await client.query(
        `SELECT id, completed_modules FROM public.user_progress
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      if (progress.rows.length === 0) {
        // Crear nuevo registro
        await client.query(
          `INSERT INTO public.user_progress (tenant_id, user_id, course_id, completed_modules)
           VALUES ($1, $2, $3, ARRAY[$4])`,
          [tenantId, userId, courseId, moduleId]
        );
      } else {
        // Actualizar existente: añadir moduleId si no está ya
        const completedModules = progress.rows[0].completed_modules || [];
        if (!completedModules.includes(moduleId)) {
          await client.query(
            `UPDATE public.user_progress
             SET completed_modules = array_append(completed_modules, $1),
                 updated_at = NOW()
             WHERE user_id = $2 AND course_id = $3`,
            [moduleId, userId, courseId]
          );
        }
      }
    } finally {
      client.release();
    }
  },

  // ... (resto de métodos placeholder - se implementarán en siguientes pasos)
  // ========== SCORM CMI (TT-108) ==========

  async getScormCmiState(userId: string, courseId: string): Promise<ScormCmiState | undefined> {
    // Nota: La tabla scorm_cmi_state debe crearse en una migración si no existe
    // Por ahora, asumimos que existe con estructura: id, tenant_id, user_id, course_id, completion_status, success_status, score_scaled, location, suspend_data, updated_at
    const state = await queryOne<any>(
      `SELECT id, user_id, course_id, completion_status, success_status, score_scaled, location, suspend_data, updated_at
       FROM public.scorm_cmi_state
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (!state) return undefined;

    return {
      id: state.id,
      userId: state.user_id,
      courseId: state.course_id,
      completionStatus: state.completion_status,
      successStatus: state.success_status,
      scoreScaled: state.score_scaled,
      location: state.location,
      suspendData: state.suspend_data,
      updatedAt: state.updated_at,
    } as ScormCmiState;
  },

  async saveScormCmiState(
    userId: string,
    courseId: string,
    data: Omit<ScormCmiState, 'id' | 'userId' | 'courseId' | 'updatedAt'>
  ): Promise<void> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const pool = await initPostgresPool();
    const client = await pool.connect();
    try {
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Verificar si existe
      const existing = await client.query(
        `SELECT id FROM public.scorm_cmi_state WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId]
      );

      if (existing.rows.length > 0) {
        // Actualizar
        await client.query(
          `UPDATE public.scorm_cmi_state
           SET completion_status = $1, success_status = $2, score_scaled = $3,
               location = $4, suspend_data = $5, updated_at = NOW()
           WHERE user_id = $6 AND course_id = $7`,
          [
            data.completionStatus,
            data.successStatus,
            data.scoreScaled,
            data.location,
            data.suspendData,
            userId,
            courseId,
          ]
        );
      } else {
        // Insertar
        await client.query(
          `INSERT INTO public.scorm_cmi_state (
            tenant_id, user_id, course_id, completion_status, success_status,
            score_scaled, location, suspend_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tenantId,
            userId,
            courseId,
            data.completionStatus,
            data.successStatus,
            data.scoreScaled,
            data.location,
            data.suspendData,
          ]
        );
      }
    } finally {
      client.release();
    }
  },
  // ========== FORUM ==========

  async addForumMessage(
    message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.forum_messages (
        tenant_id, course_id, user_id, content, parent_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id`,
      [tenantId, message.courseId, message.userId, message.content, message.parentId || null]
    );

    return result?.id || 0;
  },

  async getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> {
    const messages = await queryWithTenant<any>(
      `SELECT f.id, f.course_id, f.user_id, f.content, f.parent_id, f.created_at,
              u.name as user_name, u.avatar as user_avatar
       FROM public.forum_messages f
       JOIN public.users u ON f.user_id = u.id
       WHERE f.course_id = $1
       ORDER BY f.created_at ASC`,
      [courseId]
    );

    return messages.map(m => ({
      id: m.id,
      courseId: m.course_id,
      userId: m.user_id,
      content: m.content,
      parentId: m.parent_id,
      createdAt: m.created_at,
      userName: m.user_name,
      userAvatar: m.user_avatar,
    })) as ForumMessageWithReplies[];
  },

  async deleteForumMessage(messageId: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.forum_messages WHERE id = $1`, [messageId]);
  },
  // ========== NOTIFICATIONS ==========

  async addNotification(
    notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.notifications (
        tenant_id, user_id, type, title, message, read, link, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id`,
      [
        tenantId,
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.read || false,
        notification.link || null,
      ]
    );

    return result?.id || 0;
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const notifications = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, type, title, message, read, link, created_at
       FROM public.notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return notifications.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      link: n.link,
      createdAt: n.created_at,
    })) as Notification[];
  },

  async markNotificationAsRead(notificationId: number): Promise<number> {
    const result = await queryScalar<number>(
      `UPDATE public.notifications SET read = true WHERE id = $1 RETURNING 1`,
      [notificationId]
    );
    return result ? 1 : 0;
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await queryWithTenant(`UPDATE public.notifications SET read = true WHERE user_id = $1`, [
      userId,
    ]);
  },

  async checkAndSendDeadlineReminders(user: User): Promise<void> {
    // Buscar cursos con deadlines próximos
    const courses = await queryWithTenant<any>(
      `SELECT c.id, c.title, e.end_date
       FROM public.courses c
       JOIN public.enrollments e ON c.id = e.course_id
       WHERE e.student_id = $1
         AND e.status IN ('approved', 'active')
         AND e.end_date IS NOT NULL
         AND e.end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'`,
      [user.id]
    );

    for (const course of courses) {
      await this.addNotification({
        userId: user.id,
        type: 'deadline',
        title: 'Recordatorio de deadline',
        message: `El curso "${course.title}" termina pronto: ${new Date(course.end_date).toLocaleDateString()}`,
        read: false,
      });
    }
  },
  // ========== RESOURCES ==========

  async addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.resources (
        tenant_id, title, type, url, description, uploaded_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        tenantId,
        resource.title,
        resource.type,
        resource.url,
        resource.description,
        resource.uploadedBy,
      ]
    );

    return result?.id || 0;
  },

  async getAllResources(): Promise<Resource[]> {
    const resources = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, type, url, description, uploaded_by, created_at
       FROM public.resources
       ORDER BY created_at DESC`
    );

    return resources.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      uploadedBy: r.uploaded_by,
    })) as Resource[];
  },

  async deleteResource(resourceId: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.resources WHERE id = $1`, [resourceId]);
  },

  async associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> {
    await queryWithTenant(
      `INSERT INTO public.course_resources (course_id, resource_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [courseId, resourceId]
    );
  },

  async dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> {
    await queryWithTenant(
      `DELETE FROM public.course_resources WHERE course_id = $1 AND resource_id = $2`,
      [courseId, resourceId]
    );
  },

  async getResourcesForCourse(courseId: string): Promise<Resource[]> {
    const resources = await queryWithTenant<any>(
      `SELECT r.id, r.tenant_id, r.title, r.type, r.url, r.description, r.uploaded_by, r.created_at
       FROM public.resources r
       JOIN public.course_resources cr ON r.id = cr.resource_id
       WHERE cr.course_id = $1
       ORDER BY r.created_at DESC`,
      [courseId]
    );

    return resources.map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      url: r.url,
      description: r.description,
      uploadedBy: r.uploaded_by,
    })) as Resource[];
  },

  async getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> {
    const resources = await queryWithTenant<{ resource_id: number }>(
      `SELECT resource_id FROM public.course_resources WHERE course_id = $1`,
      [courseId]
    );

    return resources.map(r => r.resource_id);
  },
  // ========== ANNOUNCEMENTS ==========

  async addAnnouncement(
    announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.announcements (
        tenant_id, title, content, type, target_roles, start_date, end_date, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        tenantId,
        announcement.title,
        announcement.content,
        announcement.type,
        announcement.targetRoles || [],
        announcement.startDate || null,
        announcement.endDate || null,
        announcement.createdBy,
      ]
    );

    return result?.id || 0;
  },

  async deleteAnnouncement(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.announcements WHERE id = $1`, [id]);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    const announcements = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, content, type, target_roles, start_date, end_date, created_by, created_at
       FROM public.announcements
       ORDER BY created_at DESC`
    );

    return announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      targetRoles: a.target_roles || [],
      startDate: a.start_date,
      endDate: a.end_date,
      createdBy: a.created_by,
    })) as Announcement[];
  },

  async getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> {
    const announcements = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, content, type, target_roles, start_date, end_date, created_by, created_at
       FROM public.announcements
       WHERE (target_roles IS NULL OR target_roles = '{}' OR $1 = ANY(target_roles))
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY created_at DESC`,
      [user.role]
    );

    return announcements.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      type: a.type,
      targetRoles: a.target_roles || [],
      startDate: a.start_date,
      endDate: a.end_date,
      createdBy: a.created_by,
    })) as Announcement[];
  },
  // ========== CHAT ==========

  async addChatMessage(
    message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.chat_messages (
        tenant_id, channel_id, user_id, content, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING id`,
      [tenantId, message.channelId, message.userId, message.content]
    );

    return result?.id || 0;
  },

  async getChatMessages(channelId: number | string): Promise<ChatMessage[]> {
    const messages = await queryWithTenant<any>(
      `SELECT m.id, m.channel_id, m.user_id, m.content, m.created_at,
              u.name as user_name, u.avatar as user_avatar
       FROM public.chat_messages m
       JOIN public.users u ON m.user_id = u.id
       WHERE m.channel_id = $1
       ORDER BY m.created_at ASC`,
      [channelId]
    );

    return messages.map(m => ({
      id: m.id,
      channelId: m.channel_id,
      userId: m.user_id,
      content: m.content,
      createdAt: m.created_at,
      userName: m.user_name,
      userAvatar: m.user_avatar,
    })) as ChatMessage[];
  },

  async getPublicChatChannels(): Promise<ChatChannel[]> {
    const channels = await queryWithTenant<any>(
      `SELECT id, tenant_id, name, description, created_at
       FROM public.chat_channels
       WHERE is_public = true
       ORDER BY name`
    );

    return channels.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
    })) as ChatChannel[];
  },

  async addPublicChatChannel(name: string, description: string): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.chat_channels (tenant_id, name, description, is_public)
       VALUES ($1, $2, $3, true)
       RETURNING id::text`,
      [tenantId, name, description]
    );

    return result?.id || '';
  },

  async getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> {
    const threads = await queryWithTenant<any>(
      `SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
              LEAST(sender_id, receiver_id) as other_user_id,
              u.name as other_user_name, u.avatar as other_user_avatar,
              (SELECT content FROM public.direct_messages 
               WHERE (sender_id = $1 AND receiver_id = other_user_id) 
                  OR (sender_id = other_user_id AND receiver_id = $1)
               ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM public.direct_messages 
               WHERE (sender_id = $1 AND receiver_id = other_user_id) 
                  OR (sender_id = other_user_id AND receiver_id = $1)
               ORDER BY created_at DESC LIMIT 1) as last_message_at
       FROM public.direct_messages
       JOIN public.users u ON u.id = LEAST(sender_id, receiver_id)
       WHERE sender_id = $1 OR receiver_id = $1
       ORDER BY last_message_at DESC`,
      [userId]
    );

    return threads.map(t => ({
      otherUserId: t.other_user_id,
      otherUserName: t.other_user_name,
      otherUserAvatar: t.other_user_avatar,
      lastMessage: t.last_message,
      lastMessageAt: t.last_message_at,
    })) as DirectMessageThread[];
  },

  async getOrCreateDirectMessageThread(
    currentUserId: string,
    otherUserId: string
  ): Promise<ChatChannel> {
    const thread = await queryOne<any>(
      `SELECT id, name, description FROM public.chat_channels
       WHERE (name = $1 OR name = $2) AND is_public = false`,
      [`dm-${currentUserId}-${otherUserId}`, `dm-${otherUserId}-${currentUserId}`]
    );

    if (thread) {
      return { id: thread.id, name: thread.name, description: thread.description };
    }

    const newThread = await queryOne<{ id: string }>(
      `INSERT INTO public.chat_channels (tenant_id, name, description, is_public)
       VALUES ($1, $2, $3, false)
       RETURNING id::text as id`,
      [
        getCurrentTenantId(),
        `dm-${currentUserId}-${otherUserId}`,
        `Conversación con ${otherUserId}`,
      ]
    );

    return { id: newThread?.id || '', name: `dm-${currentUserId}-${otherUserId}`, description: '' };
  },
  async getComplianceReportData(
    departmentFilter?: string,
    roleFilter?: string
  ): Promise<ComplianceReportData[]> {
    let query = `
      SELECT u.id as user_id, u.name, u.email, u.department, u.role,
             r.title as regulation_title, rc.status, rc.expiry_date
      FROM public.users u
      LEFT JOIN public.regulation_compliances rc ON u.id = rc.user_id
      LEFT JOIN public.regulations r ON rc.regulation_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (departmentFilter) {
      query += ` AND u.department = $${paramIndex++}`;
      params.push(departmentFilter);
    }
    if (roleFilter) {
      query += ` AND u.role = $${paramIndex++}`;
      params.push(roleFilter);
    }

    const data = await queryWithTenant<any>(query, params);

    return data.map(d => ({
      userId: d.user_id,
      userName: d.name,
      userEmail: d.email,
      department: d.department,
      role: d.role,
      regulationTitle: d.regulation_title,
      complianceStatus: d.status,
      expiryDate: d.expiry_date,
    })) as ComplianceReportData[];
  },

  // ========== CALENDAR ==========

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    const events = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, start_date, end_date, event_type, created_by, created_at
       FROM public.calendar_events
       ORDER BY start_date`
    );

    return events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
      eventType: e.event_type,
      createdBy: e.created_by,
    })) as CalendarEvent[];
  },

  async getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];

    const events = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, start_date, end_date, event_type, created_by, course_id, created_at
       FROM public.calendar_events
       WHERE course_id = ANY($1)
       ORDER BY start_date`,
      [courseIds]
    );

    return events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.start_date,
      endDate: e.end_date,
      eventType: e.event_type,
      createdBy: e.created_by,
      courseId: e.course_id,
    })) as CalendarEvent[];
  },

  async addCalendarEvent(
    event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.calendar_events (
        tenant_id, title, description, start_date, end_date, event_type, course_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        tenantId,
        event.title,
        event.description,
        event.startDate,
        event.endDate,
        event.eventType,
        event.courseId || null,
        event.createdBy,
      ]
    );

    return result?.id || 0;
  },

  async updateCalendarEvent(
    id: number,
    data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(data.endDate);
    }
    if (data.eventType !== undefined) {
      updates.push(`event_type = $${paramIndex++}`);
      params.push(data.eventType);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.calendar_events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.calendar_events WHERE id = $1`, [id]);
  },
  // ========== EXTERNAL TRAINING ==========

  async getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> {
    const trainings = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, title, provider, start_date, end_date, hours, certificate_url, status, created_at
       FROM public.external_trainings
       WHERE user_id = $1
       ORDER BY start_date DESC`,
      [userId]
    );

    return trainings.map(t => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      provider: t.provider,
      startDate: t.start_date,
      endDate: t.end_date,
      hours: t.hours,
      certificateUrl: t.certificate_url,
      status: t.status,
    })) as ExternalTraining[];
  },

  async addExternalTraining(
    training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.external_trainings (
        tenant_id, user_id, title, provider, start_date, end_date, hours, certificate_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        tenantId,
        training.userId,
        training.title,
        training.provider,
        training.startDate,
        training.endDate,
        training.hours,
        training.certificateUrl || null,
        training.status || 'pending',
      ]
    );

    return result?.id || 0;
  },

  async updateExternalTraining(
    id: number,
    data: Partial<Omit<ExternalTraining, 'id'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.provider !== undefined) {
      updates.push(`provider = $${paramIndex++}`);
      params.push(data.provider);
    }
    if (data.startDate !== undefined) {
      updates.push(`start_date = $${paramIndex++}`);
      params.push(data.startDate);
    }
    if (data.endDate !== undefined) {
      updates.push(`end_date = $${paramIndex++}`);
      params.push(data.endDate);
    }
    if (data.hours !== undefined) {
      updates.push(`hours = $${paramIndex++}`);
      params.push(data.hours);
    }
    if (data.certificateUrl !== undefined) {
      updates.push(`certificate_url = $${paramIndex++}`);
      params.push(data.certificateUrl);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.external_trainings SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteExternalTraining(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.external_trainings WHERE id = $1`, [id]);
  },
  // ========== COSTS ==========

  async getAllCosts(): Promise<Cost[]> {
    const costs = await queryWithTenant<any>(
      `SELECT id, tenant_id, course_id, category, amount, description, date, created_at
       FROM public.costs
       ORDER BY date DESC`
    );

    return costs.map(c => ({
      id: c.id,
      courseId: c.course_id,
      category: c.category,
      amount: c.amount,
      description: c.description,
      date: c.date,
    })) as Cost[];
  },

  async addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.costs (
        tenant_id, course_id, category, amount, description, date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        tenantId,
        cost.courseId || null,
        cost.category,
        cost.amount,
        cost.description,
        cost.date || new Date(),
      ]
    );

    return result?.id || 0;
  },

  async updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.courseId !== undefined) {
      updates.push(`course_id = $${paramIndex++}`);
      params.push(data.courseId);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.amount !== undefined) {
      updates.push(`amount = $${paramIndex++}`);
      params.push(data.amount);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.date !== undefined) {
      updates.push(`date = $${paramIndex++}`);
      params.push(data.date);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.costs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteCost(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.costs WHERE id = $1`, [id]);
  },

  async getAllCostCategories(): Promise<CustomCostCategory[]> {
    const categories = await queryWithTenant<any>(
      `SELECT id, tenant_id, name FROM public.cost_categories ORDER BY name`
    );

    return categories.map(c => ({
      id: c.id,
      name: c.name,
    })) as CustomCostCategory[];
  },

  async addCostCategory(category: { name: string }): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.cost_categories (tenant_id, name) VALUES ($1, $2) RETURNING id`,
      [tenantId, category.name]
    );

    return result?.id || 0;
  },

  async deleteCostCategory(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.cost_categories WHERE id = $1`, [id]);
  },
  async getCoursesByInstructorName(instructorName: string): Promise<Course[]> {
    const courses = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, long_description, instructor, duration, modality,
              image, ai_hint, modules, status, mandatory_for_roles, start_date, end_date, category, capacity
       FROM public.courses
       WHERE instructor = $1
       ORDER BY created_at DESC`,
      [instructorName]
    );

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      longDescription: c.long_description,
      instructor: c.instructor,
      duration: c.duration,
      modality: c.modality as 'Online' | 'Presencial' | 'Mixta',
      image: c.image,
      aiHint: c.ai_hint,
      modules: c.modules || [],
      status: c.status,
      mandatoryForRoles: c.mandatory_for_roles || [],
      startDate: c.start_date,
      endDate: c.end_date,
      category: c.category,
      capacity: c.capacity,
    })) as Course[];
  },

  async getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> {
    const students = await queryWithTenant<any>(
      `SELECT u.id, u.name, u.email, u.department, u.role, e.status, e.request_date,
              e.completion_date, e.progress
       FROM public.users u
       JOIN public.enrollments e ON u.id = e.student_id
       WHERE e.course_id = $1
       ORDER BY e.request_date DESC`,
      [courseId]
    );

    return students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      department: s.department,
      role: s.role,
      enrollmentStatus: s.status,
      requestDate: s.request_date,
      completionDate: s.completion_date,
      progress: s.progress,
    })) as StudentForManagement[];
  },

  // ========== BADGES ==========

  async getAllBadges(): Promise<Badge[]> {
    const badges = await queryWithTenant<any>(
      `SELECT id, tenant_id, name, description, icon, points, criteria, created_at
       FROM public.badges
       ORDER BY name`
    );

    return badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      points: b.points,
      criteria: b.criteria,
    })) as Badge[];
  },

  async getBadgesForUser(userId: string): Promise<UserBadge[]> {
    const badges = await queryWithTenant<any>(
      `SELECT b.id, b.name, b.description, b.icon, b.points, ub.awarded_at
       FROM public.user_badges ub
       JOIN public.badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.awarded_at DESC`,
      [userId]
    );

    return badges.map(b => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon: b.icon,
      points: b.points,
      awardedAt: b.awarded_at,
    })) as UserBadge[];
  },

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    await queryWithTenant(
      `INSERT INTO public.user_badges (tenant_id, user_id, badge_id, awarded_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [tenantId, userId, badgeId]
    );
  },
  // ========== AI ==========

  async getAIConfig(): Promise<AIConfig> {
    const config = await queryOne<any>(
      `SELECT id, provider, api_key, model, temperature, max_tokens
       FROM public.ai_config
       LIMIT 1`
    );

    if (!config) {
      return { provider: 'openai', model: 'gpt-4', temperature: 0.7, maxTokens: 1000 };
    }

    return {
      provider: config.provider,
      apiKey: config.api_key,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.max_tokens,
    };
  },

  async saveAIConfig(config: AIConfig): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    // Upsert
    const existing = await queryOne<{ id: string }>(`SELECT id FROM public.ai_config LIMIT 1`);

    if (existing) {
      await queryWithTenant(
        `UPDATE public.ai_config SET provider = $1, api_key = $2, model = $3, temperature = $4, max_tokens = $5`,
        [config.provider, config.apiKey || '', config.model, config.temperature, config.maxTokens]
      );
      return existing.id;
    }

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.ai_config (tenant_id, provider, api_key, model, temperature, max_tokens)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        tenantId,
        config.provider,
        config.apiKey || '',
        config.model,
        config.temperature,
        config.maxTokens,
      ]
    );

    return result?.id || '';
  },

  async logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.ai_usage_logs (tenant_id, user_id, prompt, response, tokens_used, cost, model)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [tenantId, log.userId, log.prompt, log.response, log.tokensUsed, log.cost, log.model]
    );

    return result?.id || 0;
  },
  // ========== LEARNING PATHS ==========

  async getAllLearningPaths(): Promise<LearningPath[]> {
    const paths = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, courses, created_at, updated_at
       FROM public.learning_paths
       ORDER BY title`
    );

    return paths.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      courses: p.courses || [],
    })) as LearningPath[];
  },

  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    const path = await queryOne<any>(
      `SELECT id, tenant_id, title, description, courses, created_at, updated_at
       FROM public.learning_paths WHERE id = $1`,
      [id]
    );

    if (!path) return undefined;

    return {
      id: path.id,
      title: path.title,
      description: path.description,
      courses: path.courses || [],
    } as LearningPath;
  },

  async addLearningPath(
    path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.learning_paths (tenant_id, title, description, courses)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [tenantId, path.title, path.description, path.courses || []]
    );

    return result?.id || 0;
  },

  async updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.courses !== undefined) {
      updates.push(`courses = $${paramIndex++}`);
      params.push(data.courses);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.learning_paths SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteLearningPath(id: number): Promise<void> {
    await queryWithTenant(`DELETE FROM public.learning_paths WHERE id = $1`, [id]);
  },

  async getLearningPathsForUser(
    user: User
  ): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> {
    const paths = await queryWithTenant<any>(
      `SELECT lp.id, lp.title, lp.description, lp.courses
       FROM public.learning_paths lp`
    );

    const result: (LearningPath & { progress: UserLearningPathProgress | undefined })[] = [];

    for (const p of paths) {
      const userProgress = await queryOne<any>(
        `SELECT completed_courses, current_course_index, started_at, completed_at
         FROM public.learning_path_progress
         WHERE user_id = $1 AND learning_path_id = $2`,
        [user.id, p.id]
      );

      result.push({
        id: p.id,
        title: p.title,
        description: p.description,
        courses: p.courses || [],
        progress: userProgress
          ? {
              completedCourses: userProgress.completed_courses || [],
              currentCourseIndex: userProgress.current_course_index,
              startedAt: userProgress.started_at,
              completedAt: userProgress.completed_at,
            }
          : undefined,
      });
    }

    return result;
  },
  // ========== PDI ==========

  async addPDI(
    pdi: Omit<IndividualDevelopmentPlan, 'id' | 'isSynced' | 'updatedAt' | 'createdAt'>
  ): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.individual_development_plans (
        tenant_id, user_id, title, description, status, manager_id, milestones, reviews, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        tenantId,
        pdi.userId,
        pdi.title,
        pdi.description,
        pdi.status || 'draft',
        pdi.managerId || null,
        JSON.stringify(pdi.milestones || []),
        JSON.stringify(pdi.reviews || []),
      ]
    );

    return result?.id || '';
  },

  async getPDIById(id: string): Promise<IndividualDevelopmentPlan | undefined> {
    const pdi = await queryOne<any>(
      `SELECT id, tenant_id, user_id, title, description, status, manager_id, milestones, reviews, created_at, updated_at
       FROM public.individual_development_plans WHERE id = $1`,
      [id]
    );

    if (!pdi) return undefined;

    return {
      id: pdi.id,
      userId: pdi.user_id,
      title: pdi.title,
      description: pdi.description,
      status: pdi.status,
      managerId: pdi.manager_id,
      milestones: pdi.milestones || [],
      reviews: pdi.reviews || [],
      createdAt: pdi.created_at,
    } as IndividualDevelopmentPlan;
  },

  async getPDIsForUser(userId: string): Promise<IndividualDevelopmentPlan[]> {
    const pdis = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, title, description, status, manager_id, milestones, reviews, created_at
       FROM public.individual_development_plans
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return pdis.map(p => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      description: p.description,
      status: p.status,
      managerId: p.manager_id,
      milestones: p.milestones || [],
      reviews: p.reviews || [],
      createdAt: p.created_at,
    })) as IndividualDevelopmentPlan[];
  },

  async getPDIsForManager(managerId: string): Promise<IndividualDevelopmentPlan[]> {
    const pdis = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, title, description, status, manager_id, milestones, reviews, created_at
       FROM public.individual_development_plans
       WHERE manager_id = $1
       ORDER BY created_at DESC`,
      [managerId]
    );

    return pdis.map(p => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      description: p.description,
      status: p.status,
      managerId: p.manager_id,
      milestones: p.milestones || [],
      reviews: p.reviews || [],
      createdAt: p.created_at,
    })) as IndividualDevelopmentPlan[];
  },

  async getAllPDIs(): Promise<IndividualDevelopmentPlan[]> {
    const pdis = await queryWithTenant<any>(
      `SELECT id, tenant_id, user_id, title, description, status, manager_id, milestones, reviews, created_at
       FROM public.individual_development_plans
       ORDER BY created_at DESC`
    );

    return pdis.map(p => ({
      id: p.id,
      userId: p.user_id,
      title: p.title,
      description: p.description,
      status: p.status,
      managerId: p.manager_id,
      milestones: p.milestones || [],
      reviews: p.reviews || [],
      createdAt: p.created_at,
    })) as IndividualDevelopmentPlan[];
  },

  async updatePDI(
    id: string,
    data: Partial<Omit<IndividualDevelopmentPlan, 'id' | 'createdAt'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.managerId !== undefined) {
      updates.push(`manager_id = $${paramIndex++}`);
      params.push(data.managerId);
    }
    if (data.milestones !== undefined) {
      updates.push(`milestones = $${paramIndex++}`);
      params.push(JSON.stringify(data.milestones));
    }
    if (data.reviews !== undefined) {
      updates.push(`reviews = $${paramIndex++}`);
      params.push(JSON.stringify(data.reviews));
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.individual_development_plans SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deletePDI(id: string): Promise<void> {
    await queryWithTenant(`DELETE FROM public.individual_development_plans WHERE id = $1`, [id]);
  },

  async addPDIReview(
    pdiId: string,
    review: Omit<IndividualDevelopmentPlan['reviews'][0], 'id' | 'createdAt'>
  ): Promise<number> {
    const pdi = await this.getPDIById(pdiId);
    if (!pdi) throw new Error('PDI not found');

    const reviews = [
      ...(pdi.reviews || []),
      { ...review, id: `review-${Date.now()}`, createdAt: new Date() },
    ];

    return await this.updatePDI(pdiId, { reviews });
  },

  async updatePDIMilestone(
    pdiId: string,
    milestoneId: string,
    updates: Partial<IndividualDevelopmentPlan['milestones'][0]>
  ): Promise<number> {
    const pdi = await this.getPDIById(pdiId);
    if (!pdi) throw new Error('PDI not found');

    const milestones = pdi.milestones.map(m => (m.id === milestoneId ? { ...m, ...updates } : m));

    return await this.updatePDI(pdiId, { milestones });
  },
  // ========== RATINGS ==========

  async addCourseRating(
    rating: Omit<CourseRating, 'id' | 'isPublic' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: number }>(
      `INSERT INTO public.course_ratings (
        tenant_id, user_id, course_id, rating, comment, is_public, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        tenantId,
        rating.userId,
        rating.courseId,
        rating.rating,
        rating.comment || null,
        rating.isPublic || false,
      ]
    );

    return result?.id || 0;
  },

  async getRatingByUserAndCourse(
    userId: string,
    courseId: string
  ): Promise<CourseRating | undefined> {
    const rating = await queryOne<any>(
      `SELECT id, tenant_id, user_id, course_id, rating, comment, is_public, created_at
       FROM public.course_ratings
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (!rating) return undefined;

    return {
      id: rating.id,
      userId: rating.user_id,
      courseId: rating.course_id,
      rating: rating.rating,
      comment: rating.comment,
      isPublic: rating.is_public,
      createdAt: rating.created_at,
    } as CourseRating;
  },

  async getRatingsForCourse(courseId: string): Promise<CourseRating[]> {
    const ratings = await queryWithTenant<any>(
      `SELECT r.id, r.user_id, r.course_id, r.rating, r.comment, r.is_public, r.created_at,
              u.name as user_name
       FROM public.course_ratings r
       JOIN public.users u ON r.user_id = u.id
       WHERE r.course_id = $1 AND r.is_public = true
       ORDER BY r.created_at DESC`,
      [courseId]
    );

    return ratings.map(r => ({
      id: r.id,
      userId: r.user_id,
      courseId: r.course_id,
      rating: r.rating,
      comment: r.comment,
      isPublic: r.is_public,
      createdAt: r.created_at,
      userName: r.user_name,
    })) as CourseRating[];
  },

  async getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> {
    const ratings = await queryWithTenant<any>(
      `SELECT r.id, r.user_id, r.course_id, r.rating, r.comment, r.is_public, r.created_at,
              u.name as user_name, c.title as course_title
       FROM public.course_ratings r
       JOIN public.users u ON r.user_id = u.id
       JOIN public.courses c ON r.course_id = c.id
       WHERE c.instructor = $1 AND r.is_public = true
       ORDER BY r.created_at DESC`,
      [instructorName]
    );

    return ratings.map(r => ({
      id: r.id,
      userId: r.user_id,
      courseId: r.course_id,
      rating: r.rating,
      comment: r.comment,
      isPublic: r.is_public,
      createdAt: r.created_at,
      userName: r.user_name,
      courseTitle: r.course_title,
    })) as CourseRating[];
  },

  async toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> {
    const result = await queryScalar<number>(
      `UPDATE public.course_ratings SET is_public = $1 WHERE id = $2 RETURNING 1`,
      [isPublic, ratingId]
    );
    return result ? 1 : 0;
  },
  // ========== PERMISSIONS ==========

  async getPermissionsForRole(role: Role): Promise<string[]> {
    const perms = await queryOne<{ visible_navs: string[] }>(
      `SELECT visible_navs FROM public.role_permissions WHERE role = $1`,
      [role]
    );

    return perms?.visible_navs || [];
  },

  async updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> {
    const existing = await queryOne<{ role: string }>(
      `SELECT role FROM public.role_permissions WHERE role = $1`,
      [role]
    );

    if (existing) {
      const result = await queryScalar<number>(
        `UPDATE public.role_permissions SET visible_navs = $1 WHERE role = $2 RETURNING 1`,
        [visibleNavs, role]
      );
      return result ? 1 : 0;
    }

    const result = await queryScalar<number>(
      `INSERT INTO public.role_permissions (role, visible_navs) VALUES ($1, $2) RETURNING 1`,
      [role, visibleNavs]
    );
    return result ? 1 : 0;
  },
  // ========== LOGS ==========

  async logSystemEvent(
    level: LogLevel,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    await queryWithTenant(
      `INSERT INTO public.system_logs (tenant_id, level, message, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [tenantId, level, message, details ? JSON.stringify(details) : null]
    );
  },

  async getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> {
    let query = `SELECT id, tenant_id, level, message, details, created_at FROM public.system_logs`;
    const params: any[] = [];

    if (filterLevel) {
      query += ` WHERE level = $1`;
      params.push(filterLevel);
    }

    query += ` ORDER BY created_at DESC LIMIT 1000`;

    const logs = await queryWithTenant<any>(query, params);

    return logs.map(l => ({
      id: l.id,
      level: l.level,
      message: l.message,
      details: l.details,
      createdAt: l.created_at,
    })) as SystemLog[];
  },

  async clearAllSystemLogs(): Promise<void> {
    await queryWithTenant(`DELETE FROM public.system_logs`);
  },
  // ========== REGULATIONS ==========

  async addRegulation(
    regulation: Omit<Regulation, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.regulations (
        tenant_id, title, description, category, target_roles, effective_date, expiry_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id`,
      [
        tenantId,
        regulation.title,
        regulation.description,
        regulation.category,
        regulation.targetRoles || [],
        regulation.effectiveDate || null,
        regulation.expiryDate || null,
      ]
    );

    return result?.id || '';
  },

  async getRegulationById(id: string): Promise<Regulation | undefined> {
    const reg = await queryOne<any>(
      `SELECT id, tenant_id, title, description, category, target_roles, effective_date, expiry_date, created_at, updated_at
       FROM public.regulations WHERE id = $1`,
      [id]
    );

    if (!reg) return undefined;

    return {
      id: reg.id,
      title: reg.title,
      description: reg.description,
      category: reg.category,
      targetRoles: reg.target_roles || [],
      effectiveDate: reg.effective_date,
      expiryDate: reg.expiry_date,
      createdAt: reg.created_at,
    } as Regulation;
  },

  async getAllRegulations(): Promise<Regulation[]> {
    const regs = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, category, target_roles, effective_date, expiry_date, created_at
       FROM public.regulations
       ORDER BY created_at DESC`
    );

    return regs.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      targetRoles: r.target_roles || [],
      effectiveDate: r.effective_date,
      expiryDate: r.expiry_date,
      createdAt: r.created_at,
    })) as Regulation[];
  },

  async getActiveRegulations(): Promise<Regulation[]> {
    const regs = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, category, target_roles, effective_date, expiry_date, created_at
       FROM public.regulations
       WHERE (effective_date IS NULL OR effective_date <= NOW())
         AND (expiry_date IS NULL OR expiry_date >= NOW())
       ORDER BY title`
    );

    return regs.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      targetRoles: r.target_roles || [],
      effectiveDate: r.effective_date,
      expiryDate: r.expiry_date,
      createdAt: r.created_at,
    })) as Regulation[];
  },

  async updateRegulation(
    id: string,
    data: Partial<Omit<Regulation, 'id' | 'createdAt'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.targetRoles !== undefined) {
      updates.push(`target_roles = $${paramIndex++}`);
      params.push(data.targetRoles);
    }
    if (data.effectiveDate !== undefined) {
      updates.push(`effective_date = $${paramIndex++}`);
      params.push(data.effectiveDate);
    }
    if (data.expiryDate !== undefined) {
      updates.push(`expiry_date = $${paramIndex++}`);
      params.push(data.expiryDate);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.regulations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteRegulation(id: string): Promise<void> {
    await queryWithTenant(`DELETE FROM public.regulations WHERE id = $1`, [id]);
  },

  async getRegulationsForRole(role: Role): Promise<Regulation[]> {
    const regs = await queryWithTenant<any>(
      `SELECT id, tenant_id, title, description, category, target_roles, effective_date, expiry_date, created_at
       FROM public.regulations
       WHERE target_roles = '{}' OR $1 = ANY(target_roles)
         AND (effective_date IS NULL OR effective_date <= NOW())
         AND (expiry_date IS NULL OR expiry_date >= NOW())
       ORDER BY title`,
      [role]
    );

    return regs.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      targetRoles: r.target_roles || [],
      effectiveDate: r.effective_date,
      expiryDate: r.expiry_date,
      createdAt: r.created_at,
    })) as Regulation[];
  },

  async getRegulationsForUser(userId: string): Promise<Regulation[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    return this.getRegulationsForRole(user.role);
  },
  // ========== REGULATION COMPLIANCE ==========

  async addRegulationCompliance(
    compliance: Omit<RegulationCompliance, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.regulation_compliances (
        tenant_id, user_id, regulation_id, status, completed_date, expiry_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        tenantId,
        compliance.userId,
        compliance.regulationId,
        compliance.status || 'pending',
        compliance.completedDate || null,
        compliance.expiryDate || null,
      ]
    );

    return result?.id || '';
  },

  async getRegulationComplianceById(id: string): Promise<RegulationCompliance | undefined> {
    const comp = await queryOne<any>(
      `SELECT id, tenant_id, user_id, regulation_id, status, completed_date, expiry_date, created_at, updated_at
       FROM public.regulation_compliances WHERE id = $1`,
      [id]
    );

    if (!comp) return undefined;

    return {
      id: comp.id,
      userId: comp.user_id,
      regulationId: comp.regulation_id,
      status: comp.status,
      completedDate: comp.completed_date,
      expiryDate: comp.expiry_date,
      createdAt: comp.created_at,
    } as RegulationCompliance;
  },

  async getComplianceForUser(userId: string): Promise<RegulationCompliance[]> {
    const comps = await queryWithTenant<any>(
      `SELECT c.id, c.user_id, c.regulation_id, c.status, c.completed_date, c.expiry_date, c.created_at,
              r.title as regulation_title
       FROM public.regulation_compliances c
       JOIN public.regulations r ON c.regulation_id = r.id
       WHERE c.user_id = $1
       ORDER BY c.expiry_date`,
      [userId]
    );

    return comps.map(c => ({
      id: c.id,
      userId: c.user_id,
      regulationId: c.regulation_id,
      status: c.status,
      completedDate: c.completed_date,
      expiryDate: c.expiry_date,
      createdAt: c.created_at,
      regulationTitle: c.regulation_title,
    })) as RegulationCompliance[];
  },

  async getComplianceForRegulation(regulationId: string): Promise<RegulationCompliance[]> {
    const comps = await queryWithTenant<any>(
      `SELECT c.id, c.user_id, c.regulation_id, c.status, c.completed_date, c.expiry_date, c.created_at,
              u.name as user_name
       FROM public.regulation_compliances c
       JOIN public.users u ON c.user_id = u.id
       WHERE c.regulation_id = $1
       ORDER BY u.name`,
      [regulationId]
    );

    return comps.map(c => ({
      id: c.id,
      userId: c.user_id,
      regulationId: c.regulation_id,
      status: c.status,
      completedDate: c.completed_date,
      expiryDate: c.expiry_date,
      createdAt: c.created_at,
      userName: c.user_name,
    })) as RegulationCompliance[];
  },

  async updateRegulationCompliance(
    id: string,
    data: Partial<Omit<RegulationCompliance, 'id' | 'createdAt'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.completedDate !== undefined) {
      updates.push(`completed_date = $${paramIndex++}`);
      params.push(data.completedDate);
    }
    if (data.expiryDate !== undefined) {
      updates.push(`expiry_date = $${paramIndex++}`);
      params.push(data.expiryDate);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.regulation_compliances SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteRegulationCompliance(id: string): Promise<void> {
    await queryWithTenant(`DELETE FROM public.regulation_compliances WHERE id = $1`, [id]);
  },

  async getExpiringCompliance(daysAhead: number): Promise<RegulationCompliance[]> {
    const comps = await queryWithTenant<any>(
      `SELECT c.id, c.user_id, c.regulation_id, c.status, c.completed_date, c.expiry_date, c.created_at,
              u.name as user_name, r.title as regulation_title
       FROM public.regulation_compliances c
       JOIN public.users u ON c.user_id = u.id
       JOIN public.regulations r ON c.regulation_id = r.id
       WHERE c.expiry_date IS NOT NULL
         AND c.expiry_date BETWEEN NOW() AND NOW() + INTERVAL '1 day' * $1
       ORDER BY c.expiry_date`,
      [daysAhead]
    );

    return comps.map(c => ({
      id: c.id,
      userId: c.user_id,
      regulationId: c.regulation_id,
      status: c.status,
      completedDate: c.completed_date,
      expiryDate: c.expiry_date,
      createdAt: c.created_at,
      userName: c.user_name,
      regulationTitle: c.regulation_title,
    })) as RegulationCompliance[];
  },

  async checkUserCompliance(
    userId: string,
    regulationId: string
  ): Promise<RegulationCompliance | undefined> {
    const comp = await queryOne<any>(
      `SELECT id, tenant_id, user_id, regulation_id, status, completed_date, expiry_date, created_at
       FROM public.regulation_compliances
       WHERE user_id = $1 AND regulation_id = $2`,
      [userId, regulationId]
    );

    if (!comp) return undefined;

    return {
      id: comp.id,
      userId: comp.user_id,
      regulationId: comp.regulation_id,
      status: comp.status,
      completedDate: comp.completed_date,
      expiryDate: comp.expiry_date,
      createdAt: comp.created_at,
    } as RegulationCompliance;
  },
  // ========== COMPLIANCE AUDIT ==========

  async addComplianceAudit(
    audit: Omit<ComplianceAudit, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');

    const result = await queryOne<{ id: string }>(
      `INSERT INTO public.compliance_audits (
        tenant_id, regulation_id, auditor_id, audit_date, findings, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        tenantId,
        audit.regulationId,
        audit.auditorId,
        audit.auditDate,
        audit.findings || '',
        audit.status || 'pending',
      ]
    );

    return result?.id || '';
  },

  async getComplianceAuditById(id: string): Promise<ComplianceAudit | undefined> {
    const audit = await queryOne<any>(
      `SELECT id, tenant_id, regulation_id, auditor_id, audit_date, findings, status, created_at, updated_at
       FROM public.compliance_audits WHERE id = $1`,
      [id]
    );

    if (!audit) return undefined;

    return {
      id: audit.id,
      regulationId: audit.regulation_id,
      auditorId: audit.auditor_id,
      auditDate: audit.audit_date,
      findings: audit.findings,
      status: audit.status,
      createdAt: audit.created_at,
    } as ComplianceAudit;
  },

  async getAllComplianceAudits(): Promise<ComplianceAudit[]> {
    const audits = await queryWithTenant<any>(
      `SELECT a.id, a.regulation_id, a.auditor_id, a.audit_date, a.findings, a.status, a.created_at,
              r.title as regulation_title, u.name as auditor_name
       FROM public.compliance_audits a
       JOIN public.regulations r ON a.regulation_id = r.id
       JOIN public.users u ON a.auditor_id = u.id
       ORDER BY a.audit_date DESC`
    );

    return audits.map(a => ({
      id: a.id,
      regulationId: a.regulation_id,
      auditorId: a.auditor_id,
      auditDate: a.audit_date,
      findings: a.findings,
      status: a.status,
      createdAt: a.created_at,
      regulationTitle: a.regulation_title,
      auditorName: a.auditor_name,
    })) as ComplianceAudit[];
  },

  async getAuditsForRegulation(regulationId: string): Promise<ComplianceAudit[]> {
    const audits = await queryWithTenant<any>(
      `SELECT a.id, a.regulation_id, a.auditor_id, a.audit_date, a.findings, a.status, a.created_at,
              u.name as auditor_name
       FROM public.compliance_audits a
       JOIN public.users u ON a.auditor_id = u.id
       WHERE a.regulation_id = $1
       ORDER BY a.audit_date DESC`,
      [regulationId]
    );

    return audits.map(a => ({
      id: a.id,
      regulationId: a.regulation_id,
      auditorId: a.auditor_id,
      auditDate: a.audit_date,
      findings: a.findings,
      status: a.status,
      createdAt: a.created_at,
      auditorName: a.auditor_name,
    })) as ComplianceAudit[];
  },

  async updateComplianceAudit(
    id: string,
    data: Partial<Omit<ComplianceAudit, 'id' | 'createdAt'>>
  ): Promise<number> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.auditDate !== undefined) {
      updates.push(`audit_date = $${paramIndex++}`);
      params.push(data.auditDate);
    }
    if (data.findings !== undefined) {
      updates.push(`findings = $${paramIndex++}`);
      params.push(data.findings);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }

    if (updates.length === 0) return 0;
    params.push(id);

    const result = await queryScalar<number>(
      `UPDATE public.compliance_audits SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING 1`,
      params
    );
    return result ? 1 : 0;
  },

  async deleteComplianceAudit(id: string): Promise<void> {
    await queryWithTenant(`DELETE FROM public.compliance_audits WHERE id = $1`, [id]);
  },
  async getUnsyncedItemsCount(): Promise<number> {
    return 0;
  },
  async syncWithSupabase(): Promise<{ success: boolean; message: string }> {
    return { success: false, message: 'Not applicable for PostgreSQL provider' };
  },
};
