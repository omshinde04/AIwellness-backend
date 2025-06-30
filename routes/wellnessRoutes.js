// 📁 backend/routes/wellnessRoutes.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const db = require("../config/db");

// ✅ Route: Add new wellness entry (already exists)
// POST /api/wellness
router.post("/", authMiddleware, async (req, res) => {
  const { mood, sleep_hours, hydration_liters, steps } = req.body;
  const user_id = req.user.id;

  const ai_suggestion = generateSmartSuggestion({ mood, sleep: sleep_hours, hydration: hydration_liters, steps });

  // 1️⃣ Check user's last_entry_date
  db.query("SELECT streak_count, last_entry_date FROM users WHERE id = ?", [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error fetching user", error: err.message });

    const user = results[0];
    const today = new Date();
    const lastDate = user.last_entry_date ? new Date(user.last_entry_date) : null;

    let newStreak = 1;

    if (lastDate) {
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak = user.streak_count + 1;       // Next day ➕
      else if (diffDays === 0) newStreak = user.streak_count;      // Same day ➖ nothing
      else newStreak = 1;                                          // Skipped day 🔁
    }

    // 2️⃣ Update user's streak + last_entry_date
    db.query(
      "UPDATE users SET streak_count = ?, last_entry_date = CURDATE() WHERE id = ?",
      [newStreak, user_id],
      (err2) => {
        if (err2) return res.status(500).json({ message: "DB Error updating streak", error: err2.message });

        // 3️⃣ Insert new wellness entry
        const sql = `
          INSERT INTO wellness_entries (user_id, mood, sleep_hours, hydration_liters, steps, ai_suggestion)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [user_id, mood, sleep_hours, hydration_liters, steps, ai_suggestion], (err3, result) => {
          if (err3) return res.status(500).json({ message: "DB Insert Error", error: err3.message });
          return res.status(201).json({ message: "Wellness entry saved", suggestion: ai_suggestion, streak: newStreak });
        });
      }
    );
  });
});


// ✅ Route: Get past 7 wellness entries for chart
// GET /api/wellness/history
router.get("/history", authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const sql = `
    SELECT id, mood, sleep_hours, hydration_liters, steps, ai_suggestion, created_at
    FROM wellness_entries
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 7
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: "DB Fetch Error", error: err.message });
    return res.status(200).json({ history: results });
  });
});

// 🧠 Logic for Suggestion (replace later with OpenAI)
function generateSmartSuggestion({ sleep, mood, hydration, steps }) {
  const tips = [];

  // 😴 Sleep Analysis
  if (sleep < 5) {
    tips.push("You're extremely sleep-deprived. Prioritize rest tonight 🛌");
  } else if (sleep >= 5 && sleep < 7) {
    tips.push("Your sleep is below optimal. Aim for 7–8 hrs for better energy ⚡");
  } else {
    tips.push("Awesome sleep duration! Well-rested minds perform better 🌙");
  }

  // 💧 Hydration Feedback
  if (hydration < 1.2) {
    tips.push("Low hydration alert 🚨 Drink 2 glasses of water right now!");
  } else if (hydration < 2) {
    tips.push("Almost there! Just a bottle or two more to hit ideal hydration 💧");
  } else {
    tips.push("Great hydration! Keep it going 🥤");
  }

  // 👣 Steps Analysis
  if (steps < 2000) {
    tips.push("You’ve been quite inactive. Try a 15-min walk now 🏃‍♂️");
  } else if (steps < 6000) {
    tips.push("Good effort! You’re halfway to your daily step goal 🚶‍♂️");
  } else {
    tips.push("Great activity level today! Your heart is thanking you ❤️");
  }

  // 🙂 Mood Guidance
  switch (mood?.toLowerCase()) {
    case "sad":
      tips.push("Feeling down? Try a calming playlist or text a close friend 💛");
      break;
    case "neutral":
      tips.push("You’re doing okay. Maybe journal your thoughts or walk in nature 🌿");
      break;
    case "happy":
      tips.push("You’re shining today! Spread your positivity ✨");
      break;
    default:
      tips.push("Mood not set. How are you feeling today? Self-reflection helps 🧠");
  }

  // ✨ Bonus: Combo insights
  if (sleep >= 8 && hydration >= 2 && steps >= 8000 && mood?.toLowerCase() === "happy") {
    tips.push("You're on fire! This is peak wellness 🔥 Keep dominating!");
  }

  // 🎲 Randomly rotate tips for variety
  const finalSuggestion = tips[Math.floor(Math.random() * tips.length)];
  return finalSuggestion;
}

module.exports = router;
