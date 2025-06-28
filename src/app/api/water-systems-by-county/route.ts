import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('speedofwater');
    const { searchParams } = new URL(request.url);
    const countyName = searchParams.get('name');

    if (!countyName) {
      return NextResponse.json({ error: 'County name is required' }, { status: 400 });
    }

    // Find all PWSIDs for the given county and join with their names
    const waterSystems = await db.collection('geographic_areas').aggregate([
      { $match: { COUNTY_NAME: countyName.toUpperCase() } },
      {
        $lookup: {
          from: 'pub_water_systems',
          localField: 'PWSID',
          foreignField: 'PWSID',
          as: 'systemDetails'
        }
      },
      {
        $unwind: '$systemDetails'
      },
      {
        $project: {
            _id: 0,
            PWSID: '$PWSID',
            PWS_NAME: '$systemDetails.PWS_NAME'
        }
      }
    ]).toArray();

    return NextResponse.json({ waterSystems });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch water systems for this county' }, { status: 500 });
  }
} 