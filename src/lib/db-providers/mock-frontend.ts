// @ts-nocheck
/**
 * Provider mock para modo "solo diseño" (NEXT_PUBLIC_FRONTEND_ONLY).
 * No usa IndexedDB ni APIs; devuelve datos vacíos para que solo se vea la UI.
 */

import type { DBProvider } from './types';
import type Dexie from 'dexie';
import { defaultAIConfig } from '@/lib/data';

const emptyArr = <T>(): Promise<T[]> => Promise.resolve([]);
const empty = <T>(): Promise<T | undefined> => Promise.resolve(undefined);
const noop = (): Promise<void> => Promise.resolve();
const zero = (): Promise<number> => Promise.resolve(0);
const emptyStr = (): Promise<string> => Promise.resolve('');
const falseResult = (): Promise<{ success: boolean; message: string }> =>
  Promise.resolve({ success: false, message: 'Frontend-only mode' });

/** Cadena mock para consultas tipo .where().equals().toArray() -> [] */
function mockTableChain() {
  const chain = {
    where: () => chain,
    equals: () => chain,
    equalsIgnoreCase: () => chain,
    anyOf: () => chain,
    reverse: () => chain,
    limit: () => chain,
    sortBy: () => Promise.resolve([]),
    toArray: () => Promise.resolve([]),
    first: () => Promise.resolve(undefined),
    bulkDelete: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };
  return chain;
}

/** Objeto db mock: cualquier tabla devuelve la misma cadena que resuelve en []. */
function createMockDb(): Dexie {
  const chain = mockTableChain();
  const tables = new Proxy({} as Record<string, typeof chain>, {
    get(_, prop: string) {
      return chain;
    },
  });
  const mockDb = {
    ...tables,
    transaction: (_mode: string, ...args: unknown[]) => {
      const fn = args[args.length - 1];
      return typeof fn === 'function' ? Promise.resolve((fn as () => void)()) : Promise.resolve();
    },
  };
  return mockDb as unknown as Dexie;
}

export const mockFrontendProvider: DBProvider = {
  db: createMockDb(),

  populateDatabase: noop,
  login: empty,
  logout: () => {},
  getLoggedInUser: empty,

  addUser: async () => ({}) as any,
  bulkAddUsers: async () => [],
  getAllUsers: emptyArr,
  getUserById: empty,
  updateUser: zero,
  updateUserStatus: zero,
  saveFcmToken: zero,
  deleteUser: noop,
  softDeleteUser: zero,

  addCertificate: emptyStr,
  getCertificateById: empty,
  getCertificatesForUser: emptyArr,
  getCertificatesForCourse: emptyArr,
  getAllCertificates: emptyArr,
  getCertificateByVerificationCode: empty,
  updateCertificateStatus: zero,
  getCertificateForUserCourse: empty,
  getCertificateTemplates: emptyArr,
  getCertificateTemplateById: empty,
  updateCertificateTemplate: zero,

  addCourse: emptyStr,
  getAllCourses: emptyArr,
  getCourseById: empty,
  updateCourse: zero,
  updateCourseStatus: zero,
  deleteCourse: noop,

  requestEnrollment: zero,
  getApprovedEnrollmentCount: zero,
  getPendingEnrollmentsWithDetails: emptyArr,
  getAllEnrollmentsWithDetails: emptyArr,
  getEnrollmentsForStudent: emptyArr,
  updateEnrollmentStatus: zero,
  getEnrolledCoursesForUser: emptyArr,
  getIncompleteMandatoryCoursesForUser: emptyArr,

  getUserProgress: empty,
  getUserProgressForUser: emptyArr,
  markModuleAsCompleted: noop,
  getScormCmiState: empty,
  saveScormCmiState: noop,

  addForumMessage: zero,
  getForumMessages: emptyArr,
  deleteForumMessage: noop,

  addNotification: zero,
  getNotificationsForUser: emptyArr,
  markNotificationAsRead: zero,
  markAllNotificationsAsRead: noop,
  checkAndSendDeadlineReminders: noop,

  addResource: zero,
  getAllResources: emptyArr,
  deleteResource: noop,
  associateResourceWithCourse: noop,
  dissociateResourceFromCourse: noop,
  getResourcesForCourse: emptyArr,
  getAssociatedResourceIdsForCourse: emptyArr,

  addAnnouncement: zero,
  deleteAnnouncement: noop,
  getAllAnnouncements: emptyArr,
  getVisibleAnnouncementsForUser: emptyArr,

  addChatMessage: zero,
  getChatMessages: emptyArr,
  getPublicChatChannels: emptyArr,
  addPublicChatChannel: emptyStr,
  getDirectMessageThreadsForUserWithDetails: emptyArr,
  getOrCreateDirectMessageThread: async () => ({}) as any,

  getComplianceReportData: emptyArr,

  getAllCalendarEvents: emptyArr,
  getCalendarEvents: emptyArr,
  addCalendarEvent: zero,
  updateCalendarEvent: zero,
  deleteCalendarEvent: noop,

  getExternalTrainingsForUser: emptyArr,
  addExternalTraining: zero,
  updateExternalTraining: zero,
  deleteExternalTraining: noop,

  getAllCosts: emptyArr,
  addCost: zero,
  updateCost: zero,
  deleteCost: noop,
  getAllCostCategories: emptyArr,
  addCostCategory: zero,
  deleteCostCategory: noop,

  getCoursesByInstructorName: emptyArr,
  getStudentsForCourseManagement: emptyArr,

  getAllBadges: emptyArr,
  getBadgesForUser: emptyArr,
  awardBadge: noop,

  getAIConfig: async () => defaultAIConfig,
  saveAIConfig: async () => 'singleton',
  logAIUsage: zero,

  getAllLearningPaths: emptyArr,
  getLearningPathById: empty,
  addLearningPath: zero,
  updateLearningPath: zero,
  deleteLearningPath: noop,
  getLearningPathsForUser: emptyArr,

  addPDI: emptyStr,
  getPDIById: empty,
  getPDIsForUser: emptyArr,
  getPDIsForManager: emptyArr,
  getAllPDIs: emptyArr,
  updatePDI: zero,
  deletePDI: noop,
  addPDIReview: zero,
  updatePDIMilestone: zero,

  addCourseRating: zero,
  getRatingByUserAndCourse: empty,
  getRatingsForCourse: emptyArr,
  getRatingsForInstructor: emptyArr,
  toggleCourseRatingVisibility: zero,

  getPermissionsForRole: async () => [],
  updatePermissionsForRole: zero,

  logSystemEvent: noop,
  getSystemLogs: emptyArr,
  clearAllSystemLogs: noop,

  addRegulation: emptyStr,
  getRegulationById: empty,
  getAllRegulations: emptyArr,
  getActiveRegulations: emptyArr,
  updateRegulation: zero,
  deleteRegulation: noop,
  getRegulationsForRole: emptyArr,
  getRegulationsForUser: emptyArr,

  addRegulationCompliance: emptyStr,
  getRegulationComplianceById: empty,
  getComplianceForUser: emptyArr,
  getComplianceForRegulation: emptyArr,
  updateRegulationCompliance: zero,
  deleteRegulationCompliance: noop,
  getExpiringCompliance: emptyArr,
  checkUserCompliance: empty,

  addComplianceAudit: emptyStr,
  getComplianceAuditById: empty,
  getAllComplianceAudits: emptyArr,
  getAuditsForRegulation: emptyArr,
  updateComplianceAudit: zero,
  deleteComplianceAudit: noop,

  getUnsyncedItemsCount: () => Promise.resolve(0),
  syncWithSupabase: falseResult,
};
