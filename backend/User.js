const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  type: String,
  subject: [String],
  location: String,
  ratings: Number,
});

module.exports = mongoose.model("User", userSchema);
