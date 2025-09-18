import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'FullUproar';
const REPO_NAME = 'full-uproar-site';

// GET all issues from GitHub
export async function GET(req: NextRequest) {
  try {
    await requirePermission('admin', 'read');
    
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || 'open'; // open, closed, all
    
    // Fetch issues from GitHub API
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=${state}&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Add GitHub token if available for higher rate limits
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const issues = await response.json();
    
    // Format issues for frontend
    const formattedIssues = issues.map((issue: any) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((l: any) => ({
        name: l.name,
        color: l.color
      })),
      assignees: issue.assignees.map((a: any) => a.login),
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      html_url: issue.html_url,
      user: issue.user.login
    }));

    return NextResponse.json({ issues: formattedIssues });
  } catch (error) {
    console.error('[GitHub Issues GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST new issue to GitHub
export async function POST(req: NextRequest) {
  try {
    await requirePermission('admin', 'write');
    
    const body = await req.json();
    const { title, description, labels = [] } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Create issue via GitHub API
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: description || '',
          labels
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const newIssue = await response.json();

    return NextResponse.json({
      success: true,
      issue: {
        id: newIssue.id,
        number: newIssue.number,
        title: newIssue.title,
        body: newIssue.body,
        state: newIssue.state,
        html_url: newIssue.html_url
      }
    });
  } catch (error) {
    console.error('[GitHub Issues POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

// PATCH update issue status
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('admin', 'write');
    
    const body = await req.json();
    const { issueNumber, state } = body;

    if (!issueNumber || !state) {
      return NextResponse.json(
        { error: 'Issue number and state are required' },
        { status: 400 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Update issue via GitHub API
    const response = await fetch(
      `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    const updatedIssue = await response.json();

    return NextResponse.json({
      success: true,
      issue: {
        id: updatedIssue.id,
        number: updatedIssue.number,
        state: updatedIssue.state
      }
    });
  } catch (error) {
    console.error('[GitHub Issues PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}