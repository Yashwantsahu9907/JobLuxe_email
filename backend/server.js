const express = require('express');
const dns = require('dns');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const csvParser = require('csv-parser');
const stream = require('stream');
const path = require('path');
const jwt = require('jsonwebtoken');
const { extractEmailsFromFile } = require('./utils/emailExtractor');

const queueManager = require('./queueManager');
const Log = require('./models/Log');
const Template = require('./models/Template');
const Account = require('./models/Account');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'https://jobluxe-email.onrender.com',
  'https://jobluxe-email-1.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      // In production, if it's the same domain, it might not have an origin header or it might match.
      // But let's be more lenient with Render domains for now to fix the blockage.
      if (origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error: ', err));

// Multer setup for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

const authMiddleware = require('./utils/auth');

// ----------------------------------------------------
// Auth API
// ----------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables!');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, message: 'Login successful' });
  }

  return res.status(401).json({ error: 'Invalid Admin Credentials' });
});

app.use('/api/campaigns', authMiddleware);
app.use('/api/logs', authMiddleware);
app.use('/api/templates', authMiddleware);
app.use('/api/accounts', authMiddleware);

// ----------------------------------------------------
// Campaigns API
// ----------------------------------------------------
app.post('/api/campaigns/start', upload.single('file'), async (req, res) => {
  try {
    const { subject, content } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'File is required' });
    if (!subject || !content) return res.status(400).json({ error: 'Subject and content are required' });

    try {
      const results = await extractEmailsFromFile(file.buffer, file.mimetype, file.originalname);
      
      if (results.length === 0) {
        return res.status(400).json({ error: 'No valid emails found in the uploaded file' });
      }

      queueManager.start(results, subject, content);
      return res.status(200).json({ 
        message: 'Campaign started successfully', 
        totalEmails: results.length,
        campaignId: queueManager.campaignId,
      });
    } catch (err) {
      console.error('Extraction error:', err);
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/campaigns/analyze-file', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'File is required' });

    try {
      const results = await extractEmailsFromFile(file.buffer, file.mimetype, file.originalname);
      return res.status(200).json({ 
        totalEmails: results.length,
        emails: results // Optional: could be used for preview
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } catch (error) {
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
// Accounts API
// ----------------------------------------------------

app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { email, appPassword } = req.body;
    if (!email || !appPassword) {
      return res.status(400).json({ error: 'Email and App Password are required' });
    }

    // Verify credentials with nodemailer
    const transporter = nodemailer.createTransport({
      host: '64.233.184.108', // Hardcoded IPv4 address for smtp.gmail.com
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: appPassword,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
    });

    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Verification failed:', verifyError);
      return res.status(400).json({ 
        error: 'Invalid credentials. Please check your email and App Password. Ensure 2FA is enabled and you are using an "App Password" not your regular password.' 
      });
    }

    // Check if it's the first account, make it active
    const count = await Account.countDocuments();
    const account = new Account({ 
      email, 
      appPassword, 
      isActive: count === 0 
    });
    
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to add account' });
  }
});

app.put('/api/accounts/:id/select', async (req, res) => {
  try {
    const { id } = req.params;
    // Set all to inactive
    await Account.updateMany({}, { isActive: false });
    // Set selected to active
    const account = await Account.findByIdAndUpdate(id, { isActive: true },{ returnDocument: 'after' });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: 'Failed to select account' });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findByIdAndDelete(id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    // If we deleted the active account, pick another one to be active
    if (account.isActive) {
      const another = await Account.findOne();
      if (another) {
        another.isActive = true;
        await another.save();
      }
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ----------------------------------------------------

// Serve React app in production
if (process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '../frontend/dist');
  
  // Debug log to verify path during startup
  console.log(`Checking for production frontend assets at: ${distPath}`);
  
  app.use(express.static(distPath));
  
  // The "catchall" handler: for any request that doesn't
  // match one above, send back React's index.html file.
  app.use((req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath);
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});