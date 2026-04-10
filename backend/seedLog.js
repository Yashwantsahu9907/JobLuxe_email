const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Log = require('./models/Log');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    
    await Log.create({
      campaignId: 'camp_test_123',
      recipient: 'test@example.com',
      subject: 'Test Email with HTML Content',
      content: '<h1>Hello, World!</h1><p>This is a <strong>test</strong> email to verify that HTML formatting works correctly.</p><ul><li>List item 1</li><li>List item 2</li></ul><p><a href="https://example.com">Click here</a> for more info.</p>',
      status: 'success',
      sentAt: new Date()
    });
    
    console.log('Seed log created successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
