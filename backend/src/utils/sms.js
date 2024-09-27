module.exports = (settings, message) => {
  if (!settings) throw new Error('The settings object is required to send SMS!');
  if (!settings.twilioSid
    || !settings.twilioToken
    || !settings.twilioPhone
    || !settings.phone)
    throw new Error('The Twilio settings are required to send SMS!');

  const client = require('twilio')(settings.twilioSid, settings.twilioToken);

  return client.messages.create({
    to: settings.phone,
    from: settings.twilioPhone,
    body: message
  })
}