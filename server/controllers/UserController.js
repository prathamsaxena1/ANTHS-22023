import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const generateAccessToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
  });
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("Register called");
  const { username, email, password } = req.body;
  const coverImg = req.files?.coverImg; // Assuming coverImg is sent as a file

  if (!username || !email || !password || !coverImg) {
      throw new ApiError(401, "All the fields are required");
  }

  let user;
  try {
      console.log("Creating user ......");
      user = await User.create({
          username,
          email,
          password,
          avatar: coverImgUploaded.secure_url // Ensure the correct URL is used
      });
      console.log("User created......");
  } catch (error) {
      console.error("An error occurred while creating the user:", error);
      if (error.code === 11000) { // Duplicate key error
          throw new ApiError(410, 'User already registered');
      } else {
          throw new ApiError(500, 'Internal server error');
      }
  }

  const createdUser = await User.findById(user._id);
  return res.status(200).json({ createdUser });
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) throw new ApiError(401, "Invalid email");
  if (!await user.isPasswordCorrect(password)) throw new ApiError(401, "Invalid password");

  const accessToken = generateAccessToken(user._id);
  
  const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.status(200)
      .cookie("accessToken", accessToken, options)
      .json({ user: await User.findById(user._id).select("-password"),
          token:accessToken
       });
});


const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "User not authenticated");
  res.status(200).json({ user: req.user });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
  });
  res.status(200).json({ message: "Logged out successfully" });
});


export { registerUser, loginUser, getCurrentUser,logoutUser };
