import cors from "cors";
import express from "express";
import userRoutes from "./routes/userRoutes.js";
import logger from "./utils/logger.js";
import restaurants from './routes/v1/restaurantRoutes.js';
import menuItems from './routes/v1/menuItemRoutes.js';

// Initialize the Express app
const app = express();

// Use CORS middleware
app.use(cors());

// Use user routes
app.use("/api/v1/user", userRoutes);

// Use JSON middleware for parsing application/json
app.use(express.json());
logger.info("User routes Connected")

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