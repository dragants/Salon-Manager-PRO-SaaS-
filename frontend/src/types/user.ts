export type MeUser = {
  id: number;
  email: string;
  organization_id: number;
  /** `admin` = vlasnik / upravnik; `worker` = zaposleni bez pune administracije */
  role: string;
  display_name?: string | null;
};

export type WorkerProfile = {
  service_ids: number[];
  working_hours: Record<string, unknown>;
};

export type OrgTeamMember = {
  id: number;
  email: string;
  role: string;
  display_name: string | null;
  worker_profile: WorkerProfile;
  created_at: string;
};

export type PatchTeamMemberBody = {
  display_name?: string | null;
  role?: "admin" | "worker";
  email?: string;
  password?: string;
  worker_profile?: WorkerProfile;
};
