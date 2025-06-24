import cors from "cors";
import express from "express";

// Initialize the Express app
const app = express();

// Use CORS middleware
app.use(cors());

// Use JSON middleware for parsing application/json
app.use(express.json());

// Use URL-encoded middleware for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Error Handling Middleware (Optional)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// Export the app
export default app;
