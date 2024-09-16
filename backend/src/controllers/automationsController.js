const automationsRepository = require('../repositories/automationsRepository');

async function startAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (automation.isActive) return res.sendStatus(204);

  automation.isActive = true;

  // if (automation.schedule) {
  //     try {
  //         agenda.addSchedule(automation.get({ plain: true }));
  //     } catch (err) {
  //         return res.status(422).json(err.message);
  //     }
  // }
  // else
  //     beholder.updateBrain(automation.get({ plain: true }));

  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has started!`);

  res.json(automation);
}

async function stopAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  if (!automation.isActive) return res.sendStatus(204);

  // if (automation.schedule)
  //     agenda.cancelSchedule(automation.id);
  // else
  //     beholder.deleteBrain(automation.get({ plain: true }));

  automation.isActive = false;
  await automation.save();

  if (automation.logs) logger('A:' + automation.id, `Automation ${automation.name} has stopped!`);

  res.json(automation);
}

async function getAutomation(req, res, next) {
  const id = req.params.id;
  const automation = await automationsRepository.getAutomation(id);
  res.json(automation);
}

async function getAutomations(req, res, next) {
  const page = req.query.page;
  const result = await automationsRepository.getAutomations(page);
  res.json(result);
}

async function insertAutomation(req, res, next) {
  const newAutomation = req.body;
  const savedAutomation = await automationsRepository.insertAutomation(newAutomation);

  if (savedAutomation.isActive) {
    // atualiza cérebro do beholder
  }

  res.status(201).json(savedAutomation.get({ plain: true }));
}

async function updateAutomation(req, res, next) {
  const id = req.params.id;
  const newAutomation = req.body;
  const updatedAutomation = await automationsRepository.updateAutomation(id, newAutomation);

  if (updatedAutomation.isActive) {
    // avisar o beholder
  }

  res.json(updatedAutomation);
}

async function deleteAutomation(req, res, next) {
  const id = req.params.id;
  const currentAutomation = await automationsRepository.getAutomation(id);
  if (currentMonitor.isSystemMon) return res.sendStatus(403);

  if (currentMonitor.isActive) {
    // limpar beholder
  }

  await automationsRepository.deleteAutomation(id);
  res.sendStatus(204);
}

module.exports = {
  startAutomation,
  stopAutomation,
  getAutomation,
  getAutomations,
  insertAutomation,
  updateAutomation,
  deleteAutomation
} 