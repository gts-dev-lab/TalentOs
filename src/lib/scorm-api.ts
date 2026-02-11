/**
 * TT-107: Adaptador API SCORM 2004 (API_1484_11).
 * Objeto detectable por contenidos externos; métodos Initialize y Terminate;
 * estados de comunicación conforme al estándar (Not Initialized, Initialized, Terminated).
 * Referencia: SCORM 2004 4th Edition Run-Time Environment.
 */

export type ScormApiOptions = {
  /** Llamado cuando el SCO invoca Terminate; recibe snapshot CMI (p. ej. completion_status). */
  onTerminate?: (cmi: Record<string, unknown>) => void;
  /** Nombre del estudiante (cmi.core.student_name en 1.2, equivalente en 2004). */
  studentName?: string;
  /** Persistencia opcional: al Commit(), llamar con los datos CMI (para TT-108). */
  onCommit?: (cmi: Record<string, unknown>) => void;
  /** CMI inicial (p. ej. desde BD) para reanudar sesión. */
  initialCmi?: Record<string, string>;
};

const API_STATE = {
  NOT_INITIALIZED: 0,
  INITIALIZED: 1,
  TERMINATED: 2,
} as const;

/** CMI elements comunes SCORM 2004 (y 1.2 compat). */
const CMI_DEFAULTS: Record<string, string> = {
  'cmi.completion_status': 'incomplete',
  'cmi.success_status': 'unknown',
  'cmi.score.min': '0',
  'cmi.score.max': '100',
  'cmi.score.scaled': '0',
  'cmi.location': '',
  'cmi.suspend_data': '',
  'cmi.core.student_name': 'Student',
  'cmi.core.lesson_status': 'incomplete',
};

/**
 * Crea la instancia del objeto API_1484_11 para un contexto de ejecución (un SCO).
 * El contenido SCORM busca este objeto en window / parent / opener mediante findAPI().
 */
export function createScormApi(options: ScormApiOptions = {}) {
  const cmi: Record<string, string> = { ...CMI_DEFAULTS, ...options.initialCmi };
  if (options.studentName) {
    cmi['cmi.core.student_name'] = options.studentName;
  }

  let apiState = API_STATE.NOT_INITIALIZED;
  let lastErrorCode = '0';

  const api = {
    _state: () => apiState,
    _cmi: () => ({ ...cmi }),

    Initialize: function (_param: string): string {
      if (apiState !== API_STATE.NOT_INITIALIZED) {
        lastErrorCode = '101'; // Already initialized
        return 'false';
      }
      apiState = API_STATE.INITIALIZED;
      lastErrorCode = '0';
      return 'true';
    },

    Terminate: function (_param: string): string {
      if (apiState !== API_STATE.INITIALIZED) {
        lastErrorCode = '114'; // Invalid state for termination
        return 'false';
      }
      apiState = API_STATE.TERMINATED;
      lastErrorCode = '0';
      options.onTerminate?.({ ...cmi });
      return 'true';
    },

    GetValue: function (element: string): string {
      if (apiState !== API_STATE.INITIALIZED && apiState !== API_STATE.TERMINATED) {
        lastErrorCode = '301';
        return '';
      }
      const value = cmi[element];
      if (value !== undefined) return value;
      lastErrorCode = '401'; // Element is read only or not found
      return '';
    },

    SetValue: function (element: string, value: string): string {
      if (apiState !== API_STATE.INITIALIZED) {
        lastErrorCode = '301';
        return 'false';
      }
      if (element.length > 1000) {
        lastErrorCode = '405';
        return 'false';
      }
      cmi[element] = String(value).slice(0, 4000);
      lastErrorCode = '0';
      return 'true';
    },

    Commit: function (_param: string): string {
      if (apiState !== API_STATE.INITIALIZED) {
        lastErrorCode = '301';
        return 'false';
      }
      lastErrorCode = '0';
      options.onCommit?.({ ...cmi });
      return 'true';
    },

    GetLastError: function (): string {
      return lastErrorCode;
    },
    GetErrorString: function (errorCode: string): string {
      const messages: Record<string, string> = {
        '0': 'No error',
        '101': 'General initialization failure',
        '114': 'Invalid state for this operation',
        '301': 'General communication failure',
        '401': 'Invalid argument - element not found or read only',
        '405': 'Invalid argument - value out of range',
      };
      return messages[errorCode] ?? 'Unknown error';
    },
    GetDiagnostic: function (errorCode: string): string {
      return errorCode ? `Diagnostic: ${errorCode}` : 'No diagnostic';
    },
  };

  return api;
}

/** Tipo del objeto API expuesto (para uso en window). */
export type ScormApiInstance = ReturnType<typeof createScormApi>;

/**
 * Busca el objeto API en la jerarquía de ventanas (SCORM: el SCO busca en this, parent, opener).
 * Referencia: SCORM 2004 RTE - API Instance Discovery.
 */
export function findScormApi(win: Window | null): ScormApiInstance | null {
  const maxDepth = 7;
  let w: Window | null = win;
  let depth = 0;

  while (w && depth < maxDepth) {
    const api = (w as Window & { API_1484_11?: ScormApiInstance }).API_1484_11;
    if (api && typeof api.Initialize === 'function') return api;
    w = w.parent !== w ? w.parent : null;
    depth++;
  }

  w = win?.opener ?? null;
  depth = 0;
  while (w && depth < maxDepth) {
    const api = (w as Window & { API_1484_11?: ScormApiInstance }).API_1484_11;
    if (api && typeof api.Initialize === 'function') return api;
    w = w.parent !== w ? w.parent : null;
    depth++;
  }

  return null;
}

/**
 * Instala el objeto API en la ventana dada (típicamente window del padre del iframe del SCO).
 * También expone API (alias 1.2) y opcionalmente define findAPI en la ventana para que el contenido lo use.
 */
export function installScormApi(
  targetWindow: Window,
  api: ScormApiInstance
): void {
  (targetWindow as Window & { API_1484_11: ScormApiInstance }).API_1484_11 = api;
  (targetWindow as Window & { API: ScormApiInstance }).API = api;
  (targetWindow as Window & { findAPI: (w: Window) => ScormApiInstance | null }).findAPI = findScormApi;
}

/**
 * Desinstala el API de la ventana (cleanup al desmontar el player).
 */
export function uninstallScormApi(targetWindow: Window): void {
  delete (targetWindow as Window & { API_1484_11?: unknown }).API_1484_11;
  delete (targetWindow as Window & { API?: unknown }).API;
  delete (targetWindow as Window & { findAPI?: unknown }).findAPI;
}
