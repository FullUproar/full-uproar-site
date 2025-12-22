import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-enhanced';
import tokensStudio from '@/lib/tokens-studio';
import fs from 'fs/promises';
import path from 'path';

/**
 * Tokens Studio API Admin Endpoint
 *
 * GET /api/admin/tokens-studio?action=<action>&...params
 *
 * Actions:
 * - test: Test Tokens Studio API connection
 * - orgs: Get all organizations
 * - projects: Get projects in an organization (requires orgId)
 * - token-sets: Get token sets from a project (requires orgId, projectId)
 * - pull: Pull tokens from Tokens Studio (requires orgId, projectId)
 *
 * POST /api/admin/tokens-studio
 *
 * Actions:
 * - push: Push local tokens to Tokens Studio
 * - sync-from-studio: Pull tokens from Tokens Studio and save locally
 */

export async function GET(request: NextRequest) {
  try {
    // Require admin permission
    await requirePermission('admin:access');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';

    switch (action) {
      case 'test': {
        const result = await tokensStudio.testConnection();
        return NextResponse.json(result);
      }

      case 'orgs': {
        const organizations = await tokensStudio.getOrganizations();
        return NextResponse.json({ success: true, organizations });
      }

      case 'projects': {
        const orgId = searchParams.get('orgId');
        if (!orgId) {
          return NextResponse.json(
            { error: 'orgId is required' },
            { status: 400 }
          );
        }
        const projects = await tokensStudio.getProjects(orgId);
        return NextResponse.json({ success: true, projects });
      }

      case 'token-sets': {
        const orgId = searchParams.get('orgId');
        const projectId = searchParams.get('projectId');
        const branch = searchParams.get('branch') || 'main';

        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        const tokenSets = await tokensStudio.getTokenSets(orgId, projectId, branch);
        return NextResponse.json({ success: true, tokenSets });
      }

      case 'pull': {
        const orgId = searchParams.get('orgId');
        const projectId = searchParams.get('projectId');
        const branch = searchParams.get('branch') || 'main';

        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        const result = await tokensStudio.pullTokens(orgId, projectId, branch);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Tokens Studio API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin permission
    await requirePermission('admin:access');

    const body = await request.json();
    const { action, orgId, projectId, branch = 'main' } = body;

    switch (action) {
      case 'push': {
        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        // Read local design tokens
        const tokensPath = path.join(process.cwd(), 'design', 'figma-tokens.json');
        const tokensContent = await fs.readFile(tokensPath, 'utf-8');
        const tokens = JSON.parse(tokensContent);

        // Push to Tokens Studio
        const result = await tokensStudio.pushTokens(orgId, projectId, tokens, branch);
        return NextResponse.json(result);
      }

      case 'sync-from-studio': {
        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        // Pull from Tokens Studio
        const pullResult = await tokensStudio.pullTokens(orgId, projectId, branch);

        if (!pullResult.success || !pullResult.tokens) {
          return NextResponse.json(pullResult);
        }

        // Save to local file
        const tokensPath = path.join(process.cwd(), 'design', 'figma-tokens.json');
        await fs.writeFile(
          tokensPath,
          JSON.stringify(pullResult.tokens, null, 2)
        );

        return NextResponse.json({
          success: true,
          message: `Synced ${Object.keys(pullResult.tokens).length} token sets from Tokens Studio`,
          tokenSets: pullResult.tokenSets,
        });
      }

      case 'create-set': {
        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        const { name, tokens } = body;
        if (!name || !tokens) {
          return NextResponse.json(
            { error: 'name and tokens are required' },
            { status: 400 }
          );
        }

        const tokenSet = await tokensStudio.createTokenSet(
          orgId,
          projectId,
          name,
          tokens,
          branch
        );

        return NextResponse.json({
          success: true,
          message: `Created token set "${name}"`,
          tokenSet,
        });
      }

      case 'update-set': {
        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        const { name, tokens } = body;
        if (!name || !tokens) {
          return NextResponse.json(
            { error: 'name and tokens are required' },
            { status: 400 }
          );
        }

        const tokenSet = await tokensStudio.updateTokenSet(
          orgId,
          projectId,
          name,
          tokens,
          branch
        );

        return NextResponse.json({
          success: true,
          message: `Updated token set "${name}"`,
          tokenSet,
        });
      }

      case 'delete-set': {
        if (!orgId || !projectId) {
          return NextResponse.json(
            { error: 'orgId and projectId are required' },
            { status: 400 }
          );
        }

        const { name } = body;
        if (!name) {
          return NextResponse.json(
            { error: 'name is required' },
            { status: 400 }
          );
        }

        await tokensStudio.deleteTokenSet(orgId, projectId, name, branch);

        return NextResponse.json({
          success: true,
          message: `Deleted token set "${name}"`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Tokens Studio API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
