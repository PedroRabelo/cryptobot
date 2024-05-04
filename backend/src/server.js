const database = require('./db');
const app = require('./app');
const appEm = require('./app-em');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');

settingsRepository.getDefaultSettings()
  .then(settings => {
    const server = app.listen(process.env.PORT, () => {
      console.log('App is running');
    });

    const wss = appWs(server);

    appEm(settings, wss);
  })
  .catch(err => {
    console.error(err)
  })

