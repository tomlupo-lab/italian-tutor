export type Level = "A1" | "A2" | "B1" | "B2";
export type MissionStatus = "not_started" | "active" | "paused" | "completed";

export interface ExerciseTargets {
  bronzeReviews: number;
  silverDrills: number;
  goldConversations: number;
  silverAccuracyTarget?: number;
  goldPhraseTarget?: number;
}

export interface MissionCheckpoint {
  id: string;
  title: string;
  description: string;
  required: boolean;
  minScore: number;
}

export interface ActiveMissionResult {
  missionId: string;
  title: string;
  summary: string;
  level?: Level;
  displayLevel?: Level;
  status?: MissionStatus;
}

export interface LearnerMission {
  missionId: string;
  status?: MissionStatus;
  active: boolean;
  credits?: { bronze: number; silver: number; gold: number };
  criticalErrorsCount?: number;
  averageScore?: number;
  completedCheckpointIds?: string[];
}

export interface CatalogMission {
  missionId: string;
  level: Level;
  displayLevel?: Level;
  order: number;
  required: boolean;
  title: string;
  summary: string;
  tags?: string[];
  targetPatternIds?: string[];
  checkpoints?: MissionCheckpoint[];
  exerciseTargets: ExerciseTargets;
}

export interface LearnerLevel {
  currentLevel: Level;
  unlockedLevels: Level[];
  tierCredits?: { bronze: number; silver: number; gold: number };
  minutesTotal?: number;
  activeDates?: string[];
}

export interface LearnerSkill {
  skillKey: string;
  points: number;
  proficiency?: number;
  confidence?: number;
  evidenceCount?: number;
  recentWeakEvidence?: number;
  recentStrongEvidence?: number;
  rollingErrorRate?: number;
}

export interface AdaptiveFocus {
  weakSkills: LearnerSkill[];
  strongSkills: LearnerSkill[];
  weakErrors: Array<{ errorKey: string; count: number }>;
  blockers: Array<{ skillKey: string; weakEvidenceCount: number; rollingErrorRate: number }>;
  recommendedPatterns: string[];
  recommendedLevel: Level;
}

export interface LearnerStateSnapshot {
  learnerId: string;
  level: LearnerLevel;
  activeMission: ActiveMissionResult | null;
  missions: LearnerMission[];
  skills: LearnerSkill[];
  adaptiveFocus: AdaptiveFocus;
}

export interface RoadmapRule {
  level: Level;
  requiredMissionIds: string[];
  minCompletedMissions: number;
  minOptionalMissions: number;
  skillThresholds: Array<{ skillKey: string; minPoints: number }>;
  sessionMinimums: {
    bronze: number;
    silver: number;
    gold: number;
    minutes: number;
    activeDays: number;
  };
}
