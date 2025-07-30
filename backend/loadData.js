const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const User = require('./User'); // No longer in models/

mongoose.connect('mongodb://localhost:27017/matchmaker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const results = [];
const filePath = path.join(__dirname, 'Users.csv');

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (data) => {
    // Normalize Subject to array
    const subjectsArray = data.Subject.split(',').map((s) => s.trim().toLowerCase());

    results.push({
      Name: data.Name,
      Type: data.Type,
      Subject: subjectsArray,
      Location: data.Location,
      Rating: parseFloat(data.Rating),
    });
  })
  .on('end', async () => {
    try {
      await User.deleteMany({});
      await User.insertMany(results);
      console.log(`✅ Loaded ${results.length} entries from CSV to MongoDB.`);
      mongoose.connection.close();
    } catch (error) {
      console.error('❌ Error loading data to MongoDB:', error);
    }
  });
