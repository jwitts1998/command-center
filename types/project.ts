export interface Project {
  id: string;
  name: string;
  description: string | null;
  tech_stack: TechStack;
  repo_path: string | null;
  status: 'active' | 'inactive' | 'archived';
  monthly_budget: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TechStack {
  languages?: string[];
  frameworks?: string[];
  databases?: string[];
  cloud?: string[];
  tools?: string[];
  [key: string]: any;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  tech_stack?: TechStack;
  repo_path?: string;
  monthly_budget?: number;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  tech_stack?: TechStack;
  repo_path?: string;
  status?: 'active' | 'inactive' | 'archived';
  monthly_budget?: number;
}
