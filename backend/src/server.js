const database = require('./db');
const app = require('./app');
const appEm = require('./app-em');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');
const automationsRepository = require('./repositories/automationsRepository');
const beholder = require('./beholder');
const agenda = require('./agenda');

(async () => {
  console.log('Getting the default settings...');
  const settings = await settingsRepository.getDefaultSettings();
  if (!settings) return new Error('There is no settings');

  console.log('Initializing the Beholder Brain...');
  const automations = await automationsRepository.getActiveAutomations();
  beholder.init(automations);

  console.log('Initializing the Beholder Agenda...');
  agenda.init(automations);

  console.log('Starting the Server Apps...');
  const server = app.listen(process.env.PORT, () => {
    console.log('App is running');
  });

  const wss = appWs(server);

  await appEm.init(settings, wss, beholder);

  // setTimeout(async () => {
  //   try {
  //     const result = await beholder.placeOrder(settings, automations[0], automations[0].actions[1]);
  //     console.log(result);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }, 10000)

})();


