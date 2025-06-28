import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI_STRING;

if (!uri) {
  console.error('❌ MONGO_URI_STRING environment variable is not set');
  process.exit(1);
}

async function validateData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('speedofwater');
    
    // 1. Check violations collection structure
    console.log('\n📊 VIOLATIONS DATA VALIDATION');
    console.log('=' .repeat(50));
    
    const violationsCollection = db.collection('violations_enforcement');
    const totalViolations = await violationsCollection.countDocuments();
    console.log(`Total violations: ${totalViolations.toLocaleString()}`);
    
    // Check violation status distribution
    const statusDistribution = await violationsCollection.aggregate([
      { $group: { _id: '$VIOLATION_STATUS', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nViolation Status Distribution:');
    statusDistribution.forEach(status => {
      const percentage = ((status.count / totalViolations) * 100).toFixed(1);
      console.log(`  ${status._id || 'NULL'}: ${status.count.toLocaleString()} (${percentage}%)`);
    });
    
    // Check NON_COMPL_PER_END_DATE null values
    const nullEndDates = await violationsCollection.countDocuments({
      NON_COMPL_PER_END_DATE: null
    });
    console.log(`\nViolations with null end dates (unresolved): ${nullEndDates.toLocaleString()}`);
    
    // Active violations using our logic
    const activeViolationsCount = await violationsCollection.countDocuments({
      $or: [
        { VIOLATION_STATUS: { $in: ['Unaddressed', 'Addressed'] } },
        { NON_COMPL_PER_END_DATE: null }
      ]
    });
    console.log(`Active violations (our logic): ${activeViolationsCount.toLocaleString()}`);
    
    // 2. Check systems with violations
    console.log('\n🏭 SYSTEMS WITH VIOLATIONS');
    console.log('=' .repeat(50));
    
    const systemsWithViolations = await violationsCollection.aggregate([
      { $group: { _id: '$PWSID', violations: { $sum: 1 } } },
      { $group: { _id: null, count: { $sum: 1 }, avgViolations: { $avg: '$violations' } } }
    ]).toArray();
    
    if (systemsWithViolations.length > 0) {
      console.log(`Systems with violations: ${systemsWithViolations[0].count.toLocaleString()}`);
      console.log(`Average violations per system: ${systemsWithViolations[0].avgViolations.toFixed(2)}`);
    }
    
    // Top 10 systems with most violations
    const topViolators = await violationsCollection.aggregate([
      { $group: { _id: '$PWSID', violations: { $sum: 1 }, name: { $first: '$PWS_NAME' } } },
      { $sort: { violations: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('\nTop 10 systems with most violations:');
    topViolators.forEach((system, index) => {
      console.log(`  ${index + 1}. ${system.name || system._id}: ${system.violations} violations`);
    });
    
    // 3. Check geographic data integrity
    console.log('\n🗺️  GEOGRAPHIC DATA VALIDATION');
    console.log('=' .repeat(50));
    
    const geoCollection = db.collection('geographic_areas');
    const totalGeoRecords = await geoCollection.countDocuments();
    console.log(`Total geographic records: ${totalGeoRecords.toLocaleString()}`);
    
    // Check county distribution
    const countyDistribution = await geoCollection.aggregate([
      { $group: { _id: '$COUNTY_SERVED', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('\nTop 10 counties by system count:');
    countyDistribution.forEach((county, index) => {
      console.log(`  ${index + 1}. ${county._id}: ${county.count} systems`);
    });
    
    // 4. Check data relationships
    console.log('\n🔗 DATA RELATIONSHIP VALIDATION');
    console.log('=' .repeat(50));
    
    // Check systems that have violations but no geographic data
    const systemsWithoutGeo = await violationsCollection.aggregate([
      { $group: { _id: '$PWSID' } },
      {
        $lookup: {
          from: 'geographic_areas',
          localField: '_id',
          foreignField: 'PWSID',
          as: 'geo'
        }
      },
      { $match: { geo: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    
    const systemsWithoutGeoCount = systemsWithoutGeo[0]?.count || 0;
    console.log(`Systems with violations but no geographic data: ${systemsWithoutGeoCount}`);
    
    // Check systems in geographic data but not in pub_water_systems
    const geoWithoutSystems = await geoCollection.aggregate([
      {
        $lookup: {
          from: 'pub_water_systems',
          localField: 'PWSID',
          foreignField: 'PWSID',
          as: 'system'
        }
      },
      { $match: { system: { $size: 0 } } },
      { $count: 'count' }
    ]).toArray();
    
    const geoWithoutSystemsCount = geoWithoutSystems[0]?.count || 0;
    console.log(`Geographic records without system details: ${geoWithoutSystemsCount}`);
    
    // 5. Sample data quality check
    console.log('\n🔍 SAMPLE DATA QUALITY CHECK');
    console.log('=' .repeat(50));
    
    // Get a sample violation with all fields
    const sampleViolation = await violationsCollection.findOne({
      VIOLATION_STATUS: { $exists: true },
      NON_COMPL_PER_END_DATE: { $exists: true }
    });
    
    if (sampleViolation) {
      console.log('Sample violation record:');
      console.log(`  PWSID: ${sampleViolation.PWSID}`);
      console.log(`  Violation Status: ${sampleViolation.VIOLATION_STATUS}`);
      console.log(`  Start Date: ${sampleViolation.NON_COMPL_PER_BEGIN_DATE}`);
      console.log(`  End Date: ${sampleViolation.NON_COMPL_PER_END_DATE || 'NULL (unresolved)'}`);
      console.log(`  Violation Code: ${sampleViolation.VIOLATION_CODE}`);
      console.log(`  Contaminant Code: ${sampleViolation.CONTAMINANT_CODE}`);
    }
    
    console.log('\n✅ Data validation complete!');
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
  } finally {
    await client.close();
  }
}

validateData().catch(console.error); 