const gridModel = require('../models/gridModel');

function insertGrids(grids, transaction) {
  return gridModel.bulkCreate(grids, {
    transaction
  });
}

function deleteGrids(automationId, transaction) {
  return gridModel.destroy({
    where: { automationId },
    transaction
  })
}

function getByAutomationId(automationId) {
  return gridModel.findAll({ where: { automationId } });
}

module.exports = {
  insertGrids,
  deleteGrids,
  getByAutomationId
}