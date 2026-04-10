const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const csvParser = require('csv-parser');
const stream = require('stream');

const queueManager = require('./queueManager');
const Log = require('./models/Log');
const Template = require('./models/Template');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));

// Multer setup for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// ----------------------------------------------------
// Campaigns API
// ----------------------------------------------------

app.post('/api/campaigns/start', upload.single('csvFile'), (req, res) => {
  try {
    const { subject, content } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'CSV file is required' });
    if (!subject || !content) return res.status(400).json({ error: 'Subject and content are required' });

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    bufferStream
      .pipe(csvParser())
      .on('data', (data) => {
        // Assume CSV has a column 'email' or the first column is email
        const keys = Object.keys(data);
        let email = data['email'] || data['Email'] || data[keys[0]];
        if (email) results.push(email.trim());
      })
      .on('end', () => {
        if (results.length === 0) {
          return res.status(400).json({ error: 'No valid emails found in CSV' });
        }
        
        try {
          queueManager.start(results, subject, content);
          return res.status(200).json({ 
            message: 'Campaign started successfully', 
            totalEmails: results.length,
            campaignId: queueManager.campaignId,
          });
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns/pause', (req, res) => {
  try {
    queueManager.pause();
    res.json({ message: 'Campaign paused', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/campaigns/resume', (req, res) => {
  try {
    queueManager.resume();
    res.json({ message: 'Campaign resumed', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/campaigns/stop', (req, res) => {
  try {
    queueManager.stop();
    res.json({ message: 'Campaign stopped', status: queueManager.getStatus() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/campaigns/status', (req, res) => {
  res.json(queueManager.getStatus());
});

// ----------------------------------------------------
// Logs API
// ----------------------------------------------------

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await Log.find().select('-content').sort({ sentAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/logs/all', async (req, res) => {
  try {
    const logs = await Log.find().select('-content').sort({ sentAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/logs/:id', async (req, res) => {
  try {
    const log = await Log.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch log detail' });
  }
});

app.delete('/api/logs', async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'Logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// ----------------------------------------------------
// Templates API
// ----------------------------------------------------

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const { name, subject, content } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ error: 'Name, subject, and content are required' });
    }
    const template = new Template({ name, subject, content });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save template' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Template.findByIdAndDelete(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});