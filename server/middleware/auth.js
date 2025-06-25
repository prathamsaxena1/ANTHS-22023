import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    console.log(req.headers);

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        throw new ApiError(401, "Token not found");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        // console.log("Token decoded !!!")
        const user = await User.findById(decodedToken._id).select("-password");

        if (!user) throw new ApiError(404, "User not found");

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token expired");
        } else {
            throw new ApiError(401, "Invalid token");
        }
    }
});

export const checkRestaurantOwnership = asyncHandler(async (req, res, next) => {
    const restaurantId = req.params.restaurantId;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
        return next(
            new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 404)
        );
    }

    // Check if user is restaurant owner or admin
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to manage this restaurant`, 403)
        );
    }

    next();
});