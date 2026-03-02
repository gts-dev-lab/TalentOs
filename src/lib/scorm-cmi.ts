/**
 * TT-108: Validación y mapeo CMI SCORM 2004 RTE para persistencia.
 * Tipos y límites según SCORM Run-Time Environment (location ≤1000, score.scaled 0–1).
 */

import type { ScormCmiState } from '@/lib/types';

const LOCATION_MAX = 1000;
const SCORE_SCALED_MIN = 0;
const SCORE_SCALED_MAX = 1;
const COMPLETION_VALUES = ['incomplete', 'completed'] as const;
const SUCCESS_VALUES = ['passed', 'failed', 'unknown'] as const;

function clampScoreScaled(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(SCORE_SCALED_MIN, Math.min(SCORE_SCALED_MAX, v));
}

function clampLocation(s: string): string {
  return String(s).slice(0, LOCATION_MAX);
}

/**
 * Convierte un snapshot CMI (claves tipo cmi.completion_status) a datos validados para persistencia.
 * Validación según SCORM RTE: score 0–1, location ≤1000.
 */
export function cmiToScormCmiState(
  _userId: string,
  _courseId: string,
  cmi: Record<string, unknown>
): Omit<ScormCmiState, 'id' | 'userId' | 'courseId' | 'updatedAt'> {
  const completionStatus = String(
    cmi['cmi.completion_status'] ?? cmi['cmi.core.lesson_status'] ?? 'incomplete'
  ).toLowerCase();
  const successStatus = String(cmi['cmi.success_status'] ?? 'unknown').toLowerCase();
  const scoreScaledRaw = cmi['cmi.score.scaled'];
  const scoreScaled = clampScoreScaled(Number(scoreScaledRaw));
  const location = clampLocation(String(cmi['cmi.location'] ?? ''));
  const suspendData = String(cmi['cmi.suspend_data'] ?? '');

  return {
    completionStatus: COMPLETION_VALUES.includes(
      completionStatus as (typeof COMPLETION_VALUES)[number]
    )
      ? completionStatus
      : 'incomplete',
    successStatus: SUCCESS_VALUES.includes(successStatus as (typeof SUCCESS_VALUES)[number])
      ? successStatus
      : 'unknown',
    scoreScaled,
    location,
    suspendData,
  };
}

/**
 * Convierte ScormCmiState guardado a objeto CMI (claves cmi.*) para rehidratar el API.
 */
export function scormCmiStateToCmi(state: ScormCmiState): Record<string, string> {
  return {
    'cmi.completion_status': state.completionStatus,
    'cmi.success_status': state.successStatus,
    'cmi.score.min': '0',
    'cmi.score.max': '100',
    'cmi.score.scaled': String(state.scoreScaled),
    'cmi.location': state.location,
    'cmi.suspend_data': state.suspendData,
    'cmi.core.lesson_status': state.completionStatus,
  };
}
