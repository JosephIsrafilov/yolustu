import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = 'c:\\Users\\YUSIF\\.gemini\\antigravity-ide\\brain\\c2ce68bf-6a01-4345-8ee2-82d8aefa2f2b\\modern_sedan_side_1780005046295.png';
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to read car image:', error);
    return new NextResponse('Image not found', { status: 404 });
  }
}
