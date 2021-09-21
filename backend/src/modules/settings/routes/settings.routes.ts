import { Router } from 'express';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import SettingsController from '@modules/settings/controllers/SettingsController';
import { celebrate, Joi, Segments } from 'celebrate';

const settingsRouter = Router();
const settingsController = new SettingsController();

settingsRouter.get('/', isAuthenticated, settingsController.index);
settingsRouter.post(
  '/',
  isAuthenticated,
  celebrate({
    [Segments.BODY]: {
      apiUrl: Joi.string().required(),
      accessKey: Joi.string().required(),
      secretKey: Joi.string().required(),
    },
  }),
  settingsController.create,
);
settingsRouter.patch('/', isAuthenticated, settingsController.update);

export default settingsRouter;
