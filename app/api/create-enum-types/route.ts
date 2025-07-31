import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const results = [];
    
    // Create GameCategory enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "GameCategory" AS ENUM ('GAME', 'MOD', 'EXPANSION');
      `;
      results.push('Created GameCategory enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('GameCategory enum already exists');
      } else {
        results.push(`GameCategory enum error: ${error}`);
      }
    }

    // Create AgeRating enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "AgeRating" AS ENUM ('ALL_AGES', 'ELEVEN_PLUS', 'FOURTEEN_PLUS', 'SIXTEEN_PLUS', 'EIGHTEEN_PLUS', 'TWENTYONE_PLUS');
      `;
      results.push('Created AgeRating enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('AgeRating enum already exists');
      } else {
        results.push(`AgeRating enum error: ${error}`);
      }
    }

    // Create PlayerCount enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "PlayerCount" AS ENUM ('SINGLE', 'TWO', 'TWO_TO_FOUR', 'TWO_TO_SIX', 'THREE_TO_FIVE', 'THREE_TO_SIX', 'FOUR_TO_EIGHT', 'PARTY', 'CUSTOM');
      `;
      results.push('Created PlayerCount enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('PlayerCount enum already exists');
      } else {
        results.push(`PlayerCount enum error: ${error}`);
      }
    }

    // Create PlayTime enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "PlayTime" AS ENUM ('QUICK', 'SHORT', 'MEDIUM', 'LONG', 'EXTENDED', 'VARIABLE');
      `;
      results.push('Created PlayTime enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('PlayTime enum already exists');
      } else {
        results.push(`PlayTime enum error: ${error}`);
      }
    }

    // Create MerchCategory enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "MerchCategory" AS ENUM ('APPAREL', 'ACCESSORIES', 'HOME_GOODS', 'COLLECTIBLES', 'STICKERS', 'PRINTS', 'OTHER');
      `;
      results.push('Created MerchCategory enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('MerchCategory enum already exists');
      } else {
        results.push(`MerchCategory enum error: ${error}`);
      }
    }

    // Create ApparelType enum
    try {
      await prisma.$executeRaw`
        CREATE TYPE "ApparelType" AS ENUM ('T_SHIRT', 'HOODIE', 'TANK_TOP', 'LONG_SLEEVE', 'SWEATSHIRT', 'JACKET', 'HAT', 'OTHER');
      `;
      results.push('Created ApparelType enum type');
    } catch (error: any) {
      if (error?.code === '42710') {
        results.push('ApparelType enum already exists');
      } else {
        results.push(`ApparelType enum error: ${error}`);
      }
    }

    // Now try to check what columns exist
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Game' 
      AND column_name IN ('category', 'ageRating', 'playerCount', 'playTime')
      ORDER BY column_name;
    ` as any[];

    return NextResponse.json({
      success: true,
      message: 'Enum types created/verified',
      results,
      existingColumns: columnCheck,
      nextStep: 'Now run the "Fix Game Categories" migration, then "Add Enum Columns"'
    });
  } catch (error) {
    console.error('Enum creation error:', error);
    return NextResponse.json({
      error: 'Failed to create enum types',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}