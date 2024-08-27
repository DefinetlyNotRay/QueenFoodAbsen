const express = require('express');
const mysql = require('mysql2');
const bodyparser = require('body-parser')
const cors = require('cors')
const jwt = require('jsonwebtoken');

const app = express()
const port = 5000

app.use(bodyparser.json());
app.use(cors({origin: true, credentials: true}));
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
  

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });