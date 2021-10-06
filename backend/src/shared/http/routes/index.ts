import { Router } from 'express';
import usersRouter from '@modules/users/routes/users.routes';
import sessionsRouter from '@modules/users/routes/sessions.routes';
import passwordRouter from '@modules/users/routes/password.routes';
import profileRouter from '@modules/users/routes/profile.routes';
import settingsRouter from '@modules/settings/routes/settings.routes';
import symbolsRouter from '@modules/symbols/routes/symbols.routes';
import exchangeRouter from '@modules/exchange/routes/exchange.routes';
import ordersRouter from '@modules/order/routes/orders.routes';

const routes = Router();

routes.use('/users', usersRouter);
routes.use('/sessions', sessionsRouter);
routes.use('/password', passwordRouter);
routes.use('/profile', profileRouter);

routes.use('/settings', settingsRouter);
routes.use('/symbols', symbolsRouter);
routes.use('/exchange', exchangeRouter);
routes.use('/orders', ordersRouter);

export default routes;
