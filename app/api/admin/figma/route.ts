import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-enhanced';
import figma, { testConnection, getCurrentUser, getTeamProjects, getProjectFiles, getFile, getFileStyles, getFileComponents, getFileVariables } from '@/lib/figma';
import fs from 'fs/promises';
import path from 'path';

/**
 * Figma API Admin Endpoint
 *
 * GET /api/admin/figma?action=<action>&...params
 *
 * Actions:
 * - test: Test Figma API connection
 * - user: Get current user info
 * - projects: Get team projects (requires teamId)
 * - files: Get project files (requires projectId)
 * - file: Get file details (requires fileKey)
 * - styles: Get file styles (requires fileKey)
 * - components: Get file components (requires fileKey)
 * - variables: Get file variables (requires fileKey)
 * - tokens: Get local design tokens file
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin permission
    await requirePermission('admin:access');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';

    switch (action) {
      case 'test': {
        const result = await testConnection();
        return NextResponse.json(result);
      }

      case 'user': {
        const user = await getCurrentUser();
        return NextResponse.json({ success: true, user });
      }

      case 'projects': {
        const teamId = searchParams.get('teamId');
        if (!teamId) {
          return NextResponse.json(
            { error: 'teamId is required' },
            { status: 400 }
          );
        }
        const projects = await getTeamProjects(teamId);
        return NextResponse.json({ success: true, projects });
      }

      case 'files': {
        const projectId = searchParams.get('projectId');
        if (!projectId) {
          return NextResponse.json(
            { error: 'projectId is required' },
            { status: 400 }
          );
        }
        const files = await getProjectFiles(projectId);
        return NextResponse.json({ success: true, files });
      }

      case 'file': {
        const fileKey = searchParams.get('fileKey');
        if (!fileKey) {
          return NextResponse.json(
            { error: 'fileKey is required' },
            { status: 400 }
          );
        }
        const file = await getFile(fileKey);
        return NextResponse.json({ success: true, file });
      }

      case 'styles': {
        const fileKey = searchParams.get('fileKey');
        if (!fileKey) {
          return NextResponse.json(
            { error: 'fileKey is required' },
            { status: 400 }
          );
        }
        const styles = await getFileStyles(fileKey);
        return NextResponse.json({ success: true, styles });
      }

      case 'components': {
        const fileKey = searchParams.get('fileKey');
        if (!fileKey) {
          return NextResponse.json(
            { error: 'fileKey is required' },
            { status: 400 }
          );
        }
        const components = await getFileComponents(fileKey);
        return NextResponse.json({ success: true, components });
      }

      case 'variables': {
        const fileKey = searchParams.get('fileKey');
        if (!fileKey) {
          return NextResponse.json(
            { error: 'fileKey is required' },
            { status: 400 }
          );
        }
        const variables = await getFileVariables(fileKey);
        return NextResponse.json({ success: true, variables });
      }

      case 'tokens': {
        // Read local design tokens file
        const tokensPath = path.join(process.cwd(), 'design', 'figma-tokens.json');
        try {
          const tokensContent = await fs.readFile(tokensPath, 'utf-8');
          const tokens = JSON.parse(tokensContent);
          return NextResponse.json({ success: true, tokens });
        } catch (error) {
          return NextResponse.json(
            { error: 'Could not read design tokens file', details: String(error) },
            { status: 500 }
          );
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Figma API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/figma
 *
 * Actions:
 * - sync-tokens: Sync design tokens to a Figma file
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin permission
    await requirePermission('admin:access');

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync-tokens': {
        const { fileKey } = body;
        if (!fileKey) {
          return NextResponse.json(
            { error: 'fileKey is required' },
            { status: 400 }
          );
        }

        // Read local design tokens
        const tokensPath = path.join(process.cwd(), 'design', 'figma-tokens.json');
        const tokensContent = await fs.readFile(tokensPath, 'utf-8');
        const tokens = JSON.parse(tokensContent);

        // Convert to Figma variables format
        const variables = figma.convertTokensToFigmaVariables(tokens['Full Uproar']);

        // Note: Actually publishing variables requires specific Figma file permissions
        // and the file must be in a team with the Variables feature enabled
        // For now, return the converted variables for review
        return NextResponse.json({
          success: true,
          message: 'Tokens converted successfully. Review before publishing.',
          variableCount: variables.length,
          variables: variables.slice(0, 20), // Preview first 20
          note: 'Full sync requires Figma team/enterprise plan with Variables feature',
        });
      }

      case 'update-tokens-file': {
        // Update local tokens file with new values
        const { tokens } = body;
        if (!tokens) {
          return NextResponse.json(
            { error: 'tokens data is required' },
            { status: 400 }
          );
        }

        const tokensPath = path.join(process.cwd(), 'design', 'figma-tokens.json');
        await fs.writeFile(tokensPath, JSON.stringify(tokens, null, 2));

        return NextResponse.json({
          success: true,
          message: 'Design tokens file updated successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Figma API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
