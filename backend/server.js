const express = require('express');
const cron = require('node-cron');
const mysql = require('mysql2/promise'); // Use promise-based version
const bodyparser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

const app = express();
const port = 5000;

cloudinary.config({
  cloud_name: 'dezla8wit',
  api_key: '725447651591522',
  api_secret: 'GbF49ob4jdpoZmw3ScT8ZKiSENQ',
});

app.use(bodyparser.json());
app.use(cors({
  origin: '*',
  credentials: true
}));


const secretKey = 'asdhasjdhe2y9813h1ui3'; // Replace with a strong, random key

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'queenfood' // Replace with your MySQL database name
});


// Function to add "Alpha" entries if missing
const checkAndAddAlphaEntries = async () => {
  try {
    // Get all users
    const [users] = await pool.query('SELECT id_akun FROM users');

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDateString = yesterday.toISOString().split('T')[0];

    for (const user of users) {
      const { id_akun } = user;

      // Check if there's an entry for yesterday
      const [rows] = await pool.query(
        'SELECT * FROM absen WHERE id_akun = ? AND DATE(absen_time) = ?',
        [id_akun, yesterdayDateString]
      );

      if (rows.length === 0) {
        // No entry found for yesterday, insert "Alpha" entry
        await pool.query(
          'INSERT INTO absen (id_akun, absen_time, detail) VALUES (?, NOW(), "Alpha")',
          [id_akun]
        );
        console.log(`Alpha entry added for user ${id_akun} on ${yesterdayDateString}`);
      }
    }
  } catch (error) {
    console.error('Error checking and adding Alpha entries:', error);
  }
};

// Schedule the job to run every day at midnight
cron.schedule('0 0 * * *', checkAndAddAlphaEntries); // Runs at 00:00 (midnight)


app.post('/generate-upload-url', (req, res) => {
  const uploadURL = "Your generated UploadThing URL here"; // Replace with actual code to generate the URL
  res.json({ uploadURL });
});

app.get('/attendance/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM absen WHERE id_akun = ? AND absen_time >= "2024-09-01"',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data.' });
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  res.header("Access-Control-Allow-Origin");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");

  const query = 'SELECT * FROM user WHERE username = ? AND password = ?';

  try {
    const [results] = await pool.query(query, [username, password]);

    if (results.length > 0) {
      const user = results[0]; // Extract the first result as the user object
      const token = jwt.sign({ userId: user.id_akun, username: user.username }, secretKey, { expiresIn: '100h' });
      res.json({ success: true, token, userId: user.id_akun, message: 'Login Successful' });
    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).send('Server error');
  }
});

// Set up Multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Optional: folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// Route to handle image upload
app.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    // The image URL will be available in req.file.path
    const imageUrl = req.file.path;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.post('/save-data', async (req, res) => {
  const { alasanInput, imageLink } = req.body;

  if (!alasanInput || !imageLink) {
    return res.status(400).json({ error: 'Alasan and Image Link are required' });
  }

  const query = 'INSERT INTO alasanTable (alasan, foto) VALUES (?, ?)'; // Update the table and column names as necessary

  try {
    await pool.query(query, [alasanInput, imageLink]);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ error: 'Failed to save to database' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
