import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { registerUser, loginUser, generateToken } from "../services/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;
    
    const user = await registerUser(name, email, password);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      user,
      token,
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    const user = await loginUser(email, password);
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};
