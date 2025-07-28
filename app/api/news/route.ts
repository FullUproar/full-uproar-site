import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const news = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newsPost = await prisma.newsPost.create({
      data: {
        title: body.title,
        excerpt: body.excerpt,
        content: body.content
      }
    });
    
    return NextResponse.json(newsPost, { status: 201 });
  } catch (error) {
    console.error('Error creating news post:', error);
    return NextResponse.json({ error: 'Failed to create news post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'News post ID is required' }, { status: 400 });
    }
    
    const body = await request.json();
    
    const newsPost = await prisma.newsPost.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        excerpt: body.excerpt,
        content: body.content
      }
    });
    
    return NextResponse.json(newsPost);
  } catch (error) {
    console.error('Error updating news post:', error);
    return NextResponse.json({ error: 'Failed to update news post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'News post ID is required' }, { status: 400 });
    }
    
    await prisma.newsPost.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news post:', error);
    return NextResponse.json({ error: 'Failed to delete news post' }, { status: 500 });
  }
}