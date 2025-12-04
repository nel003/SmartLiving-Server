import { Router } from 'express';
import { signup } from '../api/user/signup';
import { login } from '../api/user/login';
import { logout } from '../api/user/logout';
import { validateUser } from '../middleware/validateUser';
import { refresh } from '../api/user/refresh';
import { validateRefreshToken } from '../middleware/validateRefreshToken';
import homeKey  from '../api/user/key';
import { device } from '../api/device';
import { pushToken } from '../api/user/pushToken';
import profile from '../api/user/profile';
import { validate, validationSchemas } from '../utils/validation';
import { uploadProfilePhoto } from '../utils/upload';

const router = Router();

//User routes with validation
router.post('/signup', validate(validationSchemas.signup), signup);
router.post('/login', validate(validationSchemas.login), login);
router.delete('/logout', validateUser, logout);
router.get('/refresh', validateRefreshToken, refresh);
router.get('/key', validateUser, homeKey.getKey);
// router.post('/key', validateUser, homeKey.createKey);

// Profile routes
router.get('/profile', validateUser, profile.get);
router.put('/profile', validateUser, validate(validationSchemas.updateProfile), profile.update);
router.post('/profile/photo', validateUser, uploadProfilePhoto.single('photo'), profile.uploadPhoto);
router.delete('/profile/photo', validateUser, profile.deletePhoto);

// Push notification token routes
router.post('/push-token', validateUser, validate(validationSchemas.pushToken), pushToken.upsertToken);
router.get('/push-tokens', validateUser, pushToken.getUserTokens);
router.delete('/push-token/:tokenId', validateUser, pushToken.deleteToken);
router.delete('/push-token', validateUser, pushToken.deleteTokenByValue);

export default router;
