export type EntrySource = 'web' | 'api' | 'mcp';

export interface StartTaskInput {
  userId: string;
  projectId: string;
  taskId: string;
  source: EntrySource;
  note?: string;
}

export interface StopTaskInput {
  userId: string;
  source: EntrySource;
  note?: string;
}

export interface ManualDurationInput {
  userId: string;
  projectId: string;
  taskId: string;
  durationSeconds: number;
  source: EntrySource;
  note?: string;
}

export interface ManualRangeInput {
  userId: string;
  projectId: string;
  taskId: string;
  startedAt: string;
  endedAt: string;
  source: EntrySource;
  note?: string;
}
