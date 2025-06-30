const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ✅ IMPORTANT for parsing JSON

// Your Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
app.use('/favicon.ico', express.static('public/favicon.ico'));

const wellnessRoutes = require("./routes/wellnessRoutes");
app.use("/api/wellness", wellnessRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ✅ Use Railway assigned port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
