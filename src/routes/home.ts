import { Router } from "express";
import { validateUser } from "../middleware/validateUser";
import { home } from "../api/home";
import { isHomeAdmin } from "../middleware/isHomeAdmin";


const router = Router();

//Device routes
router.get('/members', validateUser, home.members);
router.get('/invite', validateUser, isHomeAdmin, home.invite);
router.post('/invite/accept', validateUser, home.acceptInvite);
router.delete('/member/:memberId', validateUser, isHomeAdmin, home.deleteMember);

export default router;