// ============================================================
// Tipos centrais da aplicação
// ============================================================

export type SourceType = "sendflow" | "devzapp" | "manual" | "other";
export type MonitoringStatus = "active" | "paused" | "error";
export type RunStatus = "running" | "success" | "error";
export type GroupStatus = "active" | "invalid" | "error";

export interface MonitoredSource {
  id: string;
  source_url: string;
  list_name: string;
  source_type: SourceType;
  interval_minutes: 30 | 60 | 90;
  status: MonitoringStatus;
  last_run_at: string | null;
  next_run_at: string | null;
  total_groups_found: number;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface PulledGroup {
  id: string;
  monitored_source_id: string;
  group_link: string;
  list_name: string;
  source_type: SourceType;
  group_hash: string;
  pulled_at: string;
  status: GroupStatus;
  error_message: string | null;
  raw_payload: Record<string, unknown> | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
  // join
  monitored_sources?: Pick<MonitoredSource, "source_url" | "list_name">;
}

export interface ExtractionRun {
  id: string;
  monitored_source_id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  groups_found_count: number;
  groups_inserted_count: number;
  groups_skipped_count: number;
  error_message: string | null;
  raw_response: Record<string, unknown> | null;
  created_at: string;
}

// Payload normalizado que todos os adaptadores devem retornar
export interface NormalizedGroup {
  groupLink: string;
  groupHash: string;
  rawPayload: Record<string, unknown>;
}

// DTOs de criação/edição
export interface CreateMonitoredSourceDto {
  source_url: string;
  list_name: string;
  source_type: SourceType;
  interval_minutes: 30 | 60 | 90;
}

export interface UpdateMonitoredSourceDto {
  source_url?: string;
  list_name?: string;
  source_type?: SourceType;
  interval_minutes?: 30 | 60 | 90;
  status?: MonitoringStatus;
}

// Filtros para listagem de grupos
export interface PulledGroupsFilters {
  list_name?: string;
  source_type?: SourceType;
  status?: GroupStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// Resultado de uma execução de extração
export interface ExtractionResult {
  found: number;
  inserted: number;
  skipped: number;
  errors: string[];
}
