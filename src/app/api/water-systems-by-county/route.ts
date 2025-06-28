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

    // Find all PWSIDs for the given county, join with their names, and get violation counts
    const waterSystems = await db.collection('geographic_areas').aggregate([
      { 
        $match: { 
          COUNTY_SERVED: { $regex: `^${countyName}$`, $options: 'i' },
          PWSID: { $exists: true, $ne: null, $ne: '' }
        } 
      },
      {
        $lookup: {
          from: 'pub_water_systems',
          localField: 'PWSID',
          foreignField: 'PWSID',
          as: 'systemDetails'
        }
      },
      {
        $unwind: { path: '$systemDetails', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'violations_enforcement',
          localField: 'PWSID',
          foreignField: 'PWSID',
          as: 'violations'
        }
      },
      {
        $addFields: {
          activeViolations: {
            $size: {
              $filter: {
                input: '$violations',
                cond: {
                  $in: ['$$this.VIOLATION_STATUS', ['Unaddressed', 'Addressed']]
                }
              }
            }
          },
          enforcementActions: {
            $size: {
              $filter: {
                input: '$violations',
                cond: {
                  $and: [
                    { $eq: ['$$this.VIOLATION_STATUS', null] },
                    { $ne: ['$$this.ENFORCEMENT_ACTION_TYPE_CODE', null] }
                  ]
                }
              }
            }
          },
          totalViolations: { $size: '$violations' }
        }
      },
      {
        $project: {
          _id: 0,
          PWSID: '$PWSID',
          PWS_NAME: { $ifNull: ['$systemDetails.PWS_NAME', 'Unknown System'] },
          POPULATION_SERVED_COUNT: { $ifNull: ['$systemDetails.POPULATION_SERVED_COUNT', 0] },
          activeViolations: 1,
          enforcementActions: 1,
          totalViolations: 1
        }
      },
      {
        $sort: { activeViolations: -1, PWS_NAME: 1 }
      }
    ]).toArray();

    return NextResponse.json({ waterSystems });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch water systems for this county' }, { status: 500 });
  }
} 