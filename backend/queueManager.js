const nodemailer = require('nodemailer');
const dns = require('dns');
const Log = require('./models/Log');
const Account = require('./models/Account');
require('dotenv').config();

class QueueManager {
  constructor() {
    this.status = 'idle'; // idle, running, paused, stopped
    this.total = 0;
    this.sent = 0;
    this.failed = 0;
    this.emails = [];
    this.subject = '';
    this.content = '';
    this.campaignId = null;
    this.currentIndex = 0;
    this.delayMs = parseInt(process.env.EMAIL_DELAY_MS) || 3000;
    this.transporter = null;
    this.activeAccount = null;
  }

  async getTransporter() {
    const activeAccount = await Account.findOne({ isActive: true });
    
    if (!activeAccount) {
      // Fallback to .env if no account in DB (for backward compatibility or initial setup)
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
          host: '64.233.184.108', // Hardcoded IPv4
          port: 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            servername: 'smtp.gmail.com'
          },
          connectionTimeout: 60000,
        });
      }
      throw new Error('No active email account configured');
    }

    this.activeAccount = activeAccount;
    return nodemailer.createTransport({
      host: '64.233.184.108', // Hardcoded IPv4
      port: 465,
      secure: true,
      auth: {
        user: activeAccount.email,
        pass: activeAccount.appPassword,
      },
      tls: {
        servername: 'smtp.gmail.com'
      },
      connectionTimeout: 60000,
    });
  }

  async start(emails, subject, content) {
    if (this.status === 'running') {
      throw new Error('A campaign is already running');
    }
    
    try {
      this.transporter = await this.getTransporter();
    } catch (err) {
      throw new Error(err.message);
    }

    this.emails = emails;
    this.subject = subject;
    this.content = content;
    this.total = emails.length;
    this.sent = 0;
    this.failed = 0;
    this.currentIndex = 0;
    this.campaignId = `camp_${Date.now()}`;
    this.status = 'running';
    
    this.processNext();
  }

  pause() {
    if (this.status !== 'running') {
      throw new Error('No campaign is running to pause');
    }
    this.status = 'paused';
  }

  resume() {
    if (this.status !== 'paused') {
      throw new Error('Campaign is not paused');
    }
    this.status = 'running';
    this.processNext();
  }

  stop() {
    if (this.status === 'idle' || this.status === 'stopped') {
      throw new Error('No active campaign to stop');
    }
    this.status = 'stopped';
    this.reset();
  }

  getStatus() {
    return {
      status: this.status,
      total: this.total,
      sent: this.sent,
      failed: this.failed,
      progress: this.total === 0 ? 0 : Math.round(((this.sent + this.failed) / this.total) * 100),
      campaignId: this.campaignId
    };
  }

  reset() {
    // Keep stats but transition to stopped/idle
    this.status = 'idle';
    this.emails = [];
    this.currentIndex = 0;
  }

  async processNext() {
    if (this.status !== 'running') return;
    
    if (this.currentIndex >= this.emails.length) {
      this.status = 'idle';
      console.log('Campaign finished');
      return;
    }

    const email = this.emails[this.currentIndex];
    this.currentIndex++;

    try {
      const fromEmail = this.activeAccount ? this.activeAccount.email : process.env.SMTP_USER;
      const mailOptions = {
        from: fromEmail,
        to: email,
        subject: this.subject,
        html: this.content,
      };

      await this.transporter.sendMail(mailOptions);
      this.sent++;
      
      // Log success
      await Log.create({
        campaignId: this.campaignId,
        recipient: email,
        subject: this.subject,
        content: this.content,
        status: 'success',
      });
      
    } catch (error) {
      this.failed++;
      console.error(`Failed to send email to ${email}: `, error);
      
      // Log failure
      await Log.create({
        campaignId: this.campaignId,
        recipient: email,
        subject: this.subject,
        content: this.content,
        status: 'failed',
        errorMsg: error.message,
      });
    }

    // Delay before next
    if (this.status === 'running') {
      setTimeout(() => {
        this.processNext();
      }, this.delayMs);
    }
  }
}

module.exports = new QueueManager();
