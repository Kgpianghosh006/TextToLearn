require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Text-to-Learn API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
