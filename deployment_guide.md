# Deployment Guide for JobLuxe Email

This guide provides step-by-step instructions to deploy your application as a **Single Service** on Render.

## Prerequisites

1.  **MongoDB Atlas**: Have your MongoDB connection string ready.
2.  **Gmail Account**: For sending emails, you must have 2-Factor Authentication (2FA) enabled.
3.  **GitHub Repository**: Your code should be pushed to a GitHub repository.

---

## Step 1: Generate a Gmail App Password

Standard Gmail passwords will not work for security reasons. Follow these steps:

1.  Go to your [Google Account](https://myaccount.google.com/).
2.  Select **Security** on the left menu.
3.  Ensure **2-Step Verification** is **ON**.
4.  Search for **"App passwords"** in the search bar.
5.  Enter a name (e.g., "JobLuxe Email") and click **Create**.
6.  **Copy the 16-character code** (no spaces). This is your `SMTP_PASS`.

---

## Step 2: Deploy to Render (The Easy Way)

We have included a `render.yaml` file that automates the setup.

1.  Log in to [Render](https://dashboard.render.com/).
2.  Click **New +** and select **Blueprint**.
3.  Connect your GitHub repository.
4.  Render will detect the `render.yaml` file.
5.  You will be prompted to fill in the **Environment Variables**:
    *   `MONGODB_URI`: Your MongoDB Atlas string.
    *   `ADMIN_EMAIL`: The email you'll use to log in to the dashboard.
    *   `ADMIN_PASSWORD`: The password for the dashboard.
    *   `SMTP_USER`: Your Gmail address (the one you used in Step 1).
    *   `SMTP_PASS`: The 16-character App Password from Step 1.
    *   `FRONTEND_URL`: *Leave blank for now* or set it to your Render URL after the first deploy.
6.  Click **Apply**.

---

## Step 3: Manual Setup (If Blueprints fail)

1.  Click **New +** > **Web Service**.
2.  Connect your repository.
    *   **Runtime**: `Node`
    *   **Build Command**: `npm run build` (from root)
    *   **Start Command**: `npm start` (from root)
3.  Go to the **Environment** tab and add:
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: `your_mongodb_uri`
    *   `JWT_SECRET`: `something_random_and_long`
    *   `ADMIN_EMAIL`: `admin@jobluxe.com`
    *   `ADMIN_PASSWORD`: `your_secure_password`
    *   `SMTP_HOST`: `smtp.gmail.com`
    *   `SMTP_PORT`: `587`
    *   `SMTP_USER`: `your_gmail@gmail.com`
    *   `SMTP_PASS`: `your_app_password`

---

## Step 4: Verification

1.  Once the status is **"Live"**, click the URL provided by Render.
2.  Try logging in with your `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
3.  Test adding an account and sending a test email to ensure the Gmail credentials work.

> [!TIP]
> **Logs**: If the app fails to start, check the **Logs** tab in Render. It will tell you if a variable is missing or if there is a database connection error.
