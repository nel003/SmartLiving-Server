import { Router } from "express";
import { validateUser } from "../middleware/validateUser";
import { device } from "../api/device";
import { validate, validationSchemas } from "../utils/validation";
import { isHomeAdmin } from "../middleware/isHomeAdmin";

const router = Router();

router.get('/room/:room_name', validateUser, device.getAll);    
router.get('/all', validateUser, device.all);

router.post('/', validateUser, validate(validationSchemas.addDevice), isHomeAdmin, device.add);
router.put('/:device_id', validateUser, validate(validationSchemas.updateDevice, 'body'), isHomeAdmin, device.update);
router.delete('/:device_id', validateUser, validate(validationSchemas.deviceId, 'params'), isHomeAdmin, device.delete);
router.post('/ir-button', validateUser, validate(validationSchemas.addIrButton), isHomeAdmin, device.addIrButton);
router.get('/:device_id/ir-buttons', validateUser, validate(validationSchemas.deviceId, 'params'), device.getIrButtons);
router.get('/mac/:device_mac/ir-buttons', validateUser, validate(validationSchemas.deviceMac, 'params'), device.getIrButtonsByMac);
router.delete('/ir-button/:buttonId', validateUser, validate(validationSchemas.buttonId, 'params'), isHomeAdmin, device.deleteIrButton);

export default router;