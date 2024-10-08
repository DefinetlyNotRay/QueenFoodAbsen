const express = require("express");
const cron = require("node-cron");
const mysql = require("mysql2/promise"); // Use promise-based version
const bodyparser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const { Expo } = require("expo-server-sdk");

const app = express();
const port = 5000;
let expo = new Expo();

app.use(bodyparser.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const secretKey = "asdhasjdhe2y9813h1ui3"; // Replace with a strong, random key

// Create a connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "queenfood", // Replace with your MySQL database name
});

const checkAndAddAlphaEntries = async () => {
  try {
    // Get all users
    const [users] = await pool.query(
      "SELECT id_akun FROM user WHERE level = 'user'"
    );
    console.log("Total users fetched:", users.length);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayDateString = yesterday.toISOString().split("T")[0];

    for (const user of users) {
      const { id_akun } = user;
      console.log(`Checking user: ${id_akun}`);

      // Check if there's an entry for yesterday
      const [rows] = await pool.query(
        "SELECT * FROM absen WHERE id_akun = ? AND DATE(tanggal_absen) = ?",
        [id_akun, yesterdayDateString]
      );

      if (rows.length === 0) {
        console.log(
          `No entry found for user ${id_akun}, adding Alpha entry...`
        );

        const [detail_absen] = await pool.query(
          "INSERT INTO detail_absen (id_akun, foto_diri, foto_etalase, id_izin) VALUES (?, NULL, NULL, NULL)",
          [id_akun]
        );
        console.log("Detail absent insert result:", detail_absen); // Log the result
        const id_detail = detail_absen.insertId; // Get the id of the inserted row
        console.log("Inserted detail ID:", id_detail);

        await pool.query(
          'INSERT INTO absen (id_akun, tanggal_absen, absen_time, pulang_time, detail, id_detail) VALUES (?, ?, NULL, NULL, "Alpha", ?)',
          [id_akun, yesterdayDateString, id_detail]
        );
        console.log(
          `Alpha entry added for user ${id_akun} on ${yesterdayDateString}`
        );
      } else {
        console.log(`User ${id_akun} already has an entry for yesterday.`);
      }
    }
  } catch (error) {
    console.error("Error checking and adding Alpha entries:", error);
  }
};

// Schedule the job to run every day at midnight
cron.schedule("0 0 * * *", checkAndAddAlphaEntries); // Runs at 00:00 (midnight)

app.post("/notifyUser", async (req, res) => {
  const { expoPushToken, status } = req.body; // Get the push token and approval/rejection status

  if (!Expo.isExpoPushToken(expoPushToken)) {
    console.error(`Push token ${expoPushToken} is not a valid Expo push token`);
    return res.status(400).send("Invalid push token");
  }

  // Create the message to send
  const messages = [];
  messages.push({
    to: expoPushToken,
    sound: "default",
    title: "Permission Request Update",
    body: `Your request has been ${status}.`,
    data: { withSome: "data" },
  });

  // Send the notification
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  res.status(200).send("Notification sent");
});
app.post("/expo-push-token", async (req, res) => {
  const { userId, expoPushToken } = req.body;

  console.log("Received userId:", userId);
  console.log("Received expoPushToken:", expoPushToken);

  if (!userId || !expoPushToken) {
    return res.status(400).send("Missing userId or expoPushToken");
  }

  try {
    const connection = await pool.getConnection();
    try {
      // Check for existing token
      let [existingToken] = await connection.query(
        "SELECT * FROM expo_push_tokens WHERE id_akun = ?",
        [userId]
      );
      console.log("Existing token:", existingToken);

      if (existingToken.length > 0) {
        // Update existing token
        await connection.query(
          "UPDATE expo_push_tokens SET expo_push_token = ? WHERE id_akun = ?",
          [expoPushToken, userId]
        );
        console.log("Updated existing token for userId:", userId);
      } else {
        // Insert new token
        await connection.query(
          "INSERT INTO expo_push_tokens (id_akun, expo_push_token) VALUES (?, ?)",
          [userId, expoPushToken]
        );
        console.log("Inserted new token for userId:", userId);
      }
      res.status(200).send("Push token saved successfully.");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error saving push token:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Utility function for sending notifications
const sendNotification = async (expoPushToken, title, body, data) => {
  const messages = [
    {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (let chunk of chunks) {
    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    tickets.push(...ticketChunk);
  }

  console.log("Notification sent:", tickets);
};

app.post("/accept-status/", async (req, res) => {
  const { id_izin, id_akun, today, value } = req.body;

  if (!id_izin || !id_akun) {
    return res.status(400).json({ error: "Missing id_izin or id_akun" });
  }

  try {
    const update = "UPDATE izin SET status = ? WHERE id_izin = ?";
    const values = ["Approved", id_izin];

    const [result] = await pool.query(update, values);

    if (result.affectedRows > 0) {
      const [detailResult] = await pool.query(
        "INSERT INTO detail_absen (id_akun, foto_diri, foto_etalase, lokasi, id_izin) VALUES (?, ?, ?, ?, ?)",
        [id_akun, null, null, null, id_izin]
      );

      const id_detail = detailResult.insertId;

      await pool.query(
        "INSERT INTO absen (id_akun, tanggal_absen, detail, id_detail) VALUES (?, ?, ?, ?)",
        [id_akun, today, value, id_detail]
      );

      console.log(`Status updated to "Approved" for id_izin: ${id_izin}`);

      const [rows] = await pool.query(
        "SELECT expo_push_token FROM expo_push_tokens WHERE id_akun = ?",
        [id_akun]
      );

      if (rows.length === 0) {
        return res.status(404).send("User not found");
      }

      const expoPushToken = rows[0].expo_push_token;
      await sendNotification(
        expoPushToken,
        `Permission Request`,
        `Your permission request has been Approved!`,
        { id_izin }
      );
      return res
        .status(200)
        .json({ message: "Status updated to Accepted successfully" });
    } else {
      return res.status(404).json({ error: "Record not found" });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/reject-status/", async (req, res) => {
  const { id_izin, id_akun } = req.body; // Include id_akun

  if (!id_izin || !id_akun) {
    return res.status(400).json({ error: "Missing id_izin or id_akun" });
  }

  try {
    const update = "UPDATE izin SET status = ? WHERE id_izin = ?";
    const values = ["Rejected", id_izin];

    const [result] = await pool.query(update, values);

    if (result.affectedRows > 0) {
      console.log(`Status updated to "Rejected" for id_izin: ${id_izin}`);

      const [rows] = await pool.query(
        "SELECT expo_push_token FROM expo_push_tokens WHERE id_akun = ?",
        [id_akun]
      );

      if (rows.length === 0) {
        return res.status(404).send("User not found");
      }

      const expoPushToken = rows[0].expo_push_token;
      await sendNotification(
        expoPushToken,
        `Permission Request`,
        `Your permission request has been Rejected!`,
        { id_izin }
      );
      return res
        .status(200)
        .json({ message: "Status updated to Rejected successfully" });
    } else {
      return res.status(404).json({ error: "Record not found" });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/attendance/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM absen WHERE id_akun = ? AND absen_time >= "2024-09-01"',
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance data." });
  }
});

app.get("/table-absen", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT a.id_absen,u.nama_karyawan,a.absen_time,a.pulang_time,a.detail FROM absen a JOIN user u ON a.id_akun = u.id_akun ORDER BY tanggal_absen DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance data." });
  }
});
app.get("/table-izin", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT i.id_izin,i.id_akun, u.nama_karyawan, i.tanggal_izin,i.tipe, i.alasan " +
        "FROM izin i " +
        "JOIN user u ON i.id_akun = u.id_akun " +
        'WHERE DATE(i.tanggal_izin) = CURDATE() AND i.status = "Pending"'
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching izin data:", error);
    res.status(500).json({ error: "Failed to fetch izin data." });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  res.header("Access-Control-Allow-Origin");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, X-Requested-With, Content-Type, Accept"
  );

  const query = "SELECT * FROM user WHERE username = ? AND password = ?";

  try {
    const [results] = await pool.query(query, [username, password]);

    if (results.length > 0) {
      const user = results[0]; // Extract the first result as the user object
      console.log(user.level);
      const token = jwt.sign(
        { userId: user.id_akun, username: user.username, level: user.level },
        secretKey,
        { expiresIn: "100h" }
      );
      res.json({
        success: true,
        token,
        userId: user.id_akun,
        level: user.level,
        message: "Login Successful",
      });
    } else {
      res.json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).send("Server error");
  }
});

app.get("/employee-stats", async (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10); // Get today's date in yyyy-mm-dd format

  const totalEmployeesQuery = "SELECT COUNT(*) AS totalEmployees FROM user";
  const attendedTodayQuery =
    'SELECT COUNT(*) AS attendedToday FROM absen WHERE tanggal_absen = ? AND detail = "Hadir"';
  const izinTodayQuery =
    "SELECT COUNT(*) AS izinToday FROM izin WHERE tanggal_izin = ?";

  try {
    const [totalEmployees] = await pool.query(totalEmployeesQuery);
    const [attendedToday] = await pool.query(attendedTodayQuery, [currentDate]);
    const [izinToday] = await pool.query(izinTodayQuery, [currentDate]);

    res.json({
      totalEmployees: totalEmployees[0].totalEmployees,
      attendedToday: attendedToday[0].attendedToday,
      izinToday: izinToday[0].izinToday,
    });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).send("Server error");
  }
});

app.post("/createAbsen", async (req, res) => {
  const { userId, imageUrl, etalaseUrl, location } = req.body;
  const today = new Date();

  try {
    // Insert data into detail_absen and retrieve the inserted id (id_detail)
    const [detailResult] = await pool.query(
      "INSERT INTO detail_absen (id_akun, foto_diri, foto_etalase, lokasi) VALUES (?, ?, ?, ?)",
      [userId, imageUrl, etalaseUrl, location.address]
    );

    const id_detail = detailResult.insertId; // Get the id of the inserted row

    // Insert data into absen, and let absen_time default to the current timestamp
    await pool.query(
      "INSERT INTO absen (id_akun, tanggal_absen, pulang_time, detail, id_detail) VALUES (?, ?, ?, ?, ?)",
      [userId, today, null, "Hadir", id_detail] // Use null instead of NULL
    );

    res.status(200).json({ message: "Absen created successfully" });
  } catch (error) {
    console.error("Error creating absen:", error);
    res.status(500).json({ error: "Failed to create absen" });
  }
});
app.put("/absen-pulang/:userId", async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split("T")[0]; // Get current date in 'YYYY-MM-DD' format

  try {
    // Check if pulang_time is already updated
    const [rows] = await pool.query(
      `SELECT pulang_time FROM absen WHERE id_akun = ? AND tanggal_absen = ?`,
      [userId, today]
    );

    if (rows.length > 0 && rows[0].pulang_time) {
      return res.status(200).json({ message: "Pulang time already updated." });
    }

    // Proceed with the update if pulang_time is not set
    const [result] = await pool.query(
      `UPDATE absen SET pulang_time = ? WHERE id_akun = ? AND tanggal_absen = ?`,
      [new Date(), userId, today] // Use current timestamp
    );

    console.log("Affected Rows:", result.affectedRows); // Debugging line

    if (result.affectedRows > 0) {
      return res.status(200).json({ message: "Absen Pulang Berhasil." });
    } else {
      return res
        .status(404)
        .json({ message: "Attendance record not found for today." });
    }
  } catch (error) {
    console.error("Error updating absen pulang:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});
app.get("/getTime", async (req, res) => {
  const { userId, date } = req.query;
  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }
  try {
    // Query to check if there is an attendance record for the user on the given date
    const [rows] = await pool.query(
      "SELECT a.absen_time,a.pulang_time,a.id_absen,d.lokasi FROM absen a JOIN detail_absen d ON a.id_detail = d.id_detail WHERE a.id_akun = ? AND a.tanggal_absen = ?",
      [userId, date]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    const { absen_time, pulang_time, id_absen, lokasi } = rows[0];
    console.log(absen_time, pulang_time, id_absen, lokasi);
    return res.status(200).json({ absen_time, pulang_time, lokasi });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});
app.get("/checkAttendance", async (req, res) => {
  const { userId, date } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }

  try {
    // Query to check if there is an attendance record for the user on the given date
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM absen WHERE id_akun = ? AND tanggal_absen = ?",
      [userId, date]
    );

    const hasAttended = rows[0].count > 0; // true if count is greater than 0

    return res.status(200).json({ hasAttended });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/table-izin-karyawan/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id_akun,tanggal_izin ,alasan,tipe,status FROM izin WHERE id_akun = ${userId} ORDER BY id_izin DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance data." });
  }
});
app.get("/table-izin-admin", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_izin, u.nama_karyawan, i.tanggal_izin, i.alasan,i.tipe,i.status ` +
        "FROM izin i " +
        "JOIN user u ON i.id_akun = u.id_akun " +
        ` ORDER BY id_izin DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance data." });
  }
});
app.get("/table-sales", async (req, res) => {
  try {
    // Query to fetch attendance data for the user
    const [rows] = await pool.query("SELECT * FROM user");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: "Failed to fetch sales data." });
  }
});
app.post("/createSales", async (req, res) => {
  const { namaSales, username, password } = req.body;
  try {
    // Insert data into sales
    await pool.query(
      "INSERT INTO user (nama_karyawan, username, password, level) VALUES (?, ?, ?, ?)",
      [namaSales, username, password, "user"]
    );
    res.status(200).json({ message: "Sales created successfully" });
    console.log("Sales created successfully");
  } catch (error) {
    console.error("Error creating sales:", error);
    res.status(500).json({ error: "Failed to create sales" });
  }
});
app.get("/checkHome", async (req, res) => {
  const { userId, date } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }

  try {
    // Query to check if there is an attendance record for the user on the given date
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM absen WHERE id_akun = ? AND tanggal_absen = ? AND pulang_time IS NOT NULL",
      [userId, date]
    );

    const hasAttended = rows[0].count > 0; // true if count is greater than 0

    return res.status(200).json({ hasAttended });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.post("/uploadIzin", async (req, res) => {
  const { userId, date } = req.query;
  const { alasanInput, value } = req.body;

  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }

  try {
    // Insert izin record
    await pool.query(
      "INSERT INTO izin (id_akun, tanggal_izin, alasan, tipe) VALUES (?, ?, ?, ?)",
      [userId, date, alasanInput, value]
    );

    // Fetch expo push token for admin users
    const [rows] = await pool.query(
      "SELECT e.expo_push_token, u.level FROM expo_push_tokens e JOIN user u ON e.id_akun = u.id_akun WHERE u.level = 'admin'"
    );

    if (rows.length === 0) {
      return res.status(404).send("Admin push token not found");
    }

    const expoPushToken = rows[0].expo_push_token;

    // Send notification to admin
    await sendNotification(
      expoPushToken,
      `Permission Request`,
      `A user has requested permission`
    );

    // Respond with success message after notification
    res.status(200).json({ message: "Izin uploaded successfully" });
  } catch (error) {
    console.error("Error uploading izin:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.delete("/deleteSales", async (req, res) => {
  const { userId } = req.query;
  try {
    // Delete data from user table
    await pool.query("DELETE FROM user WHERE id_akun = ?", [userId]);
    res.status(200).json({ message: "Sales deleted successfully" });
  } catch (error) {
    console.error("Error deleting sales:", error);
    res.status(500).json({ error: "Failed to delete sales" });
  }
});

app.post("/editSales", async (req, res) => {
  const { namaSales, username, password, editUserId } = req.body;
  try {
    // Update data in user table
    await pool.query(
      "UPDATE user SET nama_karyawan = ?, username = ?, password = ? WHERE id_akun = ?",
      [namaSales, username, password, editUserId]
    );
    res.status(200).json({ message: "Sales updated successfully" });
  } catch (error) {
    console.error("Error updating sales:", error);
    res.status(500).json({ error: "Failed to update sales" });
  }
});

app.get("/getEditSalesData", async (req, res) => {
  const { userId } = req.query;
  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE id_akun = ?", [
      userId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Failed to fetch user data." });
  }
});

app.get("/checkIzin", async (req, res) => {
  const { userId, date } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }

  try {
    // Corrected query to check for 'Izin' or 'izin' in the detail field
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM absen WHERE id_akun = ? AND tanggal_absen = ? AND (detail = 'Sakit' OR detail = 'Izin')",
      [userId, date]
    );

    const hasAttended = rows[0].count > 0; // true if count is greater than 0

    return res.status(200).json({ hasAttended });
  } catch (error) {
    console.error("Error checking attendance:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/checkIzinApproveOrReject", async (req, res) => {
  const { userId, date } = req.query;

  if (!userId || !date) {
    return res.status(400).json({ message: "User ID and date are required." });
  }

  try {
    // Query to check for 'Pending', 'Approved', or 'Rejected' status in the 'status' field
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS count FROM izin WHERE id_akun = ? AND tanggal_izin = ? AND (status = 'Pending' OR status = 'Approved')",
      [userId, date]
    );

    const hasIzinStatus = rows[0].count > 0; // true if any matching record is found
    console.log(userId, date, hasIzinStatus);
    return res.status(200).json({ hasIzinStatus });
  } catch (error) {
    console.error("Error checking izin status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
