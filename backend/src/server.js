const app = require('./app');
const appEm = require('./app-em');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');
const automationsRepository = require('./repositories/automationsRepository');
const usersRepository = require('./repositories/usersRepository');
const beholder = require('./beholder');
const agenda = require('./agenda');
const logger = require('./utils/logger');

(async () => {
  logger('system', 'Getting the default settings...');
  const settings = await settingsRepository.getDefaultSettings();
  if (!settings) return new Error('There is no settings');

  logger('system', 'Initializing the Beholder Brain...');

  const users = await usersRepository.getActiveUsers();
  const automations = await automationsRepository.getActiveAutomations();
  beholder.init(automations);

  logger('system', 'Initializing the Beholder Agenda...');
  agenda.init(automations);

  logger('system', 'Starting the Server Apps...');
  const server = app.listen(process.env.PORT, () => {
    logger('system', 'App is running');
  });

  const wss = appWs(server);

  await appEm.init(settings, users, wss, beholder);

  // const telegram = require('./utils/telegram');
  // telegram(settings, 'Teste robô telegram');

  // setTimeout(async () => {
  //   try {
  //     const result = await beholder.placeOrder(settings, automations[0], automations[0].actions[1]);
  //     logger('system', result);
  //   } catch (err) {
  //     logger('system', err);
  //   }
  // }, 10000)

})();


