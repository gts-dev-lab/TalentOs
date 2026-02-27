
// src/lib/db-providers/types.ts
import type {
    Course, User, Enrollment, UserProgress, PendingEnrollmentDetails, ForumMessage,
    ForumMessageWithReplies, Notification, Resource, CourseResource, Announcement,
    ChatChannel, ChatMessage, Role, ComplianceReportData, DirectMessageThread,
    CalendarEvent, ExternalTraining, EnrollmentStatus, EnrollmentWithDetails, Cost,
    StudentForManagement, AIConfig, AIUsageLog, Badge, UserBadge, UserStatus,
    CustomCostCategory, LearningPath, UserLearningPathProgress,     CourseRating, RolePermission, SystemLog, LogLevel, Certificate, CertificateTemplate, CertificateStatus,     IndividualDevelopmentPlan, PDIStatus, Regulation, RegulationCompliance, ComplianceAudit, ScormCmiState
} from '@/lib/types';
import Dexie, { type Table } from 'dexie';

export interface DBProvider {
  db: Dexie & {
    enrollments: Table<Enrollment, number>;
    userProgress: Table<UserProgress, number>;
    courses: Table<Course, string>;
    users: Table<User, string>;
    notifications: Table<Notification, number>;
    systemLogs: Table<SystemLog, number>;
    aiUsageLog: Table<AIUsageLog, number>;
    chatChannels: Table<ChatChannel, string>;
    chatMessages: Table<ChatMessage, number>;
    calendarEvents: Table<CalendarEvent, number>;
    costs: Table<Cost, number>;
    certificates: Table<Certificate, string>;
    certificateTemplates: Table<CertificateTemplate, string>;
    learningPaths: Table<LearningPath, number>;
    badges: Table<Badge, string>;
    userBadges: Table<UserBadge, number>;
    individualDevelopmentPlans: Table<IndividualDevelopmentPlan, string>;
    regulations: Table<Regulation, string>;
    regulationCompliance: Table<RegulationCompliance, string>;
    complianceAudits: Table<ComplianceAudit, string>;
    courseRatings: Table<CourseRating, number>;
    externalTrainings: Table<ExternalTraining, number>;
    rolePermissions: Table<RolePermission, string>;
    scormCmiState: Table<ScormCmiState, number>;
    forumMessages: Table<ForumMessage, number>;
    resources: Table<Resource, number>;
    courseResources: Table<CourseResource, number>;
    announcements: Table<Announcement, number>;
    costCategories: Table<CustomCostCategory, number>;
    userLearningPathProgress: Table<UserLearningPathProgress, number>;
    aiConfig: Table<AIConfig, string>;
  };

  // Initialization
  populateDatabase(): Promise<void>;
  
  // Auth
  login(email: string, password?: string): Promise<User | null>;
  logout(): void;
  getLoggedInUser(): Promise<User | null>;

  // User
  addUser(user: Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken' | 'passwordHash'> & { password?: string }): Promise<User>;
  bulkAddUsers(users: Omit<User, 'id' | 'isSynced' | 'updatedAt' | 'notificationSettings' | 'points' | 'status' | 'fcmToken' | 'passwordHash'> & { password?: string }[]): Promise<string[]>;
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<Omit<User, 'id' | 'isSynced' | 'passwordHash'>>): Promise<number>;
  updateUserStatus(userId: string, status: UserStatus): Promise<number>;
  saveFcmToken(userId: string, fcmToken: string): Promise<number>;
  deleteUser(id: string): Promise<void>;
  /** RGPD TT-110: borrado lógico (soft delete). Establece deletedAt; el usuario deja de ser visible en listados y login. */
  softDeleteUser(id: string): Promise<number>;

  // Certificates
  addCertificate(certificate: Omit<Certificate, 'id' | 'isSynced' | 'updatedAt'>): Promise<string>;
  getCertificateById(id: string): Promise<Certificate | undefined>;
  getCertificatesForUser(userId: string): Promise<Certificate[]>;
  getCertificatesForCourse(courseId: string): Promise<Certificate[]>;
  getAllCertificates(): Promise<Certificate[]>;
  getCertificateByVerificationCode(code: string): Promise<Certificate | undefined>;
  updateCertificateStatus(id: string, status: CertificateStatus): Promise<number>;
  getCertificateForUserCourse(userId: string, courseId: string): Promise<Certificate | undefined>;
  getCertificateTemplates(): Promise<CertificateTemplate[]>;
  getCertificateTemplateById(id: string): Promise<CertificateTemplate | undefined>;
  updateCertificateTemplate(id: string, data: Partial<Omit<CertificateTemplate, 'id' | 'createdAt'>>): Promise<number>;

  // Course
  addCourse(course: Partial<Omit<Course, 'id' | 'isSynced' | 'updatedAt'>>): Promise<string>;
  getAllCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  updateCourse(id: string, data: Partial<Omit<Course, 'id' | 'isSynced'>>): Promise<number>;
  updateCourseStatus(id: string, status: 'draft' | 'published'): Promise<number>;
  deleteCourse(id: string): Promise<void>;

  // Enrollment
  requestEnrollment(courseId: string, studentId: string): Promise<number>;
  getApprovedEnrollmentCount(courseId: string): Promise<number>;
  getPendingEnrollmentsWithDetails(): Promise<PendingEnrollmentDetails[]>;
  getAllEnrollmentsWithDetails(): Promise<EnrollmentWithDetails[]>;
  getEnrollmentsForStudent(userId: string): Promise<EnrollmentWithDetails[]>;
  updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus, justification?: string): Promise<number>;
  getEnrolledCoursesForUser(userId: string): Promise<Course[]>;
  getIncompleteMandatoryCoursesForUser(user: User): Promise<Course[]>;

  // User Progress
  getUserProgress(userId: string, courseId: string): Promise<UserProgress | undefined>;
  getUserProgressForUser(userId: string): Promise<UserProgress[]>;
  markModuleAsCompleted(userId: string, courseId: string, moduleId: string): Promise<void>;

  // SCORM CMI (TT-108)
  getScormCmiState(userId: string, courseId: string): Promise<ScormCmiState | undefined>;
  saveScormCmiState(userId: string, courseId: string, data: Omit<ScormCmiState, 'id' | 'userId' | 'courseId' | 'updatedAt'>): Promise<void>;

  // Forum
  addForumMessage(message: Omit<ForumMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getForumMessages(courseId: string): Promise<ForumMessageWithReplies[]>;
  deleteForumMessage(messageId: number): Promise<void>;

  // Notifications
  addNotification(notification: Omit<Notification, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<number>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  checkAndSendDeadlineReminders(user: User): Promise<void>;

  // Resources
  addResource(resource: Omit<Resource, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getAllResources(): Promise<Resource[]>;
  deleteResource(resourceId: number): Promise<void>;
  associateResourceWithCourse(courseId: string, resourceId: number): Promise<void>;
  dissociateResourceFromCourse(courseId: string, resourceId: number): Promise<void>;
  getResourcesForCourse(courseId: string): Promise<Resource[]>;
  getAssociatedResourceIdsForCourse(courseId: string): Promise<number[]>;

  // Announcements
  addAnnouncement(announcement: Omit<Announcement, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  deleteAnnouncement(id: number): Promise<void>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getVisibleAnnouncementsForUser(user: User): Promise<Announcement[]>;

  // Chat
  addChatMessage(message: Omit<ChatMessage, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getChatMessages(channelId: number | string): Promise<ChatMessage[]>;
  getPublicChatChannels(): Promise<ChatChannel[]>;
  addPublicChatChannel(name: string, description: string): Promise<string>;
  getDirectMessageThreadsForUserWithDetails(userId: string): Promise<DirectMessageThread[]>;
  getOrCreateDirectMessageThread(currentUserId: string, otherUserId: string): Promise<ChatChannel>;

  // Compliance
  getComplianceReportData(departmentFilter?: string, roleFilter?: string): Promise<ComplianceReportData[]>;

  // Calendar
  getAllCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvents(courseIds: string[]): Promise<CalendarEvent[]>;
  addCalendarEvent(event: Omit<CalendarEvent, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateCalendarEvent(id: number, data: Partial<Omit<CalendarEvent, 'id' | 'isSynced'>>): Promise<number>;
  deleteCalendarEvent(id: number): Promise<void>;

  // External Training
  getExternalTrainingsForUser(userId: string): Promise<ExternalTraining[]>;
  addExternalTraining(training: Omit<ExternalTraining, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateExternalTraining(id: number, data: Partial<Omit<ExternalTraining, 'id'>>): Promise<number>;
  deleteExternalTraining(id: number): Promise<void>;

  // Costs
  getAllCosts(): Promise<Cost[]>;
  addCost(cost: Omit<Cost, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateCost(id: number, data: Partial<Omit<Cost, 'id'>>): Promise<number>;
  deleteCost(id: number): Promise<void>;
  getAllCostCategories(): Promise<CustomCostCategory[]>;
  addCostCategory(category: { name: string }): Promise<number>;
  deleteCostCategory(id: number): Promise<void>;

  // Instructors
  getCoursesByInstructorName(instructorName: string): Promise<Course[]>;
  getStudentsForCourseManagement(courseId: string): Promise<StudentForManagement[]>;

  // Gamification
  getAllBadges(): Promise<Badge[]>;
  getBadgesForUser(userId: string): Promise<UserBadge[]>;
  awardBadge(userId: string, badgeId: string): Promise<void>;

  // AI Config
  getAIConfig(): Promise<AIConfig>;
  saveAIConfig(config: AIConfig): Promise<string>;
  logAIUsage(log: Omit<AIUsageLog, 'id' | 'timestamp'>): Promise<number>;

  // Learning Paths
  getAllLearningPaths(): Promise<LearningPath[]>;
  getLearningPathById(id: number): Promise<LearningPath | undefined>;
  addLearningPath(path: Omit<LearningPath, 'id' | 'isSynced' | 'updatedAt'>): Promise<number>;
  updateLearningPath(id: number, data: Partial<Omit<LearningPath, 'id'>>): Promise<number>;
  deleteLearningPath(id: number): Promise<void>;
  getLearningPathsForUser(user: User): Promise<(LearningPath & { progress: UserLearningPathProgress | undefined })[]>;

  // Individual Development Plans (PDI)
  addPDI(pdi: Omit<IndividualDevelopmentPlan, 'id' | 'isSynced' | 'updatedAt' | 'createdAt'>): Promise<string>;
  getPDIById(id: string): Promise<IndividualDevelopmentPlan | undefined>;
  getPDIsForUser(userId: string): Promise<IndividualDevelopmentPlan[]>;
  getPDIsForManager(managerId: string): Promise<IndividualDevelopmentPlan[]>;
  getAllPDIs(): Promise<IndividualDevelopmentPlan[]>;
  updatePDI(id: string, data: Partial<Omit<IndividualDevelopmentPlan, 'id' | 'createdAt'>>): Promise<number>;
  deletePDI(id: string): Promise<void>;
  addPDIReview(pdiId: string, review: Omit<IndividualDevelopmentPlan['reviews'][0], 'id' | 'createdAt'>): Promise<number>;
  updatePDIMilestone(pdiId: string, milestoneId: string, updates: Partial<IndividualDevelopmentPlan['milestones'][0]>): Promise<number>;

  // Ratings
  addCourseRating(rating: Omit<CourseRating, 'id' | 'isPublic' | 'isSynced' | 'updatedAt'>): Promise<number>;
  getRatingByUserAndCourse(userId: string, courseId: string): Promise<CourseRating | undefined>;
  getRatingsForCourse(courseId: string): Promise<CourseRating[]>;
  getRatingsForInstructor(instructorName: string): Promise<CourseRating[]>;
  toggleCourseRatingVisibility(ratingId: number, isPublic: boolean): Promise<number>;

  // Permissions
  getPermissionsForRole(role: Role): Promise<string[]>;
  updatePermissionsForRole(role: Role, visibleNavs: string[]): Promise<number>;

  // System Logs
  logSystemEvent(level: LogLevel, message: string, details?: Record<string, any>): Promise<void>;
  getSystemLogs(filterLevel?: LogLevel): Promise<SystemLog[]>;
  clearAllSystemLogs(): Promise<void>;
  
  // Regulations and Compliance
  addRegulation(regulation: Omit<Regulation, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string>;
  getRegulationById(id: string): Promise<Regulation | undefined>;
  getAllRegulations(): Promise<Regulation[]>;
  getActiveRegulations(): Promise<Regulation[]>;
  updateRegulation(id: string, data: Partial<Omit<Regulation, 'id' | 'createdAt'>>): Promise<number>;
  deleteRegulation(id: string): Promise<void>;
  getRegulationsForRole(role: Role): Promise<Regulation[]>;
  getRegulationsForUser(userId: string): Promise<Regulation[]>;
  
  addRegulationCompliance(compliance: Omit<RegulationCompliance, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string>;
  getRegulationComplianceById(id: string): Promise<RegulationCompliance | undefined>;
  getComplianceForUser(userId: string): Promise<RegulationCompliance[]>;
  getComplianceForRegulation(regulationId: string): Promise<RegulationCompliance[]>;
  updateRegulationCompliance(id: string, data: Partial<Omit<RegulationCompliance, 'id' | 'createdAt'>>): Promise<number>;
  deleteRegulationCompliance(id: string): Promise<void>;
  getExpiringCompliance(daysAhead: number): Promise<RegulationCompliance[]>;
  checkUserCompliance(userId: string, regulationId: string): Promise<RegulationCompliance | undefined>;
  
  addComplianceAudit(audit: Omit<ComplianceAudit, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>): Promise<string>;
  getComplianceAuditById(id: string): Promise<ComplianceAudit | undefined>;
  getAllComplianceAudits(): Promise<ComplianceAudit[]>;
  getAuditsForRegulation(regulationId: string): Promise<ComplianceAudit[]>;
  updateComplianceAudit(id: string, data: Partial<Omit<ComplianceAudit, 'id' | 'createdAt'>>): Promise<number>;
  deleteComplianceAudit(id: string): Promise<void>;

  // Sync
  getUnsyncedItemsCount(): Promise<number>;
  syncWithSupabase(): Promise<{ success: boolean; message: string; }>;
}
