const nodeSchedule = require('node-schedule');
const beholder = require('./beholder');
const automationRepository = require('./repositories/automationsRepository');
const logger = require('./utils/logger');

let AGENDA = {};

const LOGS = process.env.AGENDA_LOGS === 'true';

function init(automations) {
  AGENDA = {};

  automations.map(auto => {
    if (auto.isActive && auto.schedule) {
      addSchedule(auto.get({ plain: true }));
    }
  })
  if (LOGS) logger('system', `Beholder Agenda has started.`);
}

function verifyCron(schedule) {
  return /^(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$/.test(schedule);
}

async function runSchedule(id) {
  try {
    const automation = await automationRepository.getAutomation(id);
    let result = await beholder.evalDecision('', automation);
    result = result.filter(r => r);
    if (LOGS || automation.logs) logger('A:' + id, `The Scheduled Automation #${id} has fired at ${new Date()}.\nResult: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error(err);
  }
}

function addSchedule(automation) {
  if (!automation.schedule) return;

  if (verifyCron(automation.schedule)) {
    AGENDA[automation.id] = nodeSchedule.scheduleJob(automation.schedule, () => {
      runSchedule(automation.id);
    })
  } else {
    const date = Date.parse(automation.schedule);
    AGENDA[automation.id] = nodeSchedule.scheduleJob(date, () => {
      runSchedule(automation.id);
    })
  }

  if (LOGS || automation.logs) logger('A:' + automation.id, `The Scheduled Automation ${automation.id} (${automation.schedule}) was added to agenda at ${new Date()}`);
}

function cancelSchedule(id) {
  if (!AGENDA[id]) return;
  AGENDA[id].cancel();
  delete AGENDA[id];
  if (LOGS) logger('A:' + id, `The Scheduled Automation #${id} was deleted from agenda at ${new Date()}`);
}

function getAgenda() {
  return Object.entries(AGENDA).map(props => {
    return {
      id: props[0],
      next: props[1] ? props[1].nextInvocation() : null
    }
  })
}

module.exports = {
  init,
  addSchedule,
  cancelSchedule,
  getAgenda
}
