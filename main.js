let sheetName = 'Data'
let currentWeekCell = SpreadsheetApp.getActive().getSheetByName(sheetName).getRange('C2')

// Parent function 
function notifySchedule() {
  let currentWeekValue = currentWeekCell.getValue()
  Logger.log(`Current week value: ${currentWeekValue}`)
  let schedules = {
    1: 'https://res.cloudinary.com/dqonprzjw/image/upload/v1668527388/Slack%20Schedules/week1_wg6qb5.png',
    2: 'https://res.cloudinary.com/dqonprzjw/image/upload/v1668527397/Slack%20Schedules/week2_nvo0wl.png',
    3: 'https://res.cloudinary.com/dqonprzjw/image/upload/v1668527405/Slack%20Schedules/week3_y3fzpq.png'
  }

  Logger.log(`Is it Monday? ${isMonday()}`)

  // Check if today is Monday
  if (isMonday()) {
    if (currentWeekValue === 3) currentWeekCell.setValue(1)
    else currentWeekCell.setValue(currentWeekValue + 1)
  }

  // Build the payload for the Slack message sent via incoming webhook
  let payload = buildAlert(schedules[currentWeekValue]);
  Logger.log(`Payload: ${payload.schedule}`)
  sendAlert(payload);
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
  const webhook = "https://hooks.slack.com/workflows/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"; // Webhook URL
  var options = {
    "method": "post",
    "contentType": "application/json",
    "muteHttpExceptions": true,
    "payload": JSON.stringify(payload)
  };

  try {
    let call = UrlFetchApp.fetch(webhook, options);

    let response = JSON.stringify(call.getAllHeaders());
    let status = JSON.stringify(call.getContentText())

    Logger.log(`HTTP response status: ${status}`)
    Logger.log(`HTTP response headers: ${response}`);
  }
  catch (e) {
    Logger.log(`sendAlert() error: ${e}`);
  }
}