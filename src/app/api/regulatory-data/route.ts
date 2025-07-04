import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('speedofwater');
    const violationsCollection = db.collection('violations_enforcement');
    const systemsCollection = db.collection('pub_water_systems');

    // Get total counts
    const totalSystems = await systemsCollection.countDocuments();
    const totalViolations = await violationsCollection.countDocuments();
    
    // Count active violations using proper logic
    const activeViolations = await violationsCollection.countDocuments({
      $or: [
        { VIOLATION_STATUS: { $in: ['Unaddressed', 'Addressed'] } },
        { NON_COMPL_PER_END_DATE: null }
      ]
    });

    // Get total population served
    const populationResult = await systemsCollection.aggregate([
      { $group: { _id: null, total: { $sum: '$POPULATION_SERVED_COUNT' } } }
    ]).toArray();
    const totalPopulation = populationResult[0]?.total || 0;

    // 1. Violations by Type (optimized to prevent memory issues)
    const violationsByType = await violationsCollection.aggregate([
      { $sample: { size: 10000 } }, // Sample to prevent memory issues
      {
        $group: { 
          _id: '$VIOLATION_CATEGORY_CODE', 
          count: { $sum: 1 } 
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          type: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'MCL'] }, then: 'Max Contaminant Level' },
                { case: { $eq: ['$_id', 'MR'] }, then: 'Monitoring & Reporting' },
                { case: { $eq: ['$_id', 'TT'] }, then: 'Treatment Technique' },
                { case: { $eq: ['$_id', 'MON'] }, then: 'Monitoring' },
                { case: { $eq: ['$_id', 'RPT'] }, then: 'Reporting' },
                { case: { $eq: ['$_id', 'MRDL'] }, then: 'Disinfectant Level' }
              ],
              default: { $ifNull: ['$_id', 'Other'] }
            }
          },
          count: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ['$count', 10000] }, 100] }, 1] }
        }
      }
    ]).toArray();

    // 2. Violations Over Time (by month) - Last 12 months with real data
    const currentDate = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);
    
    const violationsByMonth = await violationsCollection.aggregate([
      { 
        $addFields: {
          dateObj: { $dateFromString: { dateString: '$NON_COMPL_PER_BEGIN_DATE', onError: null } }
        }
      },
      { 
        $match: { 
          dateObj: { 
            $ne: null,
            $gte: twelveMonthsAgo
          } 
        } 
      },
      { 
        $group: { 
          _id: { 
            year: { $year: '$dateObj' }, 
            month: { $month: '$dateObj' } 
          }, 
          violations: { $sum: 1 },
          uniqueSystems: { $addToSet: '$PWSID' }
        } 
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
      {
        $project: {
          month: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          violations: 1,
          systems: { $size: '$uniqueSystems' } // Real count of unique systems with violations
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();

    // 3. Systems with Most Violations
    const topViolators = await violationsCollection.aggregate([
      { $group: { _id: { pwsid: '$PWSID', name: '$PWS_NAME' }, violations: { $sum: 1 } } },
      { $sort: { violations: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'pub_water_systems',
          localField: '_id.pwsid',
          foreignField: 'PWSID',
          as: 'systemDetails'
        }
      },
      {
        $project: {
          pwsid: '$_id.pwsid',
          name: { $ifNull: [{ $arrayElemAt: ['$systemDetails.PWS_NAME', 0] }, '$_id.name'] },
          violations: 1,
          population: { $ifNull: [{ $arrayElemAt: ['$systemDetails.POPULATION_SERVED_COUNT', 0] }, 0] }
        }
      }
    ]).toArray();

    // Calculate real compliance rate based on systems with no active violations
    const systemsWithActiveViolations = await violationsCollection.aggregate([
      {
        $match: {
          $or: [
            { VIOLATION_STATUS: { $in: ['Unaddressed', 'Addressed'] } },
            { NON_COMPL_PER_END_DATE: null }
          ]
        }
      },
      { $group: { _id: '$PWSID' } },
      { $count: 'count' }
    ]).toArray();
    
    const nonCompliantSystems = systemsWithActiveViolations[0]?.count || 0;
    const complianceRate = totalSystems > 0 ? Math.round(((totalSystems - nonCompliantSystems) / totalSystems) * 100) : 100;
    
    // Calculate real risk score based on health-based violations
    const healthBasedViolations = await violationsCollection.countDocuments({
      $and: [
        {
          $or: [
            { VIOLATION_STATUS: { $in: ['Unaddressed', 'Addressed'] } },
            { NON_COMPL_PER_END_DATE: null }
          ]
        },
        { IS_HEALTH_BASED_IND: 'Y' }
      ]
    });
    
    const riskScore = activeViolations > 0 ? Math.min(Math.round((healthBasedViolations / activeViolations) * 100), 100) : 0;

    return NextResponse.json({
      totalSystems,
      totalViolations,
      totalPopulation,
      activeViolations,
      violationsByType,
      violationsByMonth,
      topViolators,
      complianceRate,
      riskScore
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to fetch regulatory data' }, { status: 500 });
  }
} 