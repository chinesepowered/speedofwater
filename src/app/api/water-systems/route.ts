import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('speedofwater');
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ waterSystems: [] });
    }

    const waterSystems = await db
      .collection('pub_water_systems')
      .find({
        $or: [
          { PWS_NAME: { $regex: query, $options: 'i' } },
          { PWSID: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(20)
      .toArray();

    return NextResponse.json({ waterSystems });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch water systems' }, { status: 500 });
  }
} 