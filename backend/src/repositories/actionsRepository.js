const actionModel = require('../models/actionModel');

const actionsTypes = {
  ALERT_EMAIL: 'ALERT_EMAIL',
  ALERT_SMS: 'ALERT_SMS',
  ORDER: 'ORDER',
  GRID: 'GRID',
  WITHDRAW: 'WITHDRAW'
}

function insertActions(actions, transaction) {
  return actionModel.bulkCreate(actions, { transaction });
}

function deleteActions(automationId, transaction) {
  return actionModel.destroy({
    where: { automationId },
    transaction
  })
}

function getByOrderTemplate(orderTemplateId) {
  return actionModel.findAll({ where: { orderTemplateId } });
}

function getByWithdrawTemplate(withdrawTemplateId) {
  return actionModel.findAll({ where: { withdrawTemplateId } });
}

module.exports = {
  actionsTypes,
  insertActions,
  deleteActions,
  getByOrderTemplate,
  getByWithdrawTemplate
}