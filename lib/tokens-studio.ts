/**
 * Tokens Studio Pro API Integration
 *
 * Uses the official @tokens-studio/sdk to interact with Tokens Studio
 * for syncing design tokens bidirectionally.
 *
 * Setup:
 * 1. Go to https://tokens.studio → Personal Settings → API Keys
 * 2. Create an API key with scopes: projects:read, projects:write
 * 3. Add TOKENS_STUDIO_API_KEY to your .env.local file
 */

import {
  create,
  GetOrgsDocument,
  GetProjectsDocument,
  GetTokenSetsDocument,
  gql,
  type GetOrgsQuery,
  type GetProjectsQuery,
  type GetTokenSetsQuery,
} from '@tokens-studio/sdk';

// ==========================================
// TYPES
// ==========================================

export interface TokensStudioConfig {
  orgId: string;
  projectId: string;
  branch?: string;
}

export interface Organization {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  organizationId: string;
  branches: Array<{
    name: string;
    isDefault: boolean;
  }>;
}

export interface TokenSet {
  name: string;
  raw: Record<string, unknown> | null;
  type: 'Static' | 'Dynamic';
  orderIndex: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  tokenSets?: TokenSet[];
  error?: string;
}

// ==========================================
// GRAPHQL MUTATIONS
// ==========================================

// Create a new token set
const CREATE_TOKEN_SET = gql`
  mutation CreateTokenSet(
    $organization: String!
    $project: String!
    $branch: String
    $input: TokenSetInput!
  ) {
    createTokenSet(
      organization: $organization
      project: $project
      branch: $branch
      input: $input
    ) {
      id
      name
      raw
      type
      orderIndex
      createdAt
    }
  }
`;

// Update an existing token set
const UPDATE_TOKEN_SET = gql`
  mutation UpdateTokenSet(
    $organization: String!
    $project: String!
    $branch: String
    $input: TokenSetUpdateInput!
  ) {
    updateTokenSet(
      organization: $organization
      project: $project
      branch: $branch
      input: $input
    ) {
      id
      name
      raw
      type
      orderIndex
      updatedAt
    }
  }
`;

// Delete a token set
const DELETE_TOKEN_SET = gql`
  mutation DeleteSet(
    $organization: String!
    $project: String!
    $branch: String!
    $path: String!
  ) {
    deleteSet(
      organization: $organization
      project: $project
      branch: $branch
      path: $path
    ) {
      id
      name
    }
  }
`;

// ==========================================
// CLIENT CREATION
// ==========================================

/**
 * Get the Tokens Studio API key from environment
 */
function getApiKey(): string {
  const key = process.env.FIGMA_ACCESS_TOKEN;
  if (!key) {
    throw new Error('FIGMA_ACCESS_TOKEN is not set in environment variables');
  }
  return key;
}

/**
 * Create a Tokens Studio SDK client
 */
function createClient() {
  const auth = getApiKey();
  return create({
    auth,
    host: 'graphql.prod.tokens.studio',
    secure: true,
  });
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Test connection to Tokens Studio API
 */
export async function testConnection(): Promise<{
  success: boolean;
  organizations?: Organization[];
  error?: string;
}> {
  try {
    const client = createClient();
    const result = await client.query<GetOrgsQuery>({
      query: GetOrgsDocument,
    });

    return {
      success: true,
      organizations: result.data.organizations.data.map((org) => ({
        id: org.id,
        name: org.name,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all organizations the user has access to
 */
export async function getOrganizations(): Promise<Organization[]> {
  const client = createClient();
  const result = await client.query<GetOrgsQuery>({
    query: GetOrgsDocument,
  });

  return result.data.organizations.data.map((org) => ({
    id: org.id,
    name: org.name,
  }));
}

/**
 * Get all projects in an organization
 */
export async function getProjects(orgId: string): Promise<Project[]> {
  const client = createClient();
  const result = await client.query<GetProjectsQuery>({
    query: GetProjectsDocument,
    variables: { org: orgId },
  });

  return result.data.projects.data.map((project) => ({
    id: project.id,
    name: project.name,
    organizationId: project.organizationId,
    branches: project.branches.data.map((branch) => ({
      name: branch.name,
      isDefault: branch.isDefault,
    })),
  }));
}

/**
 * Get all token sets from a project branch
 */
export async function getTokenSets(
  orgId: string,
  projectId: string,
  branch = 'main'
): Promise<TokenSet[]> {
  const client = createClient();
  const allTokenSets: TokenSet[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await client.query<GetTokenSetsQuery>({
      query: GetTokenSetsDocument,
      variables: {
        org: orgId,
        project: projectId,
        branch,
        page,
      },
    });

    const tokenSets = result.data.project.branch.tokenSets;
    allTokenSets.push(
      ...tokenSets.data.map((set) => ({
        name: set.name,
        raw: set.raw as Record<string, unknown> | null,
        type: set.type as 'Static' | 'Dynamic',
        orderIndex: set.orderIndex,
      }))
    );

    hasMore = page < tokenSets.totalPages;
    page++;
  }

  return allTokenSets;
}

/**
 * Create a new token set in Tokens Studio
 */
export async function createTokenSet(
  orgId: string,
  projectId: string,
  name: string,
  tokens: Record<string, unknown>,
  branch = 'main',
  orderIndex = 0
): Promise<TokenSet> {
  const client = createClient();

  const result = await client.mutate({
    mutation: CREATE_TOKEN_SET,
    variables: {
      organization: orgId,
      project: projectId,
      branch,
      input: {
        path: name,
        raw: tokens,
        type: 'Static',
        orderIndex,
      },
    },
  });

  const created = result.data.createTokenSet;
  return {
    name: created.name,
    raw: created.raw,
    type: created.type,
    orderIndex: created.orderIndex,
  };
}

/**
 * Update an existing token set in Tokens Studio
 */
export async function updateTokenSet(
  orgId: string,
  projectId: string,
  name: string,
  tokens: Record<string, unknown>,
  branch = 'main'
): Promise<TokenSet> {
  const client = createClient();

  const result = await client.mutate({
    mutation: UPDATE_TOKEN_SET,
    variables: {
      organization: orgId,
      project: projectId,
      branch,
      input: {
        path: name,
        raw: tokens,
      },
    },
  });

  const updated = result.data.updateTokenSet;
  return {
    name: updated.name,
    raw: updated.raw,
    type: updated.type,
    orderIndex: updated.orderIndex,
  };
}

/**
 * Delete a token set from Tokens Studio
 */
export async function deleteTokenSet(
  orgId: string,
  projectId: string,
  name: string,
  branch = 'main'
): Promise<boolean> {
  const client = createClient();

  await client.mutate({
    mutation: DELETE_TOKEN_SET,
    variables: {
      organization: orgId,
      project: projectId,
      branch,
      path: name,
    },
  });

  return true;
}

/**
 * Push local tokens to Tokens Studio
 * Creates or updates token sets based on the local tokens structure
 */
export async function pushTokens(
  orgId: string,
  projectId: string,
  tokens: Record<string, unknown>,
  branch = 'main'
): Promise<SyncResult> {
  try {
    const client = createClient();

    // Get existing token sets
    const existingSets = await getTokenSets(orgId, projectId, branch);
    const existingNames = new Set(existingSets.map((s) => s.name));

    const results: TokenSet[] = [];
    let orderIndex = 0;

    // Process each top-level key as a token set
    for (const [setName, setTokens] of Object.entries(tokens)) {
      if (typeof setTokens !== 'object' || setTokens === null) continue;

      if (existingNames.has(setName)) {
        // Update existing set
        const updated = await updateTokenSet(
          orgId,
          projectId,
          setName,
          setTokens as Record<string, unknown>,
          branch
        );
        results.push(updated);
      } else {
        // Create new set
        const created = await createTokenSet(
          orgId,
          projectId,
          setName,
          setTokens as Record<string, unknown>,
          branch,
          orderIndex
        );
        results.push(created);
      }
      orderIndex++;
    }

    return {
      success: true,
      message: `Successfully pushed ${results.length} token sets to Tokens Studio`,
      tokenSets: results,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to push tokens',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pull tokens from Tokens Studio to local format
 * Returns tokens in the format used by figma-tokens.json
 */
export async function pullTokens(
  orgId: string,
  projectId: string,
  branch = 'main'
): Promise<SyncResult & { tokens?: Record<string, unknown> }> {
  try {
    const tokenSets = await getTokenSets(orgId, projectId, branch);

    // Convert to local format (same structure as figma-tokens.json)
    const tokens: Record<string, unknown> = {};
    for (const set of tokenSets) {
      if (set.raw) {
        tokens[set.name] = set.raw;
      }
    }

    return {
      success: true,
      message: `Successfully pulled ${tokenSets.length} token sets from Tokens Studio`,
      tokenSets,
      tokens,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to pull tokens',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  testConnection,
  getOrganizations,
  getProjects,
  getTokenSets,
  createTokenSet,
  updateTokenSet,
  deleteTokenSet,
  pushTokens,
  pullTokens,
};
