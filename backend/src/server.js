const database = require('./db');
const app = require('./app');
const appEm = require('./app-em');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');
const beholder = require('./beholder');

(async () => {
  console.log('Getting the default settings...');
  const settings = await settingsRepository.getDefaultSettings();
  if (!settings) return new Error('There is no settings');

  console.log('Initializing the Beholder Brain...');
  beholder.init([]);

  console.log('Starting the Server Apps...');
  const server = app.listen(process.env.PORT, () => {
    console.log('App is running');
  });

  const wss = appWs(server);

  await appEm.init(settings, wss, beholder);
})();


