/**
 * TT-114: Provider PostgreSQL para DBProvider.
 * Implementa la interfaz DBProvider usando PostgreSQL con RLS.
 * Cada método ejecuta SET app.current_tenant_id antes de queries.
 */

import type { DBProvider } from './types';
import type {
  User, Course, Enrollment, UserProgress, Certificate, CertificateTemplate,
  ForumMessage, Notification, Resource, Announcement, ChatChannel, ChatMessage,
  CalendarEvent, ExternalTraining, Cost, Badge, UserBadge, AIConfig, AIUsageLog,
  LearningPath, UserLearningPathProgress, CourseRating, RolePermission, SystemLog,
  IndividualDevelopmentPlan, Regulation, RegulationCompliance, ComplianceAudit,
  ScormCmiState, PendingEnrollmentDetails, EnrollmentWithDetails, StudentForManagement,
  ComplianceReportData, DirectMessageThread, CourseResource, Role, UserStatus,
  CustomCostCategory, EnrollmentStatus, CertificateStatus, PDIStatus, LogLevel
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
async function queryWithTenant<T = any>(
  queryText: string,
  params?: any[]
): Promise<T[]> {
  const pool = await initPostgresPool();
  const tenantId = getCurrentTenantId();
  
  if (!tenantId) {
    throw new Error('Tenant context required. Use requireTenant() or runWithTenant() in API routes.');
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
async function queryOne<T = any>(
  queryText: string,
  params?: any[]
): Promise<T | undefined> {
  const rows = await queryWithTenant<T>(queryText, params);
  return rows[0];
}

/**
 * Ejecuta una query que devuelve un número (ej. COUNT, UPDATE ... RETURNING id).
 */
async function queryScalar<T = number>(
  queryText: string,
  params?: any[]
): Promise<T> {
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
} as unknown as Dexie;

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
  
  async addUser(user: Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken' | 'passwordHash'> & { password?: string }): Promise<User> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new Error('Tenant context required');
    
    if (!user.password) {
      throw new Error('La contraseña es obligatoria.');
    }
    
    const passwordHash = await hashPassword(user.password);
    const requiresApproval = ['Formador', 'Jefe de Formación', 'Gestor de RRHH', 'Administrador General'].includes(user.role);
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
  
  async bulkAddUsers(users: Array<Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken' | 'passwordHash'> & { password?: string }>): Promise<string[]> {
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
        const requiresApproval = ['Formador', 'Jefe de Formación', 'Gestor de RRHH', 'Administrador General'].includes(user.role);
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
    return user ? { ...user, passwordHash: undefined } as User : undefined;
  },
  
  async updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'passwordHash'>>): Promise<number> {
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
    await queryWithTenant(
      `DELETE FROM public.users WHERE id = $1`,
      [id]
    );
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
  
  // ========== PLACEHOLDER METHODS (to be implemented) ==========
  // Estos métodos deben implementarse siguiendo el mismo patrón:
  // 1. Obtener tenantId con getCurrentTenantId()
  // 2. Usar queryWithTenant() o queryOne() para queries
  // 3. RLS filtra automáticamente por tenant_id
  
  async addCertificate(certificate: Omit<Certificate, 'id' | 'isSynced' | 'updatedAt'>): Promise<string> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificateById(id: string): Promise<Certificate | undefined> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificatesForUser(userId: string): Promise<Certificate[]> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificatesForCourse(courseId: string): Promise<Certificate[]> {
    throw new Error('Not implemented yet');
  },
  
  async getAllCertificates(): Promise<Certificate[]> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    throw new Error('Not implemented yet');
  },
  
  async updateCertificateStatus(id: string, status: CertificateStatus): Promise<number> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificateForUserCourse(userId: string, courseId: string): Promise<Certificate | undefined> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    throw new Error('Not implemented yet');
  },
  
  async getCertificateTemplateById(id: string): Promise<CertificateTemplate | undefined> {
    throw new Error('Not implemented yet');
  },
  
  async updateCertificateTemplate(id: string, data: Partial<Omit<CertificateTemplate, 'id' | 'createdAt'>>): Promise<number> {
    throw new Error('Not implemented yet');
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
    
    if (data.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(data.title); }
    if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(data.description); }
    if (data.longDescription !== undefined) { updates.push(`long_description = $${paramIndex++}`); params.push(data.longDescription); }
    if (data.instructor !== undefined) { updates.push(`instructor = $${paramIndex++}`); params.push(data.instructor); }
    if (data.duration !== undefined) { updates.push(`duration = $${paramIndex++}`); params.push(data.duration); }
    if (data.modality !== undefined) { updates.push(`modality = $${paramIndex++}`); params.push(data.modality); }
    if (data.image !== undefined) { updates.push(`image = $${paramIndex++}`); params.push(data.image); }
    if (data.aiHint !== undefined) { updates.push(`ai_hint = $${paramIndex++}`); params.push(data.aiHint); }
    if (data.modules !== undefined) { updates.push(`modules = $${paramIndex++}`); params.push(JSON.stringify(data.modules)); }
    if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(data.status); }
    if (data.mandatoryForRoles !== undefined) { updates.push(`mandatory_for_roles = $${paramIndex++}`); params.push(data.mandatoryForRoles); }
    if (data.startDate !== undefined) { updates.push(`start_date = $${paramIndex++}`); params.push(data.startDate); }
    if (data.endDate !== undefined) { updates.push(`end_date = $${paramIndex++}`); params.push(data.endDate); }
    if (data.category !== undefined) { updates.push(`category = $${paramIndex++}`); params.push(data.category); }
    if (data.capacity !== undefined) { updates.push(`capacity = $${paramIndex++}`); params.push(data.capacity); }
    
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
    const activeStatuses = ['pending', 'approved', 'active', 'waitlisted', 'needs_review', 'completed'];
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
  
  async updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number> {
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
  
  async saveScormCmiState(userId: string, courseId: string, data: Omit<ScormCmiState, 'id' | 'userId' | 'courseId' | 'updatedAt'>): Promise<void> {
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
  async addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> { throw new Error('Not implemented yet'); }
  async deleteForumMessage(messageId: number): Promise<void> { throw new Error('Not implemented yet'); }
  async addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getNotificationsForUser(userId: string): Promise<Notification[]> { throw new Error('Not implemented yet'); }
  async markNotificationAsRead(notificationId: number): Promise<number> { throw new Error('Not implemented yet'); }
  async markAllNotificationsAsRead(userId: string): Promise<void> { throw new Error('Not implemented yet'); }
  async checkAndSendDeadlineReminders(user: User): Promise<void> { throw new Error('Not implemented yet'); }
  async addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getAllResources(): Promise<Resource[]> { throw new Error('Not implemented yet'); }
  async deleteResource(resourceId: number): Promise<void> { throw new Error('Not implemented yet'); }
  async associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> { throw new Error('Not implemented yet'); }
  async dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getResourcesForCourse(courseId: string): Promise<Resource[]> { throw new Error('Not implemented yet'); }
  async getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> { throw new Error('Not implemented yet'); }
  async addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteAnnouncement(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getAllAnnouncements(): Promise<Announcement[]> { throw new Error('Not implemented yet'); }
  async getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> { throw new Error('Not implemented yet'); }
  async addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getChatMessages(channelId: number | string): Promise<ChatMessage[]> { throw new Error('Not implemented yet'); }
  async getPublicChatChannels(): Promise<ChatChannel[]> { throw new Error('Not implemented yet'); }
  async addPublicChatChannel(name: string, description: string): Promise<string> { throw new Error('Not implemented yet'); }
  async getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> { throw new Error('Not implemented yet'); }
  async getOrCreateDirectMessageThread(currentUserId: string, otherUserId: string): Promise<ChatChannel> { throw new Error('Not implemented yet'); }
  async getComplianceReportData(departmentFilter?: string, roleFilter?: string): Promise<ComplianceReportData[]> { throw new Error('Not implemented yet'); }
  async getAllCalendarEvents(): Promise<CalendarEvent[]> { throw new Error('Not implemented yet'); }
  async getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> { throw new Error('Not implemented yet'); }
  async addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteCalendarEvent(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> { throw new Error('Not implemented yet'); }
  async addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteExternalTraining(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getAllCosts(): Promise<Cost[]> { throw new Error('Not implemented yet'); }
  async addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteCost(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getAllCostCategories(): Promise<CustomCostCategory[]> { throw new Error('Not implemented yet'); }
  async addCostCategory(category: { name: string }): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteCostCategory(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getCoursesByInstructorName(instructorName: string): Promise<Course[]> { throw new Error('Not implemented yet'); }
  async getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> { throw new Error('Not implemented yet'); }
  async getAllBadges(): Promise<Badge[]> { throw new Error('Not implemented yet'); }
  async getBadgesForUser(userId: string): Promise<UserBadge[]> { throw new Error('Not implemented yet'); }
  async awardBadge(userId: string, badgeId: string): Promise<void> { throw new Error('Not implemented yet'); }
  async getAIConfig(): Promise<AIConfig> { throw new Error('Not implemented yet'); }
  async saveAIConfig(config: AIConfig): Promise<string> { throw new Error('Not implemented yet'); }
  async logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getAllLearningPaths(): Promise<LearningPath[]> { throw new Error('Not implemented yet'); }
  async getLearningPathById(id: number): Promise<LearningPath | undefined> { throw new Error('Not implemented yet'); }
  async addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteLearningPath(id: number): Promise<void> { throw new Error('Not implemented yet'); }
  async getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> { throw new Error('Not implemented yet'); }
  async addPDI(pdi: Omit<IndividualDevelopmentPlan, 'id' | 'isSynced' | 'updatedAt' | 'createdAt'>): Promise<string> { throw new Error('Not implemented yet'); }
  async getPDIById(id: string): Promise<IndividualDevelopmentPlan | undefined> { throw new Error('Not implemented yet'); }
  async getPDIsForUser(userId: string): Promise<IndividualDevelopmentPlan[]> { throw new Error('Not implemented yet'); }
  async getPDIsForManager(managerId: string): Promise<IndividualDevelopmentPlan[]> { throw new Error('Not implemented yet'); }
  async getAllPDIs(): Promise<IndividualDevelopmentPlan[]> { throw new Error('Not implemented yet'); }
  async updatePDI(id: string, data: Partial<Omit<IndividualDevelopmentPlan, 'id' | 'createdAt'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deletePDI(id: string): Promise<void> { throw new Error('Not implemented yet'); }
  async addPDIReview(pdiId: string, review: Omit<IndividualDevelopmentPlan['reviews'][0], 'id' | 'createdAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async updatePDIMilestone(pdiId: string, milestoneId: string, updates: Partial<IndividualDevelopmentPlan['milestones'][0]>): Promise<number> { throw new Error('Not implemented yet'); }
  async addCourseRating(rating: Omit<CourseRating, 'id' | 'isPublic' | 'isSynced' | 'updatedAt'>): Promise<number> { throw new Error('Not implemented yet'); }
  async getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined> { throw new Error('Not implemented yet'); }
  async getRatingsForCourse(courseId: string): Promise<CourseRating[]> { throw new Error('Not implemented yet'); }
  async getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> { throw new Error('Not implemented yet'); }
  async toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> { throw new Error('Not implemented yet'); }
  async getPermissionsForRole(role: Role): Promise<string[]> { throw new Error('Not implemented yet'); }
  async updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> { throw new Error('Not implemented yet'); }
  async logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void> { throw new Error('Not implemented yet'); }
  async getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> { throw new Error('Not implemented yet'); }
  async clearAllSystemLogs(): Promise<void> { throw new Error('Not implemented yet'); }
  async addRegulation(regulation: Omit<Regulation, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string> { throw new Error('Not implemented yet'); }
  async getRegulationById(id: string): Promise<Regulation | undefined> { throw new Error('Not implemented yet'); }
  async getAllRegulations(): Promise<Regulation[]> { throw new Error('Not implemented yet'); }
  async getActiveRegulations(): Promise<Regulation[]> { throw new Error('Not implemented yet'); }
  async updateRegulation(id: string, data: Partial<Omit<Regulation, 'id' | 'createdAt'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteRegulation(id: string): Promise<void> { throw new Error('Not implemented yet'); }
  async getRegulationsForRole(role: Role): Promise<Regulation[]> { throw new Error('Not implemented yet'); }
  async getRegulationsForUser(userId: string): Promise<Regulation[]> { throw new Error('Not implemented yet'); }
  async addRegulationCompliance(compliance: Omit<RegulationCompliance, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string> { throw new Error('Not implemented yet'); }
  async getRegulationComplianceById(id: string): Promise<RegulationCompliance | undefined> { throw new Error('Not implemented yet'); }
  async getComplianceForUser(userId: string): Promise<RegulationCompliance[]> { throw new Error('Not implemented yet'); }
  async getComplianceForRegulation(regulationId: string): Promise<RegulationCompliance[]> { throw new Error('Not implemented yet'); }
  async updateRegulationCompliance(id: string, data: Partial<Omit<RegulationCompliance, 'id' | 'createdAt'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteRegulationCompliance(id: string): Promise<void> { throw new Error('Not implemented yet'); }
  async getExpiringCompliance(daysAhead: number): Promise<RegulationCompliance[]> { throw new Error('Not implemented yet'); }
  async checkUserCompliance(userId: string, regulationId: string): Promise<RegulationCompliance | undefined> { throw new Error('Not implemented yet'); }
  async addComplianceAudit(audit: Omit<ComplianceAudit, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string> { throw new Error('Not implemented yet'); }
  async getComplianceAuditById(id: string): Promise<ComplianceAudit | undefined> { throw new Error('Not implemented yet'); }
  async getAllComplianceAudits(): Promise<ComplianceAudit[]> { throw new Error('Not implemented yet'); }
  async getAuditsForRegulation(regulationId: string): Promise<ComplianceAudit[]> { throw new Error('Not implemented yet'); }
  async updateComplianceAudit(id: string, data: Partial<Omit<ComplianceAudit, 'id' | 'createdAt'>>): Promise<number> { throw new Error('Not implemented yet'); }
  async deleteComplianceAudit(id: string): Promise<void> { throw new Error('Not implemented yet'); }
  async getUnsyncedItemsCount(): Promise<number> { return 0; }
  async syncWithSupabase(): Promise<{ success: boolean; message: string; }> { return { success: false, message: 'Not applicable for PostgreSQL provider' }; }
};
