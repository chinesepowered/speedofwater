import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('speedofwater');
    const violationsCollection = db.collection('violations_enforcement');

    // 1. Violations by Type
    const violationsByType = await violationsCollection.aggregate([
      { $group: { _id: '$VIOLATION_NAME', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    // 2. Violations Over Time (by month)
    const violationsByMonth = await violationsCollection.aggregate([
      { 
        $project: { 
          month: { $month: { $toDate: "$COMPL_PER_BEGIN_DATE" } },
          year: { $year: { $toDate: "$COMPL_PER_BEGIN_DATE" } }
        }
      },
      { $group: { _id: { year: "$year", month: "$month" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]).toArray();

    // 3. Systems with Most Violations
    const topSystems = await violationsCollection.aggregate([
      { $group: { _id: '$PWS_NAME', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    return NextResponse.json({
      violationsByType,
      violationsByMonth,
      topSystems,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch regulatory data' }, { status: 500 });
  }
} 