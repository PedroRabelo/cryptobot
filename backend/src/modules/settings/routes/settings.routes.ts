import { Router } from 'express';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import SettingsController from '@modules/settings/controllers/SettingsController';

const settingsRouter = Router();
const settingsController = new SettingsController();

settingsRouter.get('/', isAuthenticated, settingsController.index);

export default settingsRouter;
