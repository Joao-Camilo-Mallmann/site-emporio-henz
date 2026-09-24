import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { authController } from "@/modules/auth/auth.controller";

export const authRoutes = new Router();

authRoutes.post("/register", (req) => authController.register(req));
authRoutes.post("/login", (req) => authController.login(req));
authRoutes.get("/me", authMiddleware, (req, ctx) => authController.me(req, ctx));

export default authRoutes;
