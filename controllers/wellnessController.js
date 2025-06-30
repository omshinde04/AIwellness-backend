const db = require("../config/db");

// 🔄 POST /api/wellness — Submit entry
exports.submitWellnessEntry = (req, res) => {
  const userId = req.user.id;
  const { mood, sleep_hours, hydration_liters, steps } = req.body;

  const ai_suggestion = generateAISuggestion(mood, sleep_hours, hydration_liters, steps);

  const insertQuery = `
    INSERT INTO wellness_entries (user_id, mood, sleep_hours, hydration_liters, steps, ai_suggestion)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuery,
    [userId, mood, sleep_hours, hydration_liters, steps, ai_suggestion],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ message: "Failed to submit entry" });
      }

      res.status(201).json({ message: "Wellness entry submitted successfully", ai_suggestion });
    }
  );
};

// 🔍 GET /api/wellness/me — Get latest entry
exports.getLatestEntry = (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT mood, sleep_hours, hydration_liters, steps, ai_suggestion, entry_date
    FROM wellness_entries
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ message: "Failed to fetch entry" });
    }

    if (results.length === 0) {
      return res.status(200).json({});
    }

    res.status(200).json(results[0]);
  });
};

// 🧠 Dummy AI Suggestion Generator (replace later with real ML/AI)
function generateAISuggestion(mood, sleep, water, steps) {
  if (sleep < 6) return "Try to get more rest tonight.";
  if (steps < 3000) return "Take a short walk today!";
  if (water < 2) return "Stay hydrated! Drink more water.";
  return "You're doing great! Keep it up!";
}
