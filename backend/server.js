// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const csv = require('csv-parser');
// const bodyParser = require('body-parser');
// const path = require('path');

// const app = express();
// const PORT = 5000;
// const USERS_CSV = path.join(__dirname, 'Users.csv');

// app.use(cors());
// app.use(bodyParser.json());

// // Utility to load all users
// async function readUsers() {
//   return new Promise((resolve, reject) => {
//     const arr = [];
//     fs.createReadStream(USERS_CSV)
//       .pipe(csv())
//       .on('data', row => arr.push(row))
//       .on('end', () => resolve(arr))
//       .on('error', err => reject(err));
//   });
// }

// // POST /login — returns user with matches
// app.post('/login', async (req, res) => {
//   const { email } = req.body;
//   const users = await readUsers();
//   const user = users.find(u => u.email === email);
//   if (!user) return res.status(404).json({ error: 'User not found' });

//   const interestList = (user['Interest/expertise'] || '')
//     .toLowerCase()
//     .split(',')
//     .map(s => s.trim());

//   const matches = users.filter(u =>
//     u.email !== email &&
//     interestList.some(i => (u['Interest/expertise'] || '').toLowerCase().includes(i))
//   );

//   return res.json({ user, matches });
// });

// // POST /getProfiles — match endpoint
// app.post('/getProfiles', async (req, res) => {
//   const { interests, email } = req.body;
//   const interestList = (interests || '')
//     .toLowerCase()
//     .split(',')
//     .map(s => s.trim());

//   const users = await readUsers();

//   const matches = users.filter(u =>
//     u.email !== email &&
//     interestList.some(i => (u['Interest/expertise'] || '').toLowerCase().includes(i))
//   );

//   return res.json({ profiles: matches });
// });

// // 🧠 Log count of users on startup
// readUsers()
//   .then(data => {
//     console.log(`✅ Loaded ${data.length} entries from Users.csv`);
//   })
//   .catch(err => {
//     console.error('❌ Failed to load users on startup:', err);
//   });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
// // POST /connect — saves a new connection to connections.csv
// app.post('/connect', (req, res) => {
//   const { userEmail, target } = req.body;
//   if (!userEmail || !target?.email) {
//     return res.status(400).json({ error: 'Missing userEmail or target email' });
//   }

//   const filePath = path.join(__dirname, 'connections.csv');
//   const entry = `${userEmail},${target.email}\n`;

//   fs.appendFile(filePath, entry, err => {
//     if (err) {
//       console.error('Error writing to connections.csv:', err);
//       return res.status(500).json({ error: 'Failed to save connection' });
//     }
//     res.json({ success: true });
//   });
// });

// // POST /connections — returns a list of profiles connected to current user
// app.post('/connections', async (req, res) => {
//   const { email } = req.body;
//   if (!email) return res.status(400).json({ error: 'Email is required' });

//   const connectionsPath = path.join(__dirname, 'connections.csv');
//   const usersPath = path.join(__dirname, 'Users.csv');

//   try {
//     const connectionsData = fs.existsSync(connectionsPath)
//       ? fs.readFileSync(connectionsPath, 'utf8')
//       : '';
//     const usersData = fs.existsSync(usersPath)
//       ? fs.readFileSync(usersPath, 'utf8')
//       : '';

//     const connectedEmails = connectionsData
//       .split('\n')
//       .filter(line => line.trim() !== '')
//       .map(line => line.split(','))
//       .filter(pair => pair[0] === email)
//       .map(pair => pair[1]);

//     const allUsers = usersData
//       .split('\n')
//       .filter((line, idx) => idx > 0 && line.trim() !== '')
//       .map(line => {
//         const [Name, email, , , , , Type, interest] = line.split(',');
//         return { Name, email, Type, 'Interest/expertise': interest };
//       });

//     const matched = allUsers.filter(user => connectedEmails.includes(user.email));

//     res.json({ connections: matched });
//   } catch (error) {
//     console.error('Error fetching connections:', error);
//     res.status(500).json({ error: 'Failed to load connections' });
//   }
// });

const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('json2csv');

const app = express();
const PORT = 5000;

const USERS_CSV = path.join(__dirname, 'Users.csv');
const CONNECTIONS_CSV = path.join(__dirname, 'connections.csv');

app.use(cors());
app.use(express.json());

let users = [];

function loadUsers() {
  users = [];
  fs.createReadStream(USERS_CSV)
    .pipe(csv())
    .on('data', (row) => {
      users.push(row);
    })
    .on('end', () => {
      console.log(`Loaded ${users.length} users from Users.csv`);
    });
}

loadUsers();

app.post('/login', (req, res) => {
  const { name, email } = req.body;
  const user = users.find(
    u => u.Name.toLowerCase() === name.toLowerCase() && u.email.toLowerCase() === email.toLowerCase()
  );
  if (user) return res.json({ success: true, user });
  return res.json({ success: false, message: 'User not found' });
});

app.post('/signup', (req, res) => {
  const newUser = req.body;
  users.push(newUser);

  const csvData = parse([newUser], { header: false });
  fs.appendFileSync(USERS_CSV, '\n' + csvData);

  return res.json({ success: true });
});

app.post('/getProfiles', (req, res) => {
  const { subject, email } = req.body;
  const currentUser = users.find(u => u.email === email);
  if (!currentUser) return res.json({ profiles: [] });

  const matches = users
    .filter(u => u.email !== email)
    .filter(u => (u['Interest/expertise'] || '').toLowerCase().includes(subject.toLowerCase()))
    .sort((a, b) => (parseFloat(b.Ratings) || 0) - (parseFloat(a.Ratings) || 0));

  return res.json({ profiles: matches });
});

app.post('/connect', (req, res) => {
  const { userEmail, targetEmail } = req.body;

  const connection = { userEmail, targetEmail };
  let existing = [];

  if (fs.existsSync(CONNECTIONS_CSV)) {
    const data = fs.readFileSync(CONNECTIONS_CSV, 'utf8');
    existing = data.split('\n').slice(1).map(line => {
      const [userEmail, targetEmail] = line.split(',');
      return { userEmail, targetEmail };
    });
  }

  const alreadyConnected = existing.some(
    entry => entry.userEmail === userEmail && entry.targetEmail === targetEmail
  );

  if (!alreadyConnected) {
    fs.appendFileSync(CONNECTIONS_CSV, `\n${userEmail},${targetEmail}`);
  }

  res.json({ success: true });
});

app.post('/connections', (req, res) => {
  const { email } = req.body;
  const result = [];

  if (!fs.existsSync(CONNECTIONS_CSV)) {
    return res.json({ connections: [] });
  }

  const lines = fs.readFileSync(CONNECTIONS_CSV, 'utf8').split('\n').slice(1);
  const targets = lines
    .map(line => line.split(','))
    .filter(([userEmail]) => userEmail === email)
    .map(([, targetEmail]) => targetEmail.trim());

  const connections = users.filter(u => targets.includes(u.email));
  return res.json({ connections });
});

app.post('/removeConnection', (req, res) => {
  const { userEmail, targetEmail } = req.body;

  if (!fs.existsSync(CONNECTIONS_CSV)) {
    return res.json({ success: false });
  }

  const lines = fs.readFileSync(CONNECTIONS_CSV, 'utf8').split('\n');
  const filtered = lines.filter(line => {
    const [user, target] = line.split(',');
    return !(user === userEmail && target === targetEmail);
  });

  fs.writeFileSync(CONNECTIONS_CSV, filtered.join('\n'));
  return res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
