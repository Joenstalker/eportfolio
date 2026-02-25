const mongoose = require('mongoose');
const Venue = require('./models/Venue');

// Default venues to seed
const defaultVenues = [
  { name: 'Main Hall', description: 'Primary auditorium for large events' },
  { name: 'Conference Room A', description: 'Small meeting room for seminars' },
  { name: 'Conference Room B', description: 'Medium-sized conference room' },
  { name: 'Virtual Zoom', description: 'Online venue for remote seminars' },
  { name: 'Hotel Ballroom', description: 'Large venue for special events' },
  { name: 'Science Laboratory', description: 'Hands-on workshop venue' },
  { name: 'Computer Lab', description: 'Technology training venue' },
  { name: 'Library', description: 'Quiet venue for academic seminars' },
  { name: 'Auditorium', description: 'Large presentation hall' },
  { name: 'Outdoor Garden', description: 'Open-air venue for events' }
];

const seedVenues = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/faculty_portfolio', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check existing venues
    const existingCount = await Venue.countDocuments();
    console.log(`📊 Found ${existingCount} existing venues`);

    if (existingCount > 0) {
      const existingVenues = await Venue.find().limit(5);
      console.log('📋 Sample existing venues:');
      existingVenues.forEach(venue => {
        console.log(`  - ${venue.name}: ${venue.description || 'No description'}`);
      });
      console.log('ℹ️ Skipping seed - venues already exist');
      mongoose.connection.close();
      return;
    }

    // Insert default venues
    const insertedVenues = await Venue.insertMany(defaultVenues);
    console.log(`✅ Successfully seeded ${insertedVenues.length} venues:`);
    insertedVenues.forEach(venue => {
      console.log(`  - ${venue.name}: ${venue.description || 'No description'}`);
    });

    // Verify insertion
    const finalCount = await Venue.countDocuments();
    console.log(`📊 Final venue count: ${finalCount}`);

    // Close connection
    mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding venues:', error);
    process.exit(1);
  }
};

// Run the seed function
seedVenues();
