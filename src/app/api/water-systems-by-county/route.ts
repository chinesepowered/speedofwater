import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('speedofwater');
    const { searchParams } = new URL(request.url);
    const countyName = searchParams.get('name');

    console.log(`[API LOG] Received county search for: "${countyName}"`);

    if (!countyName) {
      return NextResponse.json({ error: 'County name is required' }, { status: 400 });
    }

    // --- DIAGNOSTIC STEP ---
    // Find ONE sample document to inspect its structure
    const sampleDoc = await db.collection('geographic_areas').findOne({ 
      COUNTY_SERVED: { $regex: countyName, $options: 'i' } 
    });
    console.log(`[API DIAGNOSTIC for ${countyName}] Sample document found:`, JSON.stringify(sampleDoc, null, 2));
    // --- END DIAGNOSTIC STEP ---

    // Find all PWSIDs for the given county and join with their names
    const waterSystems = await db.collection('geographic_areas').aggregate([
      { $match: { COUNTY_SERVED: { $regex: `^${countyName}$`, $options: 'i' } } },
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