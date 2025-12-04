import { Router } from "express";
import { validateUser } from "../middleware/validateUser";
import { rooms } from "../api/rooms";


const router = Router();

//Device routes
router.get('/', validateUser, rooms.get);

export default router;