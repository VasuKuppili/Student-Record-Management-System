# Student Record Management System

A minimal, developer-grade Student Record Management System built with Node.js, Express, and MongoDB. Featuring a clean black-and-white UI for maximum focus.

## 🚀 Features

- **Authentication**: Secure Sign In and Sign Up functionality.
- **Dashboard**: Overview of student statistics (Total, Male, Female, Classes).
- **Student Management**: Add, View, Edit, and Delete student records.
- **Academics**: Manage Classes and Sections.
- **Data Export**: Export student lists to CSV format.
- **Minimal UI**: Clean, developer-friendly interface without unnecessary distractions.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript.
- **Backend**: Node.js, Express.
- **Database**: MongoDB (Atlas/Local).
- **Session Management**: express-session with connect-mongo.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) account or local instance

## ⚙️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/VasuKuppili/Student-Record-Management-System.git
   cd Student-Record-Management-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   PORT=3500
   SESSION_SECRET=your_secret_key
   ```

4. **Seed Database** (Optional - creates default admin and classes):
   ```bash
   node backend/seed.js
   ```

## 🏃 Usage

1. **Start the server**:
   ```bash
   npm start
   ```
   *Note: If `npm start` is not defined, use `node backend/server.js`*

2. **Access the application**:
   Open your browser and navigate to `http://localhost:3500`

## 🔑 Default Credentials

If you ran the seed script, you can log in with:
- **Username**: `admin`
- **Password**: `admin123`


