import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get deployment info from Vercel environment variables
    const deploymentData = {
      sha: (process.env.VERCEL_GIT_COMMIT_SHA || 'local').substring(0, 8),
      branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
      deployedAt: process.env.VERCEL_GIT_COMMIT_DATE || new Date().toISOString(),
      url: process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION || 'local',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(deploymentData);
  } catch (error) {
    console.error('Error getting deployment info:', error);
    return NextResponse.json({
      sha: 'unknown',
      branch: 'unknown', 
      deployedAt: new Date().toISOString(),
      url: 'unknown',
      region: 'unknown'
    });
  }
}