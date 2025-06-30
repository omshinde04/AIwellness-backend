const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔐 Register Controller
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err.message });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name, email, password, streak_count, last_entry_date) VALUES (?, ?, ?, 0, NULL)",
        [name, email, hashedPassword],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: "Database insert error", error: err.message });
          }

          res.status(201).json({ message: "User registered successfully" });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 🔐 Login Controller
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });
};

// 👤 Get Current Logged-in User (with streak_count + last_entry_date)
exports.getCurrentUser = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT id, name, email, bio, profile_image, created_at, streak_count, last_entry_date
    FROM users 
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching user", error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: results[0] });
  });
};

// 🔁 Change Password Controller
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });

      const user = results[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      db.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, userId], (err) => {
        if (err) return res.status(500).json({ message: "Failed to update password", error: err.message });

        res.status(200).json({ message: "Password changed successfully" });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 👤 Update User Profile
exports.updateUser = (req, res) => {
  const userId = req.user.id;
  const { name, email, bio, profile_image } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "Name and Email are required." });
  }

  const checkEmailQuery = "SELECT * FROM users WHERE email = ? AND id != ?";
  db.query(checkEmailQuery, [email, userId], (err, existing) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (existing.length > 0) return res.status(409).json({ message: "Email already in use by another account." });

    const updateQuery = `
      UPDATE users 
      SET name = ?, email = ?, bio = ?, profile_image = ?
      WHERE id = ?
    `;

    db.query(updateQuery, [name, email, bio || "", profile_image || "", userId], (err) => {
      if (err) return res.status(500).json({ message: "Update failed", error: err.message });

      res.status(200).json({ message: "Profile updated successfully." });
    });
  });
};
