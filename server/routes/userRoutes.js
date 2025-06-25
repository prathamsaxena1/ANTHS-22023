import { Router } from "express";
import { verifyJWT } from "../middleware/auth.js";
import { loginUser,registerUser} from "../controllers/UserController.js";

const userRoutes = Router()

userRoutes.route("/register").post(
    registerUser
)
userRoutes.route("/login").post(
    loginUser
)

export default userRoutes;