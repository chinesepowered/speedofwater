import clientPromise from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pwsid: string }> }
) {
  try {
    const { pwsid } = await params;
    const client = await clientPromise;
    const db = client.db('speedofwater');

    const violations = await db.collection('violations_enforcement').aggregate([
      { $match: { PWSID: pwsid } },
      {
        $lookup: {
          from: 'ref_code_values',
          localField: 'VIOLATION_CODE',
          foreignField: 'CODE_VALUE',
          as: 'violationDetails'
        }
      },
      {
        $lookup: {
          from: 'ref_code_values',
          localField: 'CONTAMINANT_CODE',
          foreignField: 'CODE_VALUE',
          as: 'contaminantDetails'
        }
      },
      {
        $unwind: { path: "$violationDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: "$contaminantDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $addFields: {
          VIOLATION_NAME: '$violationDetails.CODE_DESCRIPTION',
          CONTAMINANT_NAME: '$contaminantDetails.CODE_DESCRIPTION',
        }
      },
      {
        $sort: { NON_COMPL_PER_BEGIN_DATE: -1 }
      }
    ]).toArray();

    return NextResponse.json({ violations });
  } catch (e) {
    console.error('Error fetching violations:', e);
    return NextResponse.json({ error: 'Unable to fetch violations' }, { status: 500 });
  }
} 