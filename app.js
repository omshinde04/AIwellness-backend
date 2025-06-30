const express = require("express");
const cors = require("cors");
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // ✅ VERY IMPORTANT for reading req.body

// Your Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
app.use('/favicon.ico', express.static('public/favicon.ico'));


const wellnessRoutes = require("./routes/wellnessRoutes");
app.use("/api/wellness", wellnessRoutes);

// Server Start
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});
