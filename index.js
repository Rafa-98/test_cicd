require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Endpoint info
app.get('/api/v1/info', (req, res, next) => {
    try {
        console.log("[INFO] Called server info");
        const messages = [];
        messages.push({
            message: "Hi from micro 3",
            context: `Random result: ${Math.random()}`,
            server_id: process.env.SERVER_ID,
            date: new Date()
        });

        console.log("[INFO] Success on server info");
        res.json(messages);
    } catch (error) {
        console.error(`[ERROR] Called server info`);
        next(error);
    }
});

// Health check
app.get('/api/v1/health-check', (req, res, next) => {
    try {
        console.log("[INFO] Called server health check");
        res.json({
            status: "ACTIVE",
            date: new Date(),
            server_id: process.env.SERVER_ID
        });
    } catch (error) {
        console.error(`[ERROR] Called server health check`);
        next(error);
    }
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(`[INFO] Called global error handler`);
    res.status(500).json({ message: 'Internal Server Error', cause: err });
});

app.listen(port, () => {
  console.log(`Microservice with Express js listening on port ${port}`);
});