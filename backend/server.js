const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/community', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/matchUsers', async (req, res) => {
  const subjectQuery = req.body.subject;

  try {
    const users = await User.find({
      Subject: { $elemMatch: { $regex: subjectQuery, $options: 'i' } }
    }).sort({ Ratings: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
