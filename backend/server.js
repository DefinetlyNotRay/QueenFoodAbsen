const express = require('express');
const mysql = require('mysql2');
const bodyparser = require('body-parser')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const app = express()
const port = 5000

cloudinary.config({
  cloud_name: 'dezla8wit',
  api_key: '725447651591522',
  api_secret: 'GbF49ob4jdpoZmw3ScT8ZKiSENQ',
});

app.use(bodyparser.json());
app.use(cors({
  origin: '*', // Or specify your React Native app’s URL
  credentials: true
}));
const secretKey = 'asdhasjdhe2y9813h1ui3'; // Replace 'yourSecretKey' with a strong, random key

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '', // Replace with your MySQL password
    database: 'queenfood' // Replace with your MySQL database name
})

db.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL database');
})
app.post('/generate-upload-url', (req, res) => {
  const uploadURL = "Your generated UploadThing URL here"; // Replace this with actual code to generate the URL
  res.json({ uploadURL });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    res.header("Access-Control-Allow-Origin");
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "x-access-token, Origin, X-Requested-With, Content-Type, Accept");
  
    const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).send('Server error');
      }
  
      if (results.length > 0) {
        const user = results[0]; // Extract the first result as the user object
  
        // Now you can create the JWT token using the user object
        const token = jwt.sign({ id: user.id_akun, username: user.username }, secretKey, { expiresIn: '1h' });
  
        // Send the token back to the client
        res.json({ success: true, token, message: 'Login Successful' });
      } else {
        res.json({ success: false, message: 'Invalid username or password' });
      }
    });
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

  
  app.post('/save-data', (req, res) => {
    const { alasanInput, imageLink } = req.body;
  
    if (!alasanInput || !imageLink) {
      return res.status(400).json({ error: 'Alasan and Image Link are required' });
    }
  
    const query = 'INSERT INTO alasanTable (alasan, foto) VALUES (?, ?)'; // Update the table and column names as necessary
  
    db.query(query, [alasanInput, imageLink], (err, results) => {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: 'Failed to save to database' });
      }
  
      res.json({ success: true, message: 'Data saved successfully' });
    });
  });
  
  

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });