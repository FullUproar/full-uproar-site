/**
 * Comprehensive Role-Based Access Control (RBAC) Configuration
 * 
 * This defines all roles and their associated permissions for the Full Uproar platform.
 * Each role can have multiple permissions, and users can have multiple roles.
 */

export type Resource = 
  // Admin sections
  | 'admin:access'          // Access to admin panel
  | 'admin:dashboard'        // View admin dashboard
  | 'admin:analytics'        // View analytics
  | 'admin:settings'         // Manage system settings
  
  // Product management
  | 'products:read'          // View products
  | 'products:create'        // Create new products
  | 'products:update'        // Edit existing products
  | 'products:delete'        // Delete products
  | 'products:pricing'       // Manage pricing
  | 'products:inventory'     // Manage inventory
  
  // Order management
  | 'orders:read'           // View orders
  | 'orders:update'         // Update order status
  | 'orders:refund'         // Process refunds
  | 'orders:cancel'         // Cancel orders
  | 'orders:fulfill'        // Mark orders as fulfilled
  | 'orders:shipping'       // Manage shipping
  
  // Customer management
  | 'customers:read'        // View customer data
  | 'customers:update'      // Edit customer info
  | 'customers:delete'      // Delete customers
  | 'customers:support'     // Handle support tickets
  | 'customers:communicate' // Send emails/messages
  
  // User management
  | 'users:read'            // View users
  | 'users:create'          // Create users
  | 'users:update'          // Edit users
  | 'users:delete'          // Delete users
  | 'users:roles'           // Manage user roles
  | 'users:permissions'     // Manage individual permissions
  | 'users:ban'             // Ban/unban users
  | 'users:mute'            // Mute/unmute users
  
  // Marketing
  | 'marketing:campaigns'   // Manage marketing campaigns
  | 'marketing:email'       // Send marketing emails
  | 'marketing:social'      // Manage social media
  | 'marketing:content'     // Create/edit content
  | 'marketing:seo'         // Manage SEO settings
  | 'marketing:analytics'   // View marketing analytics
  
  // Financial
  | 'finance:read'          // View financial data
  | 'finance:reports'       // Generate reports
  | 'finance:export'        // Export financial data
  | 'finance:reconcile'     // Reconcile accounts
  
  // HR functions
  | 'hr:employees'          // Manage employees
  | 'hr:payroll'           // View payroll info
  | 'hr:schedule'          // Manage schedules
  | 'hr:performance'       // Performance reviews
  
  // Content management
  | 'content:blog'         // Manage blog posts
  | 'content:comics'       // Manage comics
  | 'content:artwork'      // Manage artwork
  | 'content:forum'        // Moderate forum
  | 'content:news'         // Publish news
  
  // Integrations
  | 'integrations:stripe'   // Manage Stripe
  | 'integrations:printify' // Manage Printify
  | 'integrations:shipping' // Manage shipping providers
  | 'integrations:api'      // Manage API access
  
  // System
  | 'system:logs'          // View system logs
  | 'system:backups'       // Manage backups
  | 'system:debug'         // Access debug tools
  | 'system:migrations'    // Run database migrations
  | 'system:cache'         // Manage cache
  | 'system:security';     // Security settings

export type Action = 'read' | 'create' | 'update' | 'delete' | 'execute' | '*';

export interface Permission {
  resource: Resource;
  action: Action;
  conditions?: Record<string, any>; // For conditional permissions
}

export enum Role {
  GOD = 'GOD',                   // info@fulluproar.com - absolute power
  SUPER_ADMIN = 'SUPER_ADMIN',   // Full system access
  ADMIN = 'ADMIN',               // Standard admin access
  HR = 'HR',                     // Human Resources
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  MARKETING = 'MARKETING',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  WAREHOUSE = 'WAREHOUSE',
  ACCOUNTING = 'ACCOUNTING',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  MODERATOR = 'MODERATOR',
  INTERN = 'INTERN',
  USER = 'USER',                 // Regular customer
  GUEST = 'GUEST'                // Not logged in
}

/**
 * Define permissions for each role
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.GOD]: [
    // God mode - all permissions
    { resource: '*' as any, action: '*' }
  ],
  
  [Role.SUPER_ADMIN]: [
    // Almost everything except certain system-critical operations
    { resource: 'admin:access', action: '*' },
    { resource: 'admin:dashboard', action: '*' },
    { resource: 'admin:analytics', action: '*' },
    { resource: 'admin:settings', action: '*' },
    { resource: 'products:read', action: '*' },
    { resource: 'products:create', action: '*' },
    { resource: 'products:update', action: '*' },
    { resource: 'products:delete', action: '*' },
    { resource: 'products:pricing', action: '*' },
    { resource: 'products:inventory', action: '*' },
    { resource: 'orders:read', action: '*' },
    { resource: 'orders:update', action: '*' },
    { resource: 'orders:refund', action: '*' },
    { resource: 'orders:cancel', action: '*' },
    { resource: 'orders:fulfill', action: '*' },
    { resource: 'orders:shipping', action: '*' },
    { resource: 'customers:read', action: '*' },
    { resource: 'customers:update', action: '*' },
    { resource: 'customers:delete', action: '*' },
    { resource: 'customers:support', action: '*' },
    { resource: 'customers:communicate', action: '*' },
    { resource: 'users:read', action: '*' },
    { resource: 'users:create', action: '*' },
    { resource: 'users:update', action: '*' },
    { resource: 'users:delete', action: '*' },
    { resource: 'users:roles', action: '*' },
    { resource: 'users:permissions', action: '*' },
    { resource: 'users:ban', action: '*' },
    { resource: 'users:mute', action: '*' },
    { resource: 'marketing:campaigns', action: '*' },
    { resource: 'marketing:email', action: '*' },
    { resource: 'marketing:social', action: '*' },
    { resource: 'marketing:content', action: '*' },
    { resource: 'marketing:seo', action: '*' },
    { resource: 'marketing:analytics', action: '*' },
    { resource: 'finance:read', action: '*' },
    { resource: 'finance:reports', action: '*' },
    { resource: 'finance:export', action: '*' },
    { resource: 'hr:employees', action: '*' },
    { resource: 'content:blog', action: '*' },
    { resource: 'content:comics', action: '*' },
    { resource: 'content:artwork', action: '*' },
    { resource: 'content:forum', action: '*' },
    { resource: 'content:news', action: '*' },
    { resource: 'integrations:stripe', action: '*' },
    { resource: 'integrations:printify', action: '*' },
    { resource: 'integrations:shipping', action: '*' },
    { resource: 'integrations:api', action: '*' },
    { resource: 'system:logs', action: 'read' },
    { resource: 'system:backups', action: '*' },
    { resource: 'system:debug', action: '*' },
    { resource: 'system:cache', action: '*' },
    { resource: 'system:security', action: '*' }
  ],
  
  [Role.ADMIN]: [
    // Standard admin - most operations but not system-level
    { resource: 'admin:access', action: '*' },
    { resource: 'admin:dashboard', action: '*' },
    { resource: 'admin:analytics', action: 'read' },
    { resource: 'products:read', action: '*' },
    { resource: 'products:create', action: '*' },
    { resource: 'products:update', action: '*' },
    { resource: 'products:delete', action: '*' },
    { resource: 'products:pricing', action: '*' },
    { resource: 'products:inventory', action: '*' },
    { resource: 'orders:read', action: '*' },
    { resource: 'orders:update', action: '*' },
    { resource: 'orders:refund', action: '*' },
    { resource: 'orders:cancel', action: '*' },
    { resource: 'orders:fulfill', action: '*' },
    { resource: 'orders:shipping', action: '*' },
    { resource: 'customers:read', action: '*' },
    { resource: 'customers:update', action: '*' },
    { resource: 'customers:support', action: '*' },
    { resource: 'customers:communicate', action: '*' },
    { resource: 'users:read', action: '*' },
    { resource: 'users:update', action: '*' },
    { resource: 'users:ban', action: '*' },
    { resource: 'users:mute', action: '*' },
    { resource: 'content:blog', action: '*' },
    { resource: 'content:comics', action: '*' },
    { resource: 'content:artwork', action: '*' },
    { resource: 'content:forum', action: '*' },
    { resource: 'content:news', action: '*' },
    { resource: 'integrations:stripe', action: 'read' },
    { resource: 'integrations:printify', action: '*' },
    { resource: 'integrations:shipping', action: '*' }
  ],
  
  [Role.HR]: [
    // Human Resources - employee and user management
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'users:read', action: '*' },
    { resource: 'users:create', action: '*' },
    { resource: 'users:update', action: '*' },
    { resource: 'users:roles', action: '*' },
    { resource: 'hr:employees', action: '*' },
    { resource: 'hr:payroll', action: '*' },
    { resource: 'hr:schedule', action: '*' },
    { resource: 'hr:performance', action: '*' },
    { resource: 'customers:read', action: 'read' }
  ],
  
  [Role.PRODUCT_MANAGER]: [
    // Product management - full control over products
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'admin:analytics', action: 'read' },
    { resource: 'products:read', action: '*' },
    { resource: 'products:create', action: '*' },
    { resource: 'products:update', action: '*' },
    { resource: 'products:delete', action: '*' },
    { resource: 'products:pricing', action: '*' },
    { resource: 'products:inventory', action: '*' },
    { resource: 'orders:read', action: 'read' },
    { resource: 'customers:read', action: 'read' },
    { resource: 'marketing:analytics', action: 'read' },
    { resource: 'integrations:printify', action: '*' }
  ],
  
  [Role.MARKETING]: [
    // Marketing - content and campaigns
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'admin:analytics', action: 'read' },
    { resource: 'products:read', action: 'read' },
    { resource: 'products:update', action: 'update' }, // For marketing descriptions
    { resource: 'marketing:campaigns', action: '*' },
    { resource: 'marketing:email', action: '*' },
    { resource: 'marketing:social', action: '*' },
    { resource: 'marketing:content', action: '*' },
    { resource: 'marketing:seo', action: '*' },
    { resource: 'marketing:analytics', action: '*' },
    { resource: 'content:blog', action: '*' },
    { resource: 'content:comics', action: '*' },
    { resource: 'content:artwork', action: '*' },
    { resource: 'content:news', action: '*' },
    { resource: 'customers:read', action: 'read' },
    { resource: 'customers:communicate', action: '*' }
  ],
  
  [Role.CUSTOMER_SERVICE]: [
    // Customer service - handle orders and support
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'products:read', action: 'read' },
    { resource: 'orders:read', action: '*' },
    { resource: 'orders:update', action: '*' },
    { resource: 'orders:refund', action: '*' },
    { resource: 'orders:cancel', action: '*' },
    { resource: 'customers:read', action: '*' },
    { resource: 'customers:update', action: 'update' },
    { resource: 'customers:support', action: '*' },
    { resource: 'customers:communicate', action: '*' },
    { resource: 'content:forum', action: 'update' } // For moderation
  ],
  
  [Role.WAREHOUSE]: [
    // Warehouse - inventory and fulfillment
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'products:read', action: 'read' },
    { resource: 'products:inventory', action: '*' },
    { resource: 'orders:read', action: 'read' },
    { resource: 'orders:fulfill', action: '*' },
    { resource: 'orders:shipping', action: '*' },
    { resource: 'integrations:shipping', action: '*' },
    { resource: 'integrations:printify', action: 'read' }
  ],
  
  [Role.ACCOUNTING]: [
    // Accounting - financial access
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'admin:analytics', action: 'read' },
    { resource: 'products:read', action: 'read' },
    { resource: 'products:pricing', action: 'read' },
    { resource: 'orders:read', action: 'read' },
    { resource: 'orders:refund', action: 'read' },
    { resource: 'finance:read', action: '*' },
    { resource: 'finance:reports', action: '*' },
    { resource: 'finance:export', action: '*' },
    { resource: 'finance:reconcile', action: '*' },
    { resource: 'integrations:stripe', action: 'read' },
    { resource: 'customers:read', action: 'read' }
  ],
  
  [Role.CONTENT_CREATOR]: [
    // Content creators - blog, comics, artwork
    { resource: 'admin:access', action: 'read' },
    { resource: 'content:blog', action: '*' },
    { resource: 'content:comics', action: '*' },
    { resource: 'content:artwork', action: '*' },
    { resource: 'content:news', action: '*' },
    { resource: 'marketing:content', action: '*' },
    { resource: 'products:read', action: 'read' }
  ],
  
  [Role.MODERATOR]: [
    // Forum and community moderation
    { resource: 'content:forum', action: '*' },
    { resource: 'users:read', action: 'read' },
    { resource: 'users:ban', action: '*' },
    { resource: 'users:mute', action: '*' },
    { resource: 'customers:read', action: 'read' }
  ],
  
  [Role.INTERN]: [
    // Limited access - mostly read-only
    { resource: 'admin:access', action: 'read' },
    { resource: 'admin:dashboard', action: 'read' },
    { resource: 'products:read', action: 'read' },
    { resource: 'orders:read', action: 'read' },
    { resource: 'customers:read', action: 'read' },
    { resource: 'content:blog', action: 'create' }, // Can draft posts
    { resource: 'marketing:content', action: 'create' } // Can draft content
  ],
  
  [Role.USER]: [
    // Regular customers
    { resource: 'orders:read', action: 'read' }, // Own orders only (handled by conditions)
    { resource: 'customers:update', action: 'update' }, // Own profile only
    { resource: 'content:forum', action: 'create' } // Can post in forum
  ],
  
  [Role.GUEST]: [
    // Not logged in - public access only
    { resource: 'products:read', action: 'read' }
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRoles: Role[],
  resource: Resource,
  action: Action = 'read',
  userEmail?: string
): boolean {
  // God mode for info@fulluproar.com
  if (userEmail === 'info@fulluproar.com') {
    return true;
  }
  
  // Check if user has GOD role
  if (userRoles.includes(Role.GOD)) {
    return true;
  }
  
  // Check each role's permissions
  for (const role of userRoles) {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) continue;
    
    for (const perm of permissions) {
      // Check for wildcard resource
      if (perm.resource === ('*' as any)) {
        return true;
      }
      
      // Check specific resource
      if (perm.resource === resource) {
        // Check for wildcard action or specific action
        if (perm.action === '*' || perm.action === action) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Get all permissions for a set of roles
 */
export function getPermissionsForRoles(roles: Role[]): Permission[] {
  const allPermissions: Permission[] = [];
  const seen = new Set<string>();
  
  for (const role of roles) {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) continue;
    
    for (const perm of permissions) {
      const key = `${perm.resource}:${perm.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        allPermissions.push(perm);
      }
    }
  }
  
  return allPermissions;
}

/**
 * Admin section permissions mapping
 * Maps admin UI sections to required permissions
 */
export const ADMIN_SECTIONS = {
  dashboard: ['admin:dashboard'],
  analytics: ['admin:analytics', 'marketing:analytics'],
  products: ['products:read'],
  'products/new': ['products:create'],
  'products/edit': ['products:update'],
  orders: ['orders:read'],
  'orders/fulfill': ['orders:fulfill'],
  customers: ['customers:read'],
  'customers/support': ['customers:support'],
  users: ['users:read'],
  'users/roles': ['users:roles'],
  marketing: ['marketing:campaigns', 'marketing:content'],
  finance: ['finance:read'],
  hr: ['hr:employees'],
  content: ['content:blog', 'content:comics', 'content:artwork', 'content:news'],
  integrations: ['integrations:stripe', 'integrations:printify', 'integrations:shipping'],
  settings: ['admin:settings'],
  system: ['system:logs', 'system:debug', 'system:security']
} as const;

/**
 * Check if user can access an admin section
 */
export function canAccessAdminSection(
  userRoles: Role[],
  section: keyof typeof ADMIN_SECTIONS,
  userEmail?: string
): boolean {
  const requiredPermissions = ADMIN_SECTIONS[section];
  if (!requiredPermissions) return false;
  
  // Check if user has any of the required permissions
  for (const permission of requiredPermissions) {
    const [resource, action = 'read'] = permission.split(':') as [Resource, Action];
    if (hasPermission(userRoles, resource, action, userEmail)) {
      return true;
    }
  }
  
  return false;
}