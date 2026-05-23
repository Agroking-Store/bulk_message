# WhatsApp Bulk Messaging System

A web-based system that allows users to upload contacts via CSV and send bulk WhatsApp messages using WhatsApp Cloud API.

## Description

This project allows users to upload a CSV file containing phone numbers and send bulk WhatsApp messages automatically.

The system includes:
- CSV contact upload
- Number validation
- WhatsApp Cloud API integration
- Message delivery tracking
## Features

- Upload contacts using CSV
- Automatically validate phone numbers
- Send WhatsApp messages using Meta API
- Dashboard for message tracking
- Notification system for errors

## Installation

1. Clone the repository

git clone https://github.com/yourusername/whatsapp-bulk-messaging-system.git

2. Open the project folder

cd whatsapp-bulk-messaging-system

3. Install dependencies

npm install

4.open the folder of backend and frontend through cd

cd frontend
cd backend

5. Create a .env file

Add your environment variables

WHATSAPP_ACCESS_TOKEN=your_token
PHONE_NUMBER_ID=your_number_id
MONGODB_URI=your_mongodb_connection

6. Run the project

npm run dev for frontend 
npm run start for backend## Tech Stack

Frontend
- Next.js
- React
- Tailwind CSS

Backend
- Node.js
- Express.js

Database
- MongoDB

API
- WhatsApp Cloud API