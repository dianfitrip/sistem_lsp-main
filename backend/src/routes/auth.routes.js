const router = require("express").Router();
const authController = require("../controllers/auth/auth.controller");
const { loginLimiter } = require("../middlewares/rateLimit.middleware");

router.post("/login", loginLimiter, authController.login);
router.post("/logout", authController.logout);

router.post("/register", authController.register);

module.exports = router;
