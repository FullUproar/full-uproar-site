/**
 * Figma API Utility Library
 *
 * Provides functions to interact with the Figma REST API for:
 * - Reading files and projects
 * - Extracting styles and components
 * - Syncing design tokens
 * - Exporting assets
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface FigmaRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email?: string;
}

interface FigmaProject {
  id: string;
  name: string;
}

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

interface FigmaTeam {
  id: string;
  name: string;
}

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  style_type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  containing_frame?: {
    name: string;
    nodeId: string;
    pageId: string;
    pageName: string;
  };
}

interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  valuesByMode: Record<string, unknown>;
  description?: string;
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
}

/**
 * Get the Figma API token from environment
 */
function getFigmaToken(): string {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN is not set in environment variables');
  }
  return token;
}

/**
 * Make a request to the Figma API
 */
async function figmaRequest<T>(
  endpoint: string,
  options: FigmaRequestOptions = {}
): Promise<T> {
  const token = getFigmaToken();
  const { method = 'GET', body } = options;

  const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
    method,
    headers: {
      'X-Figma-Token': token,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Figma API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ==========================================
// USER & ACCOUNT
// ==========================================

/**
 * Get the current user's information
 */
export async function getCurrentUser(): Promise<FigmaUser> {
  const data = await figmaRequest<{ user: FigmaUser }>('/me');
  return data.user;
}

// ==========================================
// TEAMS & PROJECTS
// ==========================================

/**
 * Get all teams the user has access to
 */
export async function getTeams(): Promise<FigmaTeam[]> {
  // Note: Figma API doesn't have a direct "list teams" endpoint
  // You need to know your team ID. This is a placeholder.
  throw new Error('Team ID must be provided - Figma does not list all teams');
}

/**
 * Get all projects in a team
 */
export async function getTeamProjects(teamId: string): Promise<FigmaProject[]> {
  const data = await figmaRequest<{ projects: FigmaProject[] }>(`/teams/${teamId}/projects`);
  return data.projects;
}

/**
 * Get all files in a project
 */
export async function getProjectFiles(projectId: string): Promise<FigmaFile[]> {
  const data = await figmaRequest<{ files: FigmaFile[] }>(`/projects/${projectId}/files`);
  return data.files;
}

// ==========================================
// FILES
// ==========================================

/**
 * Get a Figma file's metadata and structure
 */
export async function getFile(fileKey: string, params?: {
  version?: string;
  ids?: string[];
  depth?: number;
  geometry?: 'paths';
  plugin_data?: string;
  branch_data?: boolean;
}) {
  let endpoint = `/files/${fileKey}`;
  if (params) {
    const searchParams = new URLSearchParams();
    if (params.version) searchParams.set('version', params.version);
    if (params.ids) searchParams.set('ids', params.ids.join(','));
    if (params.depth) searchParams.set('depth', params.depth.toString());
    if (params.geometry) searchParams.set('geometry', params.geometry);
    if (params.plugin_data) searchParams.set('plugin_data', params.plugin_data);
    if (params.branch_data) searchParams.set('branch_data', 'true');
    const queryString = searchParams.toString();
    if (queryString) endpoint += `?${queryString}`;
  }
  return figmaRequest(endpoint);
}

/**
 * Get file versions/history
 */
export async function getFileVersions(fileKey: string) {
  return figmaRequest(`/files/${fileKey}/versions`);
}

// ==========================================
// STYLES
// ==========================================

/**
 * Get all styles in a file
 */
export async function getFileStyles(fileKey: string): Promise<FigmaStyle[]> {
  const data = await figmaRequest<{ meta: { styles: FigmaStyle[] } }>(`/files/${fileKey}/styles`);
  return data.meta.styles;
}

/**
 * Get a specific style by key
 */
export async function getStyle(styleKey: string): Promise<FigmaStyle> {
  const data = await figmaRequest<{ meta: FigmaStyle }>(`/styles/${styleKey}`);
  return data.meta;
}

// ==========================================
// COMPONENTS
// ==========================================

/**
 * Get all components in a file
 */
export async function getFileComponents(fileKey: string): Promise<FigmaComponent[]> {
  const data = await figmaRequest<{ meta: { components: FigmaComponent[] } }>(`/files/${fileKey}/components`);
  return data.meta.components;
}

/**
 * Get a specific component by key
 */
export async function getComponent(componentKey: string): Promise<FigmaComponent> {
  const data = await figmaRequest<{ meta: FigmaComponent }>(`/components/${componentKey}`);
  return data.meta;
}

/**
 * Get all component sets in a file
 */
export async function getFileComponentSets(fileKey: string) {
  return figmaRequest(`/files/${fileKey}/component_sets`);
}

// ==========================================
// VARIABLES (Design Tokens)
// ==========================================

/**
 * Get all local variables in a file
 * This is useful for extracting design tokens
 */
export async function getFileVariables(fileKey: string): Promise<{
  variables: Record<string, FigmaVariable>;
  variableCollections: Record<string, FigmaVariableCollection>;
}> {
  const data = await figmaRequest<{
    meta: {
      variables: Record<string, FigmaVariable>;
      variableCollections: Record<string, FigmaVariableCollection>;
    };
  }>(`/files/${fileKey}/variables/local`);
  return data.meta;
}

/**
 * Publish variables to a file (requires write access)
 */
export async function publishVariables(fileKey: string, variables: {
  variableCollections?: Array<{
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    id?: string;
    name?: string;
    initialModeId?: string;
  }>;
  variableModes?: Array<{
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    id?: string;
    name?: string;
    variableCollectionId?: string;
  }>;
  variables?: Array<{
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    id?: string;
    name?: string;
    variableCollectionId?: string;
    resolvedType?: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
    description?: string;
    codeSyntax?: Record<string, string>;
    scopes?: string[];
    valuesByMode?: Record<string, unknown>;
  }>;
}) {
  return figmaRequest(`/files/${fileKey}/variables`, {
    method: 'POST',
    body: variables,
  });
}

// ==========================================
// IMAGES & EXPORTS
// ==========================================

/**
 * Export images from a file
 */
export async function exportImages(fileKey: string, params: {
  ids: string[];
  scale?: number;
  format?: 'jpg' | 'png' | 'svg' | 'pdf';
  svg_include_id?: boolean;
  svg_simplify_stroke?: boolean;
  use_absolute_bounds?: boolean;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set('ids', params.ids.join(','));
  if (params.scale) searchParams.set('scale', params.scale.toString());
  if (params.format) searchParams.set('format', params.format);
  if (params.svg_include_id) searchParams.set('svg_include_id', 'true');
  if (params.svg_simplify_stroke) searchParams.set('svg_simplify_stroke', 'true');
  if (params.use_absolute_bounds) searchParams.set('use_absolute_bounds', 'true');

  return figmaRequest(`/images/${fileKey}?${searchParams.toString()}`);
}

/**
 * Get image fills from a file
 */
export async function getImageFills(fileKey: string) {
  return figmaRequest(`/files/${fileKey}/images`);
}

// ==========================================
// COMMENTS
// ==========================================

/**
 * Get all comments on a file
 */
export async function getFileComments(fileKey: string) {
  return figmaRequest(`/files/${fileKey}/comments`);
}

/**
 * Post a comment on a file
 */
export async function postComment(fileKey: string, message: string, options?: {
  client_meta?: { x: number; y: number; node_id?: string; node_offset?: { x: number; y: number } };
  comment_id?: string; // Reply to existing comment
}) {
  return figmaRequest(`/files/${fileKey}/comments`, {
    method: 'POST',
    body: {
      message,
      ...options,
    },
  });
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Convert Figma RGBA color to hex
 */
export function figmaColorToHex(color: FigmaColor): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * Convert Figma RGBA color to CSS rgba
 */
export function figmaColorToRgba(color: FigmaColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

/**
 * Convert hex color to Figma RGBA
 */
export function hexToFigmaColor(hex: string): FigmaColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: 1,
  };
}

/**
 * Extract all colors from a Figma file's paint styles
 */
export async function extractColorsFromFile(fileKey: string): Promise<Array<{
  name: string;
  hex: string;
  rgba: string;
}>> {
  const file = await getFile(fileKey) as { styles?: Record<string, { name: string; styleType: string }> };
  const styles = await getFileStyles(fileKey);

  const colorStyles = styles.filter(s => s.style_type === 'FILL');

  // Note: To get actual color values, you need to read the nodes that use these styles
  // This is a simplified version that returns style names
  return colorStyles.map(style => ({
    name: style.name,
    hex: '#000000', // Would need node data to get actual color
    rgba: 'rgba(0, 0, 0, 1)',
  }));
}

/**
 * Check if Figma API connection is working
 */
export async function testConnection(): Promise<{
  success: boolean;
  user?: FigmaUser;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==========================================
// DESIGN TOKEN SYNC
// ==========================================

/**
 * Convert our design tokens to Figma variable format
 */
export function convertTokensToFigmaVariables(tokens: Record<string, unknown>): Array<{
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING';
  value: unknown;
}> {
  const variables: Array<{
    name: string;
    resolvedType: 'COLOR' | 'FLOAT' | 'STRING';
    value: unknown;
  }> = [];

  function processTokens(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const name = prefix ? `${prefix}/${key}` : key;

      if (typeof value === 'object' && value !== null && 'value' in value) {
        // This is a token
        const token = value as { value: string; type: string };

        if (token.type === 'color') {
          variables.push({
            name,
            resolvedType: 'COLOR',
            value: token.value.startsWith('#') ? hexToFigmaColor(token.value) : token.value,
          });
        } else if (token.type === 'fontSizes' || token.type === 'spacing' || token.type === 'borderRadius') {
          // Extract numeric value
          const numericValue = parseFloat(token.value);
          if (!isNaN(numericValue)) {
            variables.push({
              name,
              resolvedType: 'FLOAT',
              value: numericValue,
            });
          }
        } else {
          variables.push({
            name,
            resolvedType: 'STRING',
            value: token.value,
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested object, recurse
        processTokens(value as Record<string, unknown>, name);
      }
    }
  }

  processTokens(tokens);
  return variables;
}

export default {
  // User
  getCurrentUser,
  testConnection,

  // Teams & Projects
  getTeamProjects,
  getProjectFiles,

  // Files
  getFile,
  getFileVersions,

  // Styles
  getFileStyles,
  getStyle,

  // Components
  getFileComponents,
  getComponent,
  getFileComponentSets,

  // Variables
  getFileVariables,
  publishVariables,

  // Images
  exportImages,
  getImageFills,

  // Comments
  getFileComments,
  postComment,

  // Utilities
  figmaColorToHex,
  figmaColorToRgba,
  hexToFigmaColor,
  extractColorsFromFile,
  convertTokensToFigmaVariables,
};
