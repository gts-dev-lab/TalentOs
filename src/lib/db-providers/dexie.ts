// src/lib/db-providers/dexie.ts

/**
 * This is the Dexie implementation of the DBProvider interface.
 * All data access logic for the application when using the local
 * IndexedDB is contained within this file.
 */

import Dexie, { type Table } from 'dexie';
import type {
  Course,
  User,
  Enrollment,
  UserProgress,
  PendingEnrollmentDetails,
  ForumMessage,
  ForumMessageWithReplies,
  Notification,
  Resource,
  CourseResource,
  Announcement,
  ChatChannel,
  ChatMessage,
  Role,
  ComplianceReportData,
  DirectMessageThread,
  CalendarEvent,
  ExternalTraining,
  EnrollmentStatus,
  EnrollmentWithDetails,
  Cost,
  StudentForManagement,
  AIConfig,
  AIUsageLog,
  Badge,
  UserBadge,
  UserStatus,
  CustomCostCategory,
  LearningPath,
  UserLearningPathProgress,
  CourseRating,
  RolePermission,
  SystemLog,
  LogLevel,
  Certificate,
  CertificateTemplate,
  CertificateStatus,
  IndividualDevelopmentPlan,
  PDIStatus,
  Regulation,
  RegulationCompliance,
  ComplianceAudit,
  ScormCmiState,
} from '@/lib/types';
import {
  courses as initialCourses,
  users as initialUsers,
  initialChatChannels,
  initialCosts,
  defaultAIConfig,
  roles,
  departments,
  initialBadges,
  initialCostCategories,
  initialCertificateTemplates,
  initialEnrollments,
  initialUserProgress,
} from '@/lib/data';
// Nota: Las notificaciones ahora se envían a través de server actions
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getNavItems } from '@/lib/nav';
import { uuid } from '@/lib/uuid';
import { differenceInDays, isAfter } from 'date-fns';
import type { DBProvider } from './types';
import { syncToSupabase } from '@/lib/supabase-sync';

const LOGGED_IN_USER_KEY = 'loggedInUserId';

// --- DEXIE DATABASE DEFINITION ---
class TalentOSDB extends Dexie {
  courses!: Table<Course, string>;
  users!: Table<User, string>;
  enrollments!: Table<Enrollment, number>;
  userProgress!: Table<UserProgress, number>;
  forumMessages!: Table<ForumMessage, number>;
  notifications!: Table<Notification, number>;
  resources!: Table<Resource, number>;
  courseResources!: Table<CourseResource, number>;
  announcements!: Table<Announcement, number>;
  chatChannels!: Table<ChatChannel, string>;
  chatMessages!: Table<ChatMessage, number>;
  calendarEvents!: Table<CalendarEvent, number>;
  externalTrainings!: Table<ExternalTraining, number>;
  costs!: Table<Cost, number>;
  aiConfig!: Table<AIConfig, string>;
  aiUsageLog!: Table<AIUsageLog, number>;
  badges!: Table<Badge, string>;
  userBadges!: Table<UserBadge, number>;
  costCategories!: Table<CustomCostCategory, number>;
  learningPaths!: Table<LearningPath, number>;
  userLearningPathProgress!: Table<UserLearningPathProgress, number>;
  courseRatings!: Table<CourseRating, number>;
  rolePermissions!: Table<RolePermission, string>;
  systemLogs!: Table<SystemLog, number>;
  certificates!: Table<Certificate, string>;
  certificateTemplates!: Table<CertificateTemplate, string>;
  individualDevelopmentPlans!: Table<IndividualDevelopmentPlan, string>;
  regulations!: Table<Regulation, string>;
  regulationCompliance!: Table<RegulationCompliance, string>;
  complianceAudits!: Table<ComplianceAudit, string>;
  scormCmiState!: Table<ScormCmiState, number>;

  constructor() {
    super('TalentOSDB');
    this.version(41).stores({
      courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles',
      users: 'id, &email, status, points, isSynced',
      enrollments: '++id, studentId, courseId, status, [studentId+status]',
      userProgress: '++id, [userId+courseId], userId, courseId',
      forumMessages: '++id, courseId, parentId, timestamp',
      notifications:
        '++id, userId, isRead, timestamp, [userId+timestamp], [userId+type+relatedUrl]',
      resources: '++id, name',
      courseResources: '++id, [courseId+resourceId]',
      announcements: '++id, timestamp',
      chatChannels: 'id, name, type, *participantIds',
      chatMessages: '++id, channelId, timestamp, [channelId+timestamp]',
      calendarEvents: '++id, courseId, start, end, isSynced',
      externalTrainings: '++id, userId',
      costs: '++id, category, courseId, date',
      aiConfig: 'id',
      aiUsageLog: '++id, timestamp',
      badges: 'id',
      userBadges: '++id, [userId+badgeId]',
      costCategories: '++id, &name',
      learningPaths: '++id, targetRole',
      userLearningPathProgress: '++id, [userId+learningPathId]',
      courseRatings: '++id, [courseId+userId], courseId, instructorName',
      rolePermissions: '&role',
      systemLogs: '++id, timestamp, level',
      certificates:
        'id, userId, courseId, status, issuedAt, expiresAt, verificationCode, [userId+courseId]',
      certificateTemplates: 'id, type, isActive',
    });
    this.version(42).stores({
      enrollments: '++id, studentId, courseId, status, isSynced, [studentId+status]',
      userProgress: '++id, [userId+courseId], userId, courseId, isSynced',
      costs: '++id, category, courseId, date, isSynced',
      certificates:
        'id, userId, courseId, status, issuedAt, expiresAt, verificationCode, isSynced, [userId+courseId]',
      certificateTemplates: 'id, type, isActive, isSynced',
    });
    this.version(43).stores({
      individualDevelopmentPlans:
        'id, userId, managerId, status, startDate, endDate, [userId+status], [managerId+status], isSynced',
    });
    this.version(44).stores({
      regulations: 'id, code, type, isActive, *applicableRoles, isSynced',
      regulationCompliance:
        'id, userId, regulationId, complianceDate, expirationDate, [userId+regulationId], [regulationId+expirationDate], isSynced',
      complianceAudits: 'id, regulationId, auditDate, auditorId, status, isSynced',
    });
    // Version 45: Additional indexes for query optimization
    this.version(45).stores({
      courses: 'id, instructor, status, isScorm, isSynced, *mandatoryForRoles, [instructor+status]',
      users: 'id, &email, status, points, isSynced, [status+role], [department+status]',
      enrollments:
        '++id, studentId, courseId, status, isSynced, [studentId+status], [courseId+status], [studentId+courseId]',
      userProgress: '++id, [userId+courseId], userId, courseId, isSynced, [courseId+userId]',
      forumMessages: '++id, courseId, parentId, timestamp, [courseId+timestamp]',
      notifications:
        '++id, userId, isRead, timestamp, [userId+timestamp], [userId+type+relatedUrl], [userId+isRead]',
      chatMessages: '++id, channelId, timestamp, [channelId+timestamp], [channelId+timestamp+id]',
      calendarEvents: '++id, courseId, start, end, isSynced, [courseId+start]',
      costs: '++id, category, courseId, date, isSynced, [category+date], [courseId+date]',
      systemLogs: '++id, timestamp, level, [level+timestamp]',
      certificates:
        'id, userId, courseId, status, issuedAt, expiresAt, verificationCode, isSynced, [userId+courseId], [status+expiresAt], [expiresAt+status]',
      courseRatings:
        '++id, [courseId+userId], courseId, instructorName, [instructorName+timestamp]',
    });
    this.version(46).stores({
      scormCmiState: '++id, [userId+courseId], userId, courseId, updatedAt',
    });
    this.version(47).stores({
      systemLogs: '++id, timestamp, level, userId, [level+timestamp]',
    });
    this.version(48).stores({
      systemLogs: '++id, timestamp, level, userId, [level+timestamp]',
    });
  }

  async logSystemEvent(
    level: LogLevel,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.systemLogs.add({ timestamp: new Date().toISOString(), level, message, details });
    } catch (error) {
      // Must not crash the app if logging fails
      console.warn('Logging failed:', error);
    }
  }
}

const dbInstance = new TalentOSDB();

// Populate the database if it's empty
dbInstance.on('populate', async () => {
  await populateDatabase();
});

// --- Population Logic (extracted to be called by 'populate' event) ---
async function populateDatabase() {
  await dbInstance.transaction('rw', dbInstance.tables, async () => {
    const initialPermissions: RolePermission[] = roles.map(role => {
      const visibleNavs = getNavItems()
        .filter(item => item.roles.includes(role))
        .map(item => item.href);
      return { role, visibleNavs };
    });

    await dbInstance.courses.bulkAdd(initialCourses.map(c => ({ ...c, isSynced: true })));
    await dbInstance.users.bulkAdd(initialUsers.map(u => ({ ...u, isSynced: true })));
    await dbInstance.chatChannels.bulkAdd(initialChatChannels);
    await dbInstance.costs.bulkAdd(initialCosts.map(c => ({ ...c, isSynced: true })));
    await dbInstance.aiConfig.add(defaultAIConfig);
    await dbInstance.badges.bulkAdd(initialBadges);
    await dbInstance.costCategories.bulkAdd(initialCostCategories.map(name => ({ name })));
    await dbInstance.rolePermissions.bulkAdd(initialPermissions);
    await dbInstance.certificateTemplates.bulkAdd(initialCertificateTemplates);
    // Agregar enrollments y progreso de usuario para datos demo
    await dbInstance.enrollments.bulkAdd(
      initialEnrollments.map(e => ({ ...e, updatedAt: e.requestDate }))
    );
    await dbInstance.userProgress.bulkAdd(initialUserProgress);
  });
}

// --- DEXIE PROVIDER IMPLEMENTATION ---

export const dexieProvider: DBProvider = {
  db: dbInstance,

  async populateDatabase() {
    await populateDatabase();
  },

  async login(email: string, password?: string): Promise<User | null> {
    if (!password) {
      throw new Error('La contraseña es obligatoria.');
    }
    const user = await dbInstance.users.where('email').equalsIgnoreCase(email).first();
    if (!user) {
      throw new Error('El usuario no existe.');
    }
    if (user.deletedAt) {
      throw new Error('Esta cuenta ha sido eliminada.');
    }
    const legacyPassword = (user as { password?: string }).password;
    if (user.passwordHash) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) throw new Error('La contraseña es incorrecta.');
    } else if (legacyPassword) {
      if (legacyPassword !== password) {
        throw new Error('La contraseña es incorrecta.');
      }
      const migratedHash = await hashPassword(password);
      await dbInstance.users.update(user.id, {
        passwordHash: migratedHash,
        updatedAt: new Date().toISOString(),
        isSynced: false,
      });
    } else {
      throw new Error('Este usuario no tiene contraseña configurada.');
    }
    if (user.status === 'suspended') {
      throw new Error('Esta cuenta ha sido desactivada. Contacta con un administrador.');
    }
    if (user.status === 'pending_approval') {
      throw new Error('Esta cuenta está pendiente de aprobación por un administrador.');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOGGED_IN_USER_KEY, user.id);
    }
    return user;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOGGED_IN_USER_KEY);
    }
  },

  async getLoggedInUser(): Promise<User | null> {
    if (typeof window === 'undefined') {
      return null; // Avoid accessing localStorage on the server
    }
    const userId = localStorage.getItem(LOGGED_IN_USER_KEY);
    if (!userId) return null;
    const user = await dbInstance.users.get(userId);
    return user && !user.deletedAt ? user : null;
  },

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
    const existingUser = await dbInstance.users.where('email').equalsIgnoreCase(user.email).first();
    if (existingUser) {
      throw new Error('Este correo electrónico ya está en uso.');
    }
    if (!user.password) {
      throw new Error('La contraseña es obligatoria.');
    }
    const requiresApproval = [
      'Formador',
      'Jefe de Formación',
      'Gestor de RRHH',
      'Administrador General',
    ].includes(user.role);
    const { password, ...userData } = user;
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      ...userData,
      id: uuid(),
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.email)}`,
      status: requiresApproval ? 'pending_approval' : 'approved',
      isSynced: false,
      points: 0,
      updatedAt: new Date().toISOString(),
      notificationSettings: { consent: false, channels: [] },
      passwordHash,
    };
    await dbInstance.transaction(
      'rw',
      dbInstance.users,
      dbInstance.learningPaths,
      dbInstance.userLearningPathProgress,
      async () => {
        const newId = await dbInstance.users.add(newUser);
        newUser.id = newId as string;

        if (newUser.status === 'approved') {
          const pathForRole = await dbInstance.learningPaths
            .where('targetRole')
            .equals(user.role)
            .first();
          if (pathForRole?.id) {
            await dbInstance.userLearningPathProgress.add({
              userId: newUser.id,
              learningPathId: pathForRole.id,
              completedCourseIds: [],
              isSynced: false,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    );
    return newUser;
  },

  async bulkAddUsers(
    users: (Omit<
      User,
      | 'id'
      | 'isSynced'
      | 'updatedAt'
      | 'notificationSettings'
      | 'points'
      | 'status'
      | 'fcmToken'
      | 'passwordHash'
    > & { password?: string })[]
  ): Promise<string[]> {
    const newUsers: User[] = [];
    for (const user of users) {
      const { password, ...userData } = user;
      const passwordHash = password ? await hashPassword(password) : undefined;
      const id = uuid();
      newUsers.push({
        ...userData,
        id,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(userData.email)}`,
        status: 'approved',
        isSynced: false,
        points: 0,
        updatedAt: new Date().toISOString(),
        notificationSettings: { consent: false, channels: [] },
        passwordHash,
      });
    }
    return dbInstance.transaction(
      'rw',
      dbInstance.users,
      dbInstance.learningPaths,
      dbInstance.userLearningPathProgress,
      async () => {
        const userIds = (await dbInstance.users.bulkAdd(newUsers, { allKeys: true })) as string[];
        const allPaths = await dbInstance.learningPaths.toArray();
        const pathsByRole = new Map<Role, LearningPath>();
        allPaths.forEach(p => pathsByRole.set(p.targetRole, p));
        const progressToAdd: Omit<UserLearningPathProgress, 'id'>[] = [];
        newUsers.forEach((user, index) => {
          const pathForRole = pathsByRole.get(user.role);
          if (pathForRole?.id) {
            progressToAdd.push({
              userId: userIds[index],
              learningPathId: pathForRole.id,
              completedCourseIds: [],
              isSynced: false,
              updatedAt: new Date().toISOString(),
            });
          }
        });
        if (progressToAdd.length > 0) {
          await dbInstance.userLearningPathProgress.bulkAdd(progressToAdd);
        }
        return userIds;
      }
    );
  },

  async getAllUsers(): Promise<User[]> {
    const all = await dbInstance.users.toArray();
    return all.filter(u => !u.deletedAt);
  },

  async getUserById(id: string): Promise<User | undefined> {
    const user = await dbInstance.users.get(id);
    return user?.deletedAt ? undefined : user;
  },

  async updateUser(
    id: string,
    data: Partial<Omit<User, 'id' | 'isSynced' | 'password'>>
  ): Promise<number> {
    const currentUser = await dbInstance.users.get(id);
    if (!currentUser) return 0;
    const roleIsChanging = data.role && currentUser.role !== data.role;
    return dbInstance.transaction(
      'rw',
      dbInstance.users,
      dbInstance.learningPaths,
      dbInstance.userLearningPathProgress,
      async () => {
        const result = await dbInstance.users.update(id, {
          ...data,
          updatedAt: new Date().toISOString(),
          isSynced: false,
        });
        if (roleIsChanging) {
          const pathForNewRole = await dbInstance.learningPaths
            .where('targetRole')
            .equals(data.role!)
            .first();
          if (pathForNewRole?.id) {
            const existingProgress = await dbInstance.userLearningPathProgress
              .where({ userId: id, learningPathId: pathForNewRole.id })
              .first();
            if (!existingProgress) {
              await dbInstance.userLearningPathProgress.add({
                userId: id,
                learningPathId: pathForNewRole.id,
                completedCourseIds: [],
                isSynced: false,
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }
        return result;
      }
    );
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<number> {
    const user = await dbInstance.users.get(userId);
    if (!user) return 0;
    return dbInstance.transaction(
      'rw',
      dbInstance.users,
      dbInstance.learningPaths,
      dbInstance.userLearningPathProgress,
      dbInstance.notifications,
      async () => {
        const result = await dbInstance.users.update(userId, {
          status,
          updatedAt: new Date().toISOString(),
          isSynced: false,
        });
        if (status === 'approved' && user.status === 'pending_approval') {
          const pathForRole = await dbInstance.learningPaths
            .where('targetRole')
            .equals(user.role)
            .first();
          if (pathForRole?.id) {
            const existingProgress = await dbInstance.userLearningPathProgress
              .where({ userId: user.id, learningPathId: pathForRole.id })
              .first();
            if (!existingProgress) {
              await dbInstance.userLearningPathProgress.add({
                userId: user.id,
                learningPathId: pathForRole.id,
                completedCourseIds: [],
                isSynced: false,
                updatedAt: new Date().toISOString(),
              });
            }
          }
          await this.addNotification({
            userId: user.id,
            message: `¡Tu cuenta ha sido aprobada! Ya puedes acceder a todas las funcionalidades de la plataforma.`,
            type: 'enrollment_approved',
            relatedUrl: `/dashboard`,
            isRead: false,
            timestamp: new Date().toISOString(),
          });
        }
        return result;
      }
    );
  },

  async saveFcmToken(userId: string, fcmToken: string): Promise<number> {
    return await dbInstance.users.update(userId, {
      fcmToken,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await dbInstance.users.delete(id);
  },

  async softDeleteUser(id: string): Promise<number> {
    const user = await dbInstance.users.get(id);
    if (!user) return 0;
    return dbInstance.users.update(id, {
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async addCertificate(
    certificate: Omit<Certificate, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<string> {
    const newCertificate: Certificate = {
      ...certificate,
      id: uuid(),
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    return (await dbInstance.certificates.add(newCertificate)) as string;
  },

  async getCertificateById(id: string): Promise<Certificate | undefined> {
    return await dbInstance.certificates.get(id);
  },

  async getCertificatesForUser(userId: string): Promise<Certificate[]> {
    return await dbInstance.certificates
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('issuedAt');
  },

  async getCertificatesForCourse(courseId: string): Promise<Certificate[]> {
    return await dbInstance.certificates
      .where('courseId')
      .equals(courseId)
      .reverse()
      .sortBy('issuedAt');
  },

  async getAllCertificates(): Promise<Certificate[]> {
    return await dbInstance.certificates.reverse().sortBy('issuedAt');
  },

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    return await dbInstance.certificates.where('verificationCode').equals(code).first();
  },

  async updateCertificateStatus(id: string, status: CertificateStatus): Promise<number> {
    return await dbInstance.certificates.update(id, {
      status,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async getCertificateForUserCourse(
    userId: string,
    courseId: string
  ): Promise<Certificate | undefined> {
    return await dbInstance.certificates.where({ userId, courseId }).first();
  },

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    return await dbInstance.certificateTemplates.toArray();
  },

  async getCertificateTemplateById(id: string): Promise<CertificateTemplate | undefined> {
    return await dbInstance.certificateTemplates.get(id);
  },

  async updateCertificateTemplate(
    id: string,
    data: Partial<Omit<CertificateTemplate, 'id' | 'createdAt'>>
  ): Promise<number> {
    return await dbInstance.certificateTemplates.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  },

  async addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string> {
    const newCourse: Course = {
      id: uuid(),
      title: course.title || 'Sin Título',
      description: course.description || '',
      longDescription: course.longDescription || '',
      instructor: course.instructor || 'Por definir',
      duration: course.duration || 'Por definir',
      modality: course.modality || 'Online',
      image: course.image || '/images/courses/default.png',
      aiHint: course.aiHint || '',
      modules: course.modules || [],
      status: course.status || 'draft',
      mandatoryForRoles: course.mandatoryForRoles || [],
      isScorm: course.isScorm || false,
      scormPackage: course.scormPackage,
      isSynced: false,
      updatedAt: new Date().toISOString(),
      ...(course.startDate && { startDate: course.startDate }),
      ...(course.endDate && { endDate: course.endDate }),
      ...(course.category && { category: course.category }),
      ...(course.capacity && { capacity: course.capacity }),
    };
    return (await dbInstance.courses.add(newCourse)) as string;
  },

  async getAllCourses(): Promise<Course[]> {
    return await dbInstance.courses.toArray();
  },

  async getCourseById(id: string): Promise<Course | undefined> {
    return await dbInstance.courses.get(id);
  },

  async updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number> {
    return await dbInstance.courses.update(id, {
      ...data,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number> {
    return await dbInstance.courses.update(id, {
      status,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteCourse(id: string): Promise<void> {
    return dbInstance.transaction(
      'rw',
      dbInstance.courses,
      dbInstance.enrollments,
      dbInstance.userProgress,
      async () => {
        await dbInstance.enrollments.where('courseId').equals(id).delete();
        await dbInstance.userProgress.where('courseId').equals(id).delete();
        await dbInstance.courses.delete(id);
      }
    );
  },

  async requestEnrollment(courseId: string, studentId: string): Promise<number> {
    const course = await dbInstance.courses.get(courseId);
    if (!course) throw new Error('El curso no existe.');
    const activeEnrollmentStatuses: EnrollmentStatus[] = [
      'pending',
      'approved',
      'active',
      'waitlisted',
      'needs_review',
      'completed',
    ];
    const existingEnrollment = await dbInstance.enrollments
      .where({ studentId, courseId })
      .filter(e => activeEnrollmentStatuses.includes(e.status))
      .first();
    if (existingEnrollment) throw new Error('Ya tienes una solicitud para este curso.');
    if (course.capacity !== undefined && course.capacity > 0) {
      const approvedCount = await this.getApprovedEnrollmentCount(courseId);
      if (approvedCount >= course.capacity)
        throw new Error('El curso está completo. No quedan plazas disponibles.');
    }
    const newEnrollment: Enrollment = {
      studentId,
      courseId,
      requestDate: new Date().toISOString(),
      status: 'pending',
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    return (await dbInstance.enrollments.add(newEnrollment)) as number;
  },

  async getApprovedEnrollmentCount(courseId: string): Promise<number> {
    return await dbInstance.enrollments
      .where({ courseId })
      .and(e => e.status === 'approved' || e.status === 'active' || e.status === 'completed')
      .count();
  },

  async getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]> {
    const pendingEnrollments = await dbInstance.enrollments
      .where('status')
      .equals('pending')
      .toArray();
    if (pendingEnrollments.length === 0) return [];
    const userIds = [...new Set(pendingEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(pendingEnrollments.map(e => e.courseId))];
    const users = await dbInstance.users.where('id').anyOf(userIds).toArray();
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return pendingEnrollments.map(e => ({
      ...e,
      userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
      courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
    }));
  },

  async getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]> {
    const allEnrollments = await dbInstance.enrollments.toArray();
    if (allEnrollments.length === 0) return [];
    const userIds = [...new Set(allEnrollments.map(e => e.studentId))];
    const courseIds = [...new Set(allEnrollments.map(e => e.courseId))];
    const users = await dbInstance.users.where('id').anyOf(userIds).toArray();
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const userMap = new Map(users.map(u => [u.id, u]));
    const courseMap = new Map(courses.map(c => [c.id, c]));
    return allEnrollments.map(e => ({
      ...e,
      userName: userMap.get(e.studentId)?.name || 'Usuario desconocido',
      userEmail: userMap.get(e.studentId)?.email || 'Email desconocido',
      courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
      courseImage: courseMap.get(e.courseId)?.image || '/images/courses/default.png',
    }));
  },

  async getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]> {
    const studentEnrollments = await dbInstance.enrollments
      .where('studentId')
      .equals(userId)
      .toArray();
    if (studentEnrollments.length === 0) return [];
    const courseIds = [...new Set(studentEnrollments.map(e => e.courseId))];
    const courses = await dbInstance.courses.where('id').anyOf(courseIds).toArray();
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const user = await dbInstance.users.get(userId);
    return studentEnrollments
      .map(e => ({
        ...e,
        userName: user?.name || 'Usuario desconocido',
        userEmail: user?.email || 'Email desconocido',
        courseTitle: courseMap.get(e.courseId)?.title || 'Curso desconocido',
        courseImage: courseMap.get(e.courseId)?.image || '/images/courses/default.png',
      }))
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },

  async updateEnrollmentStatus(
    enrollmentId: number,
    status: EnrollmentStatus,
    justification?: string
  ): Promise<number> {
    const enrollment = await dbInstance.enrollments.get(enrollmentId);
    if (!enrollment) return 0;
    const result = await dbInstance.enrollments.update(enrollmentId, {
      status,
      justification,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
    if (status === 'approved') {
      const course = await dbInstance.courses.get(enrollment.courseId);
      if (course) {
        await this.addNotification({
          userId: enrollment.studentId,
          message: `Tu inscripción a "${course.title}" ha sido aprobada.`,
          type: 'enrollment_approved',
          relatedUrl: `/dashboard/courses/${enrollment.courseId}`,
          isRead: false,
          timestamp: new Date().toISOString(),
        });
        if (course.startDate && new Date(course.startDate) <= new Date()) {
          await dbInstance.enrollments.update(enrollmentId, { status: 'active' });
        }
      }
    }
    return result;
  },

  async getEnrolledCoursesForUser(userId: string): Promise<Course[]> {
    const approvedEnrollments = await dbInstance.enrollments
      .where('studentId')
      .equals(userId)
      .filter(e => e.status === 'approved' || e.status === 'active')
      .toArray();
    if (approvedEnrollments.length === 0) return [];
    const courseIds = approvedEnrollments.map(e => e.courseId);
    return await dbInstance.courses
      .where('id')
      .anyOf(courseIds)
      .and(course => course.status !== 'draft')
      .toArray();
  },

  async getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]> {
    const allCourses = await dbInstance.courses.toArray();
    const mandatoryCourses = allCourses.filter(
      c => c.status === 'published' && c.mandatoryForRoles?.includes(user.role)
    );
    if (mandatoryCourses.length === 0) return [];
    const userProgressRecords = await dbInstance.userProgress
      .where('userId')
      .equals(user.id!)
      .toArray();
    const progressMap = new Map(userProgressRecords.map(p => [p.courseId, p]));
    return mandatoryCourses.filter(course => {
      const progress = progressMap.get(course.id!);
      const isCompleted =
        progress &&
        course.modules &&
        course.modules.length > 0 &&
        progress.completedModules.length === course.modules.length;
      return !isCompleted;
    });
  },

  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined> {
    return await dbInstance.userProgress.where({ userId, courseId }).first();
  },

  async getUserProgressForUser(userId: string): Promise<UserProgress[]> {
    return await dbInstance.userProgress.where({ userId }).toArray();
  },

  async markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void> {
    return dbInstance.transaction(
      'rw',
      [
        dbInstance.users,
        dbInstance.userProgress,
        dbInstance.badges,
        dbInstance.userBadges,
        dbInstance.notifications,
        dbInstance.courses,
        dbInstance.enrollments,
        dbInstance.learningPaths,
        dbInstance.userLearningPathProgress,
      ],
      async () => {
        const existingProgress = await this.getUserProgress(userId, courseId);
        const user = await this.getUserById(userId);
        if (!user) return;
        if (existingProgress) {
          const completed = new Set(existingProgress.completedModules);
          if (completed.has(moduleId)) return;
          completed.add(moduleId);
          await dbInstance.userProgress.update(existingProgress.id!, {
            completedModules: Array.from(completed),
            updatedAt: new Date().toISOString(),
            isSynced: false,
          });
        } else {
          await dbInstance.userProgress.add({
            userId,
            courseId,
            completedModules: [moduleId],
            updatedAt: new Date().toISOString(),
            isSynced: false,
          });
        }
        await dbInstance.users.update(userId, { points: (user.points || 0) + 10 });
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) await this.awardBadge(userId, 'weekend_warrior');
        await (this as any)._checkAndAwardModuleBadges(userId);
        const course = await this.getCourseById(courseId);
        const updatedProgress = await this.getUserProgress(userId, courseId);
        if (
          course &&
          updatedProgress &&
          course.modules &&
          updatedProgress.completedModules.length === course.modules.length
        ) {
          await (this as any)._handleCourseCompletion(userId, courseId);
        }
      }
    );
  },

  async getScormCmiState(userId: string, courseId: string): Promise<ScormCmiState | undefined> {
    return dbInstance.scormCmiState.where('[userId+courseId]').equals([userId, courseId]).first();
  },

  async saveScormCmiState(
    userId: string,
    courseId: string,
    data: Omit<ScormCmiState, 'id' | 'userId' | 'courseId' | 'updatedAt'>
  ): Promise<void> {
    const updatedAt = new Date().toISOString();
    const existing = await dbInstance.scormCmiState
      .where('[userId+courseId]')
      .equals([userId, courseId])
      .first();
    const record: ScormCmiState = { ...data, userId, courseId, updatedAt };
    if (existing?.id !== undefined) {
      await dbInstance.scormCmiState.update(existing.id, record);
    } else {
      await dbInstance.scormCmiState.add(record);
    }
  },

  async addForumMessage(
    message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newMessage: ForumMessage = {
      ...message,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.forumMessages.add(newMessage);
    await dbInstance.transaction(
      'rw',
      dbInstance.users,
      dbInstance.forumMessages,
      dbInstance.userBadges,
      dbInstance.notifications,
      async () => {
        const user = await dbInstance.users.get(message.userId);
        if (!user) return;
        const pointsToAdd = message.parentId ? 2 : 5;
        await dbInstance.users.update(user.id!, { points: (user.points || 0) + pointsToAdd });
        const userMessageCount = await dbInstance.forumMessages
          .where('userId')
          .equals(user.id!)
          .count();
        if (userMessageCount === 1) await this.awardBadge(user.id!, 'forum_first_post');
        if (userMessageCount === 5) await this.awardBadge(user.id!, 'forum_collaborator');
      }
    );
    return newId as number;
  },

  async getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]> {
    const messages = await dbInstance.forumMessages
      .where('courseId')
      .equals(courseId)
      .sortBy('timestamp');
    const messageMap = new Map<number, ForumMessageWithReplies>();
    const rootMessages: ForumMessageWithReplies[] = [];
    messages.forEach(msg => {
      if (msg.id) messageMap.set(msg.id, { ...msg, replies: [] });
    });
    messages.forEach(msg => {
      if (msg.id) {
        if (msg.parentId && messageMap.has(msg.parentId)) {
          messageMap.get(msg.parentId)!.replies.push(messageMap.get(msg.id)!);
        } else {
          rootMessages.push(messageMap.get(msg.id)!);
        }
      }
    });
    return rootMessages.reverse();
  },

  async deleteForumMessage(messageId: number): Promise<void> {
    return dbInstance.transaction('rw', dbInstance.forumMessages, async () => {
      const messagesToDelete: number[] = [messageId];
      const queue: number[] = [messageId];
      while (queue.length > 0) {
        const parentId = queue.shift()!;
        const children = await dbInstance.forumMessages
          .where('parentId')
          .equals(parentId)
          .toArray();
        for (const child of children) {
          if (child.id) {
            messagesToDelete.push(child.id);
            queue.push(child.id);
          }
        }
      }
      await dbInstance.forumMessages.bulkDelete(messagesToDelete);
    });
  },

  async addNotification(
    notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newNotification: Notification = {
      ...notification,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = (await dbInstance.notifications.add(newNotification)) as number;
    const user = await dbInstance.users.get(notification.userId);
    if (user && user.notificationSettings?.consent) {
      // Nota: El envío automático de notificaciones está deshabilitado aquí
      // Las notificaciones se envían a través de server actions cuando sea necesario
      // para evitar importar paquetes de servidor (twilio, resend, etc.) en el cliente
      // TODO: Implementar un sistema de cola de notificaciones que se procese en el servidor (ver TECH_DEBT.md)
    }
    return newId;
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await dbInstance.notifications.where({ userId }).reverse().sortBy('timestamp');
  },

  async markNotificationAsRead(notificationId: number): Promise<number> {
    return await dbInstance.notifications.update(notificationId, {
      isRead: true,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const unreadNotifications = await dbInstance.notifications
      .where({ userId, isRead: false })
      .toArray();
    if (unreadNotifications.length > 0) {
      const idsToUpdate = unreadNotifications.map(n => n.id!);
      await dbInstance.transaction('rw', dbInstance.notifications, async () => {
        for (const id of idsToUpdate) {
          await dbInstance.notifications.update(id, {
            isRead: true,
            updatedAt: new Date().toISOString(),
            isSynced: false,
          });
        }
      });
    }
  },

  async checkAndSendDeadlineReminders(user: User): Promise<void> {
    const enrolledCourses = await this.getEnrolledCoursesForUser(user.id!);
    if (enrolledCourses.length === 0) return;
    const now = new Date();
    for (const course of enrolledCourses) {
      if (course.endDate) {
        const endDate = new Date(course.endDate);
        const daysUntilDeadline = differenceInDays(endDate, now);
        if (isAfter(endDate, now) && daysUntilDeadline <= 7) {
          const existingReminder = await dbInstance.notifications
            .where({ userId: user.id })
            .filter(
              notif =>
                notif.type === 'course_deadline_reminder' &&
                notif.relatedUrl === `/dashboard/courses/${course.id}`
            )
            .first();
          if (!existingReminder) {
            await this.addNotification({
              userId: user.id!,
              message: `¡Fecha límite próxima! El curso "${course.title}" finaliza en ${daysUntilDeadline + 1} día(s).`,
              type: 'course_deadline_reminder',
              relatedUrl: `/dashboard/courses/${course.id}`,
              isRead: false,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    }
  },

  async addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newResource: Resource = {
      ...resource,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.resources.add(newResource);
    return newId as number;
  },

  async getAllResources(): Promise<Resource[]> {
    return await dbInstance.resources.orderBy('name').toArray();
  },

  async deleteResource(resourceId: number): Promise<void> {
    return dbInstance.transaction(
      'rw',
      dbInstance.resources,
      dbInstance.courseResources,
      async () => {
        await dbInstance.courseResources.where('resourceId').equals(resourceId).delete();
        await dbInstance.resources.delete(resourceId);
      }
    );
  },

  async associateResourceWithCourse(courseId: string, resourceId: number): Promise<void> {
    const existing = await dbInstance.courseResources.where({ courseId, resourceId }).first();
    if (!existing) await dbInstance.courseResources.add({ courseId, resourceId });
  },

  async dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void> {
    await dbInstance.courseResources.where({ courseId, resourceId }).delete();
  },

  async getResourcesForCourse(courseId: string): Promise<Resource[]> {
    const associations = await dbInstance.courseResources
      .where('courseId')
      .equals(courseId)
      .toArray();
    if (associations.length === 0) return [];
    const resourceIds = associations.map(a => a.resourceId);
    return await dbInstance.resources.where('id').anyOf(resourceIds).toArray();
  },

  async getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]> {
    const associations = await dbInstance.courseResources
      .where('courseId')
      .equals(courseId)
      .toArray();
    return associations.map(a => a.resourceId);
  },

  async addAnnouncement(
    announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newAnnouncement: Announcement = {
      ...announcement,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.announcements.add(newAnnouncement);
    return newId as number;
  },

  async deleteAnnouncement(id: number): Promise<void> {
    await dbInstance.announcements.delete(id);
  },

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await dbInstance.announcements.reverse().sortBy('timestamp');
  },

  async getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]> {
    const all = await dbInstance.announcements.reverse().sortBy('timestamp');
    return all.filter(
      a =>
        a.channels.includes('Todos') ||
        a.channels.includes(user.role) ||
        a.channels.includes(user.department)
    );
  },

  async addChatMessage(
    message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newChatMessage: ChatMessage = {
      ...message,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    await dbInstance.chatChannels.update(String(message.channelId), {
      updatedAt: new Date().toISOString(),
    });
    const newId = await dbInstance.chatMessages.add(newChatMessage);
    return newId as number;
  },

  async getChatMessages(channelId: number | string): Promise<ChatMessage[]> {
    return await dbInstance.chatMessages.where('channelId').equals(channelId).sortBy('timestamp');
  },

  async getPublicChatChannels(): Promise<ChatChannel[]> {
    return await dbInstance.chatChannels.where('type').equals('public').sortBy('name');
  },

  async addPublicChatChannel(name: string, description: string): Promise<string> {
    const newChannel: ChatChannel = {
      id: `channel_${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      description,
      type: 'public',
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    return (await dbInstance.chatChannels.add(newChannel)) as string;
  },

  async getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]> {
    const threads = await dbInstance.chatChannels.where('participantIds').equals(userId).toArray();
    const otherParticipantIds = threads.flatMap(t =>
      t.participantIds!.filter(pid => pid !== userId)
    );
    if (otherParticipantIds.length === 0) return [];
    const otherParticipants = await dbInstance.users
      .where('id')
      .anyOf(otherParticipantIds)
      .toArray();
    const participantsMap = new Map(otherParticipants.map(u => [u.id, u]));
    return threads
      .map(thread => {
        const otherId = thread.participantIds!.find(pid => pid !== userId)!;
        const otherUser = participantsMap.get(otherId);
        return {
          ...thread,
          otherParticipant: otherUser
            ? { id: otherUser.id!, name: otherUser.name, avatar: otherUser.avatar }
            : { id: '-1', name: 'Usuario Desconocido', avatar: '' },
        };
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  },

  async getOrCreateDirectMessageThread(
    currentUserId: string,
    otherUserId: string
  ): Promise<ChatChannel> {
    const dexieId = `dm_${[currentUserId, otherUserId].sort().join('_')}`;
    const existingThread = await dbInstance.chatChannels.get({ id: dexieId });
    if (existingThread) return existingThread;
    const currentUser = await dbInstance.users.get(currentUserId);
    const otherUser = await dbInstance.users.get(otherUserId);
    if (!currentUser || !otherUser) throw new Error('Uno o ambos usuarios no existen.');
    const newChannel: ChatChannel = {
      id: dexieId,
      name: `${currentUser.name} & ${otherUser.name}`,
      type: 'private',
      participantIds: [currentUserId, otherUserId],
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = (await dbInstance.chatChannels.add(newChannel)) as string;
    newChannel.id = newId as any;
    return newChannel;
  },

  async getComplianceReportData(
    departmentFilter: string = 'all',
    roleFilter: string = 'all'
  ): Promise<ComplianceReportData[]> {
    let query = dbInstance.users.toCollection();
    if (departmentFilter !== 'all') query = query.filter(u => u.department === departmentFilter);
    if (roleFilter !== 'all') query = query.filter(u => u.role === roleFilter);
    const usersToReport = await query.toArray();
    const userIds = usersToReport.map(u => u.id!);
    const allCourses = await dbInstance.courses.toArray();
    const allProgress = await dbInstance.userProgress.where('userId').anyOf(userIds).toArray();
    const progressMap = new Map<string, UserProgress>();
    allProgress.forEach(p => progressMap.set(`${p.userId}-${p.courseId}`, p));
    const report: ComplianceReportData[] = [];
    for (const user of usersToReport) {
      const mandatoryCourses = allCourses.filter(
        c => c.status === 'published' && c.mandatoryForRoles?.includes(user.role)
      );
      if (mandatoryCourses.length === 0) {
        report.push({
          userId: user.id!,
          userName: user.name,
          userRole: user.role,
          mandatoryCoursesCount: 0,
          completedCoursesCount: 0,
          complianceRate: 100,
        });
        continue;
      }
      let completedCount = 0;
      for (const course of mandatoryCourses) {
        const progress = progressMap.get(`${user.id}-${course.id}`);
        if (
          progress &&
          course.modules &&
          course.modules.length > 0 &&
          progress.completedModules.length === course.modules.length
        )
          completedCount++;
      }
      report.push({
        userId: user.id!,
        userName: user.name,
        userRole: user.role,
        mandatoryCoursesCount: mandatoryCourses.length,
        completedCoursesCount: completedCount,
        complianceRate: (completedCount / mandatoryCourses.length) * 100,
      });
    }
    return report.sort((a, b) => a.complianceRate - b.complianceRate);
  },

  async getAllCalendarEvents(): Promise<CalendarEvent[]> {
    return await dbInstance.calendarEvents.toArray();
  },

  async getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]> {
    if (courseIds.length === 0) return [];
    return await dbInstance.calendarEvents.where('courseId').anyOf(courseIds).toArray();
  },

  async addCalendarEvent(
    event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newEvent: CalendarEvent = {
      ...event,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.calendarEvents.add(newEvent);
    return newId as number;
  },

  async updateCalendarEvent(
    id: number,
    data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>
  ): Promise<number> {
    return await dbInstance.calendarEvents.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    await dbInstance.calendarEvents.delete(id);
  },

  async getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]> {
    return await dbInstance.externalTrainings
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('endDate');
  },

  async addExternalTraining(
    training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newTraining: ExternalTraining = {
      ...training,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.externalTrainings.add(newTraining);
    return newId as number;
  },

  async updateExternalTraining(
    id: number,
    data: Partial<Omit<ExternalTraining, 'id'>>
  ): Promise<number> {
    return await dbInstance.externalTrainings.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteExternalTraining(id: number): Promise<void> {
    await dbInstance.externalTrainings.delete(id);
  },

  async getAllCosts(): Promise<Cost[]> {
    return await dbInstance.costs.reverse().sortBy('date');
  },

  async addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number> {
    const newCost: Cost = { ...cost, isSynced: false, updatedAt: new Date().toISOString() };
    const newId = await dbInstance.costs.add(newCost);
    return newId as number;
  },

  async updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number> {
    return await dbInstance.costs.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteCost(id: number): Promise<void> {
    await dbInstance.costs.delete(id);
  },

  async getAllCostCategories(): Promise<CustomCostCategory[]> {
    return await dbInstance.costCategories.toArray();
  },

  async addCostCategory(category: { name: string }): Promise<number> {
    const newId = await dbInstance.costCategories.add(category);
    return newId as number;
  },

  async deleteCostCategory(id: number): Promise<void> {
    await dbInstance.costCategories.delete(id);
  },

  async getCoursesByInstructorName(instructorName: string): Promise<Course[]> {
    return await dbInstance.courses.where('instructor').equals(instructorName).toArray();
  },

  async getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]> {
    const enrollments = await dbInstance.enrollments
      .where({ courseId })
      .filter(e => e.status === 'approved' || e.status === 'active')
      .toArray();
    const studentIds = enrollments.map(e => e.studentId);
    if (studentIds.length === 0) return [];
    const students = await dbInstance.users.where('id').anyOf(studentIds).toArray();
    const progresses = await dbInstance.userProgress
      .where('courseId')
      .equals(courseId)
      .and(p => studentIds.includes(p.userId))
      .toArray();
    const course = await dbInstance.courses.get(courseId);
    const moduleCount = course?.modules?.length || 0;
    const progressMap = new Map(progresses.map(p => [p.userId, p]));
    const enrollmentMap = new Map(enrollments.map(e => [e.studentId, e]));
    return students
      .map(student => {
        const progress = progressMap.get(student.id!);
        const completedModules = progress?.completedModules?.length || 0;
        const progressPercentage =
          moduleCount > 0 ? Math.round((completedModules / moduleCount) * 100) : 0;
        const enrollmentStatus = enrollmentMap.get(student.id!)?.status || 'active';
        return {
          id: student.id!,
          name: student.name,
          avatar: student.avatar,
          email: student.email,
          progress: progressPercentage,
          status: enrollmentStatus,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getAllBadges(): Promise<Badge[]> {
    return await dbInstance.badges.toArray();
  },

  async getBadgesForUser(userId: string): Promise<UserBadge[]> {
    return await dbInstance.userBadges.where('userId').equals(userId).toArray();
  },

  async awardBadge(userId: string, badgeId: string): Promise<void> {
    return dbInstance.transaction(
      'rw',
      dbInstance.userBadges,
      dbInstance.notifications,
      async () => {
        const existing = await dbInstance.userBadges.where({ userId, badgeId }).first();
        if (existing) return;
        await dbInstance.userBadges.add({
          userId,
          badgeId,
          earnedAt: new Date().toISOString(),
          isSynced: false,
          updatedAt: new Date().toISOString(),
        });
        const badge = await dbInstance.badges.get(badgeId);
        if (badge) {
          await this.addNotification({
            userId: userId,
            message: `¡Insignia desbloqueada: ${badge.name}!`,
            type: 'badge_unlocked',
            relatedUrl: '/dashboard/profile',
            isRead: false,
            timestamp: new Date().toISOString(),
          });
        }
      }
    );
  },

  async getAIConfig(): Promise<AIConfig> {
    const config = await dbInstance.aiConfig.get('singleton');
    return config || defaultAIConfig;
  },

  async saveAIConfig(config: AIConfig): Promise<string> {
    return await dbInstance.aiConfig.put(config, 'singleton');
  },

  async logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number> {
    const newLog: AIUsageLog = { ...log, timestamp: new Date().toISOString() };
    const newId = await dbInstance.aiUsageLog.add(newLog);
    return newId as number;
  },

  async getAllLearningPaths(): Promise<LearningPath[]> {
    return await dbInstance.learningPaths.reverse().sortBy('title');
  },

  async getLearningPathById(id: number): Promise<LearningPath | undefined> {
    return await dbInstance.learningPaths.get(id);
  },

  async addLearningPath(
    path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newId = await dbInstance.learningPaths.add({
      ...path,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
    return newId as number;
  },

  async updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number> {
    return await dbInstance.learningPaths.update(id, {
      ...data,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteLearningPath(id: number): Promise<void> {
    await dbInstance.transaction(
      'rw',
      dbInstance.learningPaths,
      dbInstance.userLearningPathProgress,
      async () => {
        await dbInstance.userLearningPathProgress.where('learningPathId').equals(id).delete();
        await dbInstance.learningPaths.delete(id);
      }
    );
  },

  async getLearningPathsForUser(
    user: User
  ): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]> {
    const paths = await dbInstance.learningPaths.where('targetRole').equals(user.role).toArray();
    const pathIds = paths.map(p => p.id!);
    if (pathIds.length === 0) return [];
    const progresses = await dbInstance.userLearningPathProgress
      .where('userId')
      .equals(user.id!)
      .and(p => pathIds.includes(p.learningPathId))
      .toArray();
    const progressMap = new Map(progresses.map(p => [p.learningPathId, p]));
    return paths.map(path => ({ ...path, progress: progressMap.get(path.id!) }));
  },

  async addPDI(
    pdi: Omit<IndividualDevelopmentPlan, 'id' | 'isSynced' | 'updatedAt' | 'createdAt'>
  ): Promise<string> {
    const id = uuid();
    const newPDI: IndividualDevelopmentPlan = {
      ...pdi,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    await dbInstance.individualDevelopmentPlans.add(newPDI);
    return id;
  },

  async getPDIById(id: string): Promise<IndividualDevelopmentPlan | undefined> {
    return await dbInstance.individualDevelopmentPlans.get(id);
  },

  async getPDIsForUser(userId: string): Promise<IndividualDevelopmentPlan[]> {
    return await dbInstance.individualDevelopmentPlans
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt');
  },

  async getPDIsForManager(managerId: string): Promise<IndividualDevelopmentPlan[]> {
    return await dbInstance.individualDevelopmentPlans
      .where('managerId')
      .equals(managerId)
      .reverse()
      .sortBy('createdAt');
  },

  async getAllPDIs(): Promise<IndividualDevelopmentPlan[]> {
    return await dbInstance.individualDevelopmentPlans.reverse().sortBy('createdAt');
  },

  async updatePDI(
    id: string,
    data: Partial<Omit<IndividualDevelopmentPlan, 'id' | 'createdAt'>>
  ): Promise<number> {
    return await dbInstance.individualDevelopmentPlans.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deletePDI(id: string): Promise<void> {
    await dbInstance.individualDevelopmentPlans.delete(id);
  },

  async addPDIReview(
    pdiId: string,
    review: Omit<IndividualDevelopmentPlan['reviews'][0], 'id' | 'createdAt'>
  ): Promise<number> {
    const pdi = await dbInstance.individualDevelopmentPlans.get(pdiId);
    if (!pdi) throw new Error('PDI not found');
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newReview: IndividualDevelopmentPlan['reviews'][0] = {
      ...review,
      id: reviewId,
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [...pdi.reviews, newReview];
    await dbInstance.individualDevelopmentPlans.update(pdiId, {
      reviews: updatedReviews,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
    return updatedReviews.length;
  },

  async updatePDIMilestone(
    pdiId: string,
    milestoneId: string,
    updates: Partial<IndividualDevelopmentPlan['milestones'][0]>
  ): Promise<number> {
    const pdi = await dbInstance.individualDevelopmentPlans.get(pdiId);
    if (!pdi) throw new Error('PDI not found');
    const updatedMilestones = pdi.milestones.map(m =>
      m.id === milestoneId ? { ...m, ...updates } : m
    );
    await dbInstance.individualDevelopmentPlans.update(pdiId, {
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
    return updatedMilestones.length;
  },

  async addCourseRating(
    rating: Omit<CourseRating, 'id' | 'isPublic' | 'isSynced' | 'updatedAt'>
  ): Promise<number> {
    const newRating: CourseRating = {
      ...rating,
      isPublic: false,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    };
    const newId = await dbInstance.courseRatings.add(newRating);
    return newId as number;
  },

  async getRatingByUserAndCourse(
    userId: string,
    courseId: string
  ): Promise<CourseRating | undefined> {
    return await dbInstance.courseRatings.where({ userId, courseId }).first();
  },

  async getRatingsForCourse(courseId: string): Promise<CourseRating[]> {
    return await dbInstance.courseRatings
      .where('courseId')
      .equals(courseId)
      .reverse()
      .sortBy('timestamp');
  },

  async getRatingsForInstructor(instructorName: string): Promise<CourseRating[]> {
    return await dbInstance.courseRatings.where('instructorName').equals(instructorName).toArray();
  },

  async toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number> {
    return await dbInstance.courseRatings.update(ratingId, {
      isPublic,
      isSynced: false,
      updatedAt: new Date().toISOString(),
    });
  },

  async getPermissionsForRole(role: Role): Promise<string[]> {
    const perm = await dbInstance.rolePermissions.get(role);
    if (perm) return perm.visibleNavs;
    return getNavItems()
      .filter(item => item.roles.includes(role))
      .map(item => item.href);
  },

  async updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number> {
    await dbInstance.rolePermissions.put({ role, visibleNavs });
    return 1;
  },

  async logSystemEvent(
    level: LogLevel,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    return await dbInstance.logSystemEvent(level, message, details);
  },

  async getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]> {
    if (filterLevel)
      return await dbInstance.systemLogs
        .where('level')
        .equals(filterLevel)
        .reverse()
        .sortBy('timestamp');
    return await dbInstance.systemLogs.reverse().sortBy('timestamp');
  },

  async clearAllSystemLogs(): Promise<void> {
    await dbInstance.systemLogs.clear();
  },

  async getUnsyncedItemsCount(): Promise<number> {
    const tables = [
      dbInstance.users,
      dbInstance.courses,
      dbInstance.enrollments,
      dbInstance.userProgress,
      dbInstance.costs,
      dbInstance.certificateTemplates,
      dbInstance.certificates,
    ];
    const unsyncedCounts = await Promise.all(
      tables.map(table => table.filter(record => record.isSynced === false).count())
    );
    return unsyncedCounts.reduce((acc: number, count: number) => acc + count, 0);
  },

  async syncWithSupabase(): Promise<{ success: boolean; message: string }> {
    return await syncToSupabase(dbInstance as any);
  },

  // Internal helper methods, prefixed with _ to avoid exposing them on the provider interface.
  async _checkAndAwardModuleBadges(userId: string) {
    const allProgress = await dbInstance.userProgress.where('userId').equals(userId).toArray();
    const totalModulesCompleted = allProgress.reduce(
      (sum, p) => sum + p.completedModules.length,
      0
    );
    if (totalModulesCompleted >= 1) await this.awardBadge(userId, 'first_module');
    if (totalModulesCompleted >= 5) await this.awardBadge(userId, '5_modules');
    if (totalModulesCompleted >= 15) await this.awardBadge(userId, 'maestro_del_saber');
  },

  async _handleCourseCompletion(userId: string, courseId: string) {
    return dbInstance.transaction(
      'rw',
      [
        dbInstance.users,
        dbInstance.enrollments,
        dbInstance.userLearningPathProgress,
        dbInstance.courses,
        dbInstance.badges,
        dbInstance.userBadges,
        dbInstance.notifications,
        dbInstance.certificates,
        dbInstance.certificateTemplates,
        dbInstance.aiConfig,
      ],
      async () => {
        const course = await dbInstance.courses.get(courseId);
        if (!course) return;
        const enrollment = await dbInstance.enrollments
          .where({ studentId: userId, courseId })
          .first();
        if (enrollment && enrollment.status !== 'completed')
          await dbInstance.enrollments.update(enrollment.id!, {
            status: 'completed',
            updatedAt: new Date().toISOString(),
          });
        const user = await dbInstance.users.get(userId);
        if (user) {
          let pointsToAdd = 50;
          if (course.endDate && new Date() < new Date(course.endDate)) {
            pointsToAdd += 25;
            await this.awardBadge(userId, 'on_time_completion');
          }
          await dbInstance.users.update(userId, { points: (user.points || 0) + pointsToAdd });
        }
        const allCompletedEnrollments = await dbInstance.enrollments
          .where({ studentId: userId, status: 'completed' })
          .toArray();
        if (allCompletedEnrollments.length >= 1) await this.awardBadge(userId, 'first_course');
        if (allCompletedEnrollments.length >= 3) await this.awardBadge(userId, '3_courses');
        const allLearningPaths = await dbInstance.learningPaths.toArray();
        const relevantPaths = allLearningPaths.filter(p => p.courseIds.includes(courseId));
        for (const path of relevantPaths) {
          let progress = await dbInstance.userLearningPathProgress
            .where({ userId, learningPathId: path.id! })
            .first();
          if (progress) {
            const completed = new Set(progress.completedCourseIds);
            completed.add(courseId);
            await dbInstance.userLearningPathProgress.update(progress.id!, {
              completedCourseIds: Array.from(completed),
            });
          } else {
            await dbInstance.userLearningPathProgress.add({
              userId,
              learningPathId: path.id!,
              completedCourseIds: [courseId],
              isSynced: false,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        const existingCertificate = await dbInstance.certificates
          .where({ userId, courseId })
          .first();
        if (!existingCertificate) {
          const config = await dbInstance.aiConfig.get('singleton');
          const templateType = config?.defaultCertificateTemplate || 'Clásico';
          const template = await dbInstance.certificateTemplates
            .where('type')
            .equals(templateType)
            .first();
          const templateId = template?.id || 'tpl_clasico';
          const verificationCode = `CERT-${crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 10)}`;

          await dbInstance.certificates.add({
            id: uuid(),
            userId,
            courseId,
            templateId,
            verificationCode,
            issuedAt: new Date().toISOString(),
            status: 'active',
            isSynced: false,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    );
  },

  // Regulations and Compliance
  async addRegulation(
    regulation: Omit<Regulation, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const id = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newRegulation: Regulation = {
      ...regulation,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    await dbInstance.regulations.add(newRegulation);
    return id;
  },

  async getRegulationById(id: string): Promise<Regulation | undefined> {
    return await dbInstance.regulations.get(id);
  },

  async getAllRegulations(): Promise<Regulation[]> {
    return await dbInstance.regulations.reverse().sortBy('createdAt');
  },

  async getActiveRegulations(): Promise<Regulation[]> {
    return await dbInstance.regulations
      .where('isActive')
      .equals(true as any)
      .reverse()
      .sortBy('createdAt');
  },

  async updateRegulation(
    id: string,
    data: Partial<Omit<Regulation, 'id' | 'createdAt'>>
  ): Promise<number> {
    return await dbInstance.regulations.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteRegulation(id: string): Promise<void> {
    await dbInstance.transaction(
      'rw',
      dbInstance.regulations,
      dbInstance.regulationCompliance,
      dbInstance.complianceAudits,
      async () => {
        await dbInstance.regulationCompliance.where('regulationId').equals(id).delete();
        await dbInstance.complianceAudits.where('regulationId').equals(id).delete();
        await dbInstance.regulations.delete(id);
      }
    );
  },

  async getRegulationsForRole(role: Role): Promise<Regulation[]> {
    return await dbInstance.regulations
      .where('isActive')
      .equals(true as any)
      .filter(r => r.applicableRoles.includes(role))
      .toArray();
  },

  async getRegulationsForUser(userId: string): Promise<Regulation[]> {
    const user = await dbInstance.users.get(userId);
    if (!user) return [];
    return await this.getRegulationsForRole(user.role);
  },

  async addRegulationCompliance(
    compliance: Omit<RegulationCompliance, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const id = uuid();
    const newCompliance: RegulationCompliance = {
      ...compliance,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    await dbInstance.regulationCompliance.add(newCompliance);
    return id;
  },

  async getRegulationComplianceById(id: string): Promise<RegulationCompliance | undefined> {
    return await dbInstance.regulationCompliance.get(id);
  },

  async getComplianceForUser(userId: string): Promise<RegulationCompliance[]> {
    return await dbInstance.regulationCompliance
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('complianceDate');
  },

  async getComplianceForRegulation(regulationId: string): Promise<RegulationCompliance[]> {
    return await dbInstance.regulationCompliance
      .where('regulationId')
      .equals(regulationId)
      .reverse()
      .sortBy('complianceDate');
  },

  async updateRegulationCompliance(
    id: string,
    data: Partial<Omit<RegulationCompliance, 'id' | 'createdAt'>>
  ): Promise<number> {
    return await dbInstance.regulationCompliance.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteRegulationCompliance(id: string): Promise<void> {
    await dbInstance.regulationCompliance.delete(id);
  },

  async getExpiringCompliance(daysAhead: number): Promise<RegulationCompliance[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    const allCompliance = await dbInstance.regulationCompliance.toArray();
    return allCompliance.filter(comp => {
      if (!comp.expirationDate) return false;
      const expDate = new Date(comp.expirationDate);
      return expDate >= today && expDate <= futureDate;
    });
  },

  async checkUserCompliance(
    userId: string,
    regulationId: string
  ): Promise<RegulationCompliance | undefined> {
    return await dbInstance.regulationCompliance
      .where('[userId+regulationId]')
      .equals([userId, regulationId])
      .first();
  },

  async addComplianceAudit(
    audit: Omit<ComplianceAudit, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>
  ): Promise<string> {
    const id = uuid();
    const newAudit: ComplianceAudit = {
      ...audit,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };
    await dbInstance.complianceAudits.add(newAudit);
    return id;
  },

  async getComplianceAuditById(id: string): Promise<ComplianceAudit | undefined> {
    return await dbInstance.complianceAudits.get(id);
  },

  async getAllComplianceAudits(): Promise<ComplianceAudit[]> {
    return await dbInstance.complianceAudits.reverse().sortBy('auditDate');
  },

  async getAuditsForRegulation(regulationId: string): Promise<ComplianceAudit[]> {
    return await dbInstance.complianceAudits
      .where('regulationId')
      .equals(regulationId)
      .reverse()
      .sortBy('auditDate');
  },

  async updateComplianceAudit(
    id: string,
    data: Partial<Omit<ComplianceAudit, 'id' | 'createdAt'>>
  ): Promise<number> {
    return await dbInstance.complianceAudits.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  },

  async deleteComplianceAudit(id: string): Promise<void> {
    await dbInstance.complianceAudits.delete(id);
  },
};

// Open the database. This will also trigger the 'populate' event if it's the first time.
if (typeof window !== 'undefined') {
  dbInstance
    .open()
    .then(async () => {
      // Verificar si faltan enrollments y agregarlos si es necesario
      try {
        const enrollmentsCount = await dbInstance.enrollments.count();
        const userProgressCount = await dbInstance.userProgress.count();
        const hasAdminUser = await dbInstance.users.get('user_1');

        // Si hay usuario admin pero no hay enrollments, agregar datos demo
        if (hasAdminUser && enrollmentsCount === 0) {
          await dbInstance.enrollments.bulkAdd(
            initialEnrollments.map(e => ({ ...e, updatedAt: e.requestDate }))
          );
        }
        if (hasAdminUser && userProgressCount === 0) {
          await dbInstance.userProgress.bulkAdd(initialUserProgress);
        }
      } catch (err) {
        // Silenciar errores de verificación
      }
    })
    .catch(function (err) {
      console.error('Failed to open Dexie DB:', err);
      if (err.name === 'VersionError') {
        console.warn(
          'Database version mismatch. You might need to clear your browser data for this site or increment the version further.'
        );
      }
    });
}
