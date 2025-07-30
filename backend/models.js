const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Name: String,
  Type: String,
  Subject: [String], // allow comma-separated multiple subjects
  Location: String,
  Ratings: Number
});

module.exports = mongoose.model('User', userSchema);
