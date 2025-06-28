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
          let: { 
            violationCode: { 
              $convert: {
                input: '$VIOLATION_CODE',
                to: 'int',
                onError: null,
                onNull: null
              }
            }
          },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $ne: ['$$violationCode', null] },
                    { $eq: ['$VALUE_CODE', '$$violationCode'] },
                    { $eq: ['$VALUE_TYPE', 'VIOLATION_CODE'] }
                  ]
                }
              }
            }
          ],
          as: 'violationDetails'
        }
      },
      {
        $lookup: {
          from: 'ref_code_values',
          let: { 
            contaminantCode: { 
              $convert: {
                input: '$CONTAMINANT_CODE',
                to: 'int',
                onError: null,
                onNull: null
              }
            }
          },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $ne: ['$$contaminantCode', null] },
                    { $eq: ['$VALUE_CODE', '$$contaminantCode'] },
                    { $eq: ['$VALUE_TYPE', 'CONTAMINANT_CODE'] }
                  ]
                }
              }
            }
          ],
          as: 'contaminantDetails'
        }
      },
      {
        $addFields: {
          VIOLATION_NAME: { 
            $ifNull: [
              { $arrayElemAt: ['$violationDetails.VALUE_DESCRIPTION', 0] },
              'Unknown violation type'
            ]
          },
          CONTAMINANT_NAME: { 
            $ifNull: [
              { $arrayElemAt: ['$contaminantDetails.VALUE_DESCRIPTION', 0] },
              'Unknown contaminant'
            ]
          }
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