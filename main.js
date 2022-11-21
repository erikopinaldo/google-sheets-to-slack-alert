require('dotenv').config()

let sheetName = 'Data'
let currentWeekCell = SpreadsheetApp.getActive().getSheetByName(sheetName).getRange('C2')

// Parent function 
function notifySchedule() {
  Logger.log(`Current week value: ${currentWeekValue}`)
  let schedules = {
    1: PropertiesService.getScriptProperties().getProperty('SCHEDULE_1'),
    2: PropertiesService.getScriptProperties().getProperty('SCHEDULE_2'),
    3: PropertiesService.getScriptProperties().getProperty('SCHEDULE_3')
  }

  Logger.log(`Is it the weekend? ${isWeekend()}`)
  Logger.log(`Is it Monday? ${isMonday()}`)

  // Check if today is a weekend day
  if (isWeekend()) {
    return // early return should prevent the rest of the function from running, therefore preventing the workflow from firing
  }

  // Check if today is Monday
  if (isMonday()) {
    if (currentWeekValue === 3) {
      currentWeekValue = 1
      currentWeekCell.setValue(1)
    }
    else {
      currentWeekValue = currentWeekValue + 1
      currentWeekCell.setValue(currentWeekValue)
    }
  }

  let currentWeekValue = currentWeekCell.getValue()

  // Build the payload for the Slack message sent via incoming webhook
  let payload = buildAlert(schedules[currentWeekValue]);
  Logger.log(`Payload: ${payload.schedule}`)
  sendAlert(payload);
}

function isWeekend(date = new Date()) {
  return date.getDay() === 0 || date.getDay() === 6
}

function isMonday(date = new Date()) {
  return date.getDay() === 1;
}

function buildAlert(schedule) {
  let payload = {
    "schedule": schedule
  };
  return payload;
}

function sendAlert(payload) {
  const webhook = WEBHOOK_URL; // Webhook URL
  var options = {
    "method": "post",
    "contentType": "application/json",
    "muteHttpExceptions": true,
    "payload": JSON.stringify(payload)
  };

  try {
    let call = UrlFetchApp.fetch(webhook, options);

    let status = call.getResponseCode();
    let response = JSON.stringify(call.getAllHeaders());

    Logger.log(`HTTP response status: ${status}`)
    Logger.log(`HTTP response headers: ${response}`);
  }
  catch (e) {
    Logger.log(`sendAlert() error: ${e}`);
  }
}