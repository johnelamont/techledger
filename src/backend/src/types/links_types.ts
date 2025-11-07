// ============================================
// TechLedger Links System - TypeScript Types
// backend/src/types/links.ts
// ============================================

export type LinkType = 
  | 'documentation'
  | 'video'
  | 'support_article'
  | 'tool'
  | 'internal_wiki'
  | 'vendor_site'
  | 'training'
  | 'other';

export type AuthRequired = 
  | 'none'
  | 'login'
  | 'vpn'
  | 'sso'
  | 'credentials';

export type LinkStatus = 
  | 'active'
  | 'inactive'
  | 'broken'
  | 'outdated';

export interface Link {
  id: number;
  url: string;
  title: string;
  description?: string;
  link_type: LinkType;
  auth_required: AuthRequired;
  access_notes?: string;
  status: LinkStatus;
  verified_at?: Date;
  notes?: string;
  thumbnail_url?: string;
  open_in_new_tab: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLinkInput {
  url: string;
  title: string;
  description?: string;
  link_type?: LinkType;
  auth_required?: AuthRequired;
  access_notes?: string;
  notes?: string;
  thumbnail_url?: string;
  open_in_new_tab?: boolean;
}

export interface UpdateLinkInput {
  url?: string;
  title?: string;
  description?: string;
  link_type?: LinkType;
  auth_required?: AuthRequired;
  access_notes?: string;
  status?: LinkStatus;
  notes?: string;
  thumbnail_url?: string;
  open_in_new_tab?: boolean;
}

// Junction table types
export interface SystemLink {
  id: number;
  system_id: number;
  link_id: number;
  display_order: number;
  context_notes?: string;
  created_at: Date;
}

export interface ActionLink {
  id: number;
  action_id: number;
  link_id: number;
  display_order: number;
  context_notes?: string;
  created_at: Date;
}

export interface RoleLink {
  id: number;
  role_id: number;
  link_id: number;
  display_order: number;
  context_notes?: string;
  created_at: Date;
}

export interface TaskLink {
  id: number;
  task_id: number;
  link_id: number;
  display_order: number;
  context_notes?: string;
  created_at: Date;
}

// Association input types
export interface LinkAssociationInput {
  link_id: number;
  display_order?: number;
  context_notes?: string;
}

// Enriched types for API responses
export interface LinkWithContext extends Link {
  context_notes?: string;
  display_order?: number;
}

export interface LinkUsageStats {
  link_id: number;
  url: string;
  title: string;
  link_type: LinkType;
  auth_required: AuthRequired;
  status: LinkStatus;
  system_count: number;
  action_count: number;
  role_count: number;
  task_count: number;
  created_at: Date;
  verified_at?: Date;
}

// Response types for API
export interface GetLinksResponse {
  links: Link[];
  total: number;
  page: number;
  per_page: number;
}

export interface GetObjectLinksResponse {
  links: LinkWithContext[];
  object_type: 'system' | 'action' | 'role' | 'task';
  object_id: number;
}

// Validation helpers
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

export const isValidLinkType = (type: string): type is LinkType => {
  return ['documentation', 'video', 'support_article', 'tool', 
          'internal_wiki', 'vendor_site', 'training', 'other'].includes(type);
};

export const isValidAuthRequired = (auth: string): auth is AuthRequired => {
  return ['none', 'login', 'vpn', 'sso', 'credentials'].includes(auth);
};

export const isValidLinkStatus = (status: string): status is LinkStatus => {
  return ['active', 'inactive', 'broken', 'outdated'].includes(status);
};

// Display helpers
export const getLinkTypeLabel = (type: LinkType): string => {
  const labels: Record<LinkType, string> = {
    'documentation': 'Documentation',
    'video': 'Video Tutorial',
    'support_article': 'Support Article',
    'tool': 'Tool/Resource',
    'internal_wiki': 'Internal Wiki',
    'vendor_site': 'Vendor Website',
    'training': 'Training Material',
    'other': 'Other'
  };
  return labels[type];
};

export const getAuthRequiredLabel = (auth: AuthRequired): string => {
  const labels: Record<AuthRequired, string> = {
    'none': 'Public (No login required)',
    'login': 'Login Required',
    'vpn': 'VPN Required',
    'sso': 'SSO Required',
    'credentials': 'Username/Password Required'
  };
  return labels[auth];
};

export const getAuthRequiredIcon = (auth: AuthRequired): string => {
  const icons: Record<AuthRequired, string> = {
    'none': '🌐',
    'login': '🔐',
    'vpn': '🔒',
    'sso': '🎫',
    'credentials': '🔑'
  };
  return icons[auth];
};

export const getLinkStatusColor = (status: LinkStatus): string => {
  const colors: Record<LinkStatus, string> = {
    'active': '#22c55e',    // green
    'inactive': '#94a3b8',  // gray
    'broken': '#ef4444',     // red
    'outdated': '#f59e0b'    // yellow/orange
  };
  return colors[status];
};
