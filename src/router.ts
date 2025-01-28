import { Router } from "express";
import { createAccount, getUser, getUserByHandle, login, searchByHandle, updateProfile, uploadImage } from "./handlers";
import { body } from "express-validator";
import { handleInputErrors } from "./middleware/validation";
import { authenticate } from "./middleware/auth";

const router = Router();

//** Autenticación y registro */

router.post("/auth/register",
  body("handle").notEmpty().withMessage("El handle es requerido"),
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("El email no es válido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres"),
  handleInputErrors,
  createAccount
);

router.post("/auth/login",
  body("email").isEmail().withMessage("El email no es válido"),
  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria"),
  handleInputErrors,
    login
);

router.get('/user',authenticate, getUser)

router.patch('/user',
  body("handle").notEmpty().withMessage("El handle es requerido"),
  handleInputErrors,
  authenticate, 
  updateProfile
)

router.post('/user/image', authenticate, uploadImage)

router.get('/:handle', getUserByHandle)

router.post('/search',
  body("handle").notEmpty().withMessage("El handle es requerido"),
  handleInputErrors,
  searchByHandle
)

export default router;
