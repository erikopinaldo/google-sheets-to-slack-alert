// Parameter for getRange() is the column of dates that buildRow() will look through. Editing the spreadsheet's date column directly means this value should be updated as well.
let dateColumn = SpreadsheetApp.getActive().getSheetByName('Data').getRange("A1:A").getValues();
let agentColumn = 2 

// Parent function 
function buildStandupOwner() {
  
  let slackUserList = listUsers()
  
  const ss = SpreadsheetApp.getActive();
  
  // Check the date of the following Monday
  let nextMonday = getNextDayOfTheWeek("Monday", false) 
  
  // Gets row number containing next Monday's date
  let rowNumber = buildRow(nextMonday) 
  
  // Check if next Monday's date exists in the chosen date column. If it doesn't exist yet, tell readers to check the spreadsheet manually. 
  try {
    data = ss.getSheetByName('Data').getRange(rowNumber, agentColumn).getValues().toString(); // Gets the cell value in column in row that matches next Monday's date (string)
  }
  catch(e) {
    Logger.log(e)
    data = "Please check the spreadsheet!"
    }

  // Variable "data" needs to be a string
  let payload = buildAlert(data); 
  sendAlert(payload);
}

// https://stackoverflow.com/questions/33078406/getting-the-date-of-next-monday
function getNextDayOfTheWeek(dayName, excludeToday = true, refDate = new Date()) {
    const dayOfWeek = ["sun","mon","tue","wed","thu","fri","sat"]
                      .indexOf(dayName.slice(0,3).toLowerCase());
    if (dayOfWeek < 0) return;
    refDate.setHours(0,0,0,0);
    refDate.setDate(refDate.getDate() + +!!excludeToday + 
                    (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
    return refDate;
}

function buildRow(nextMonday) {
  let row = 0

  dateColumn.forEach((date, index) => {
    if (date.toString() === nextMonday.toString()) {
      row += index + 1
    }
  })

  return row
}

function buildAlert(data) {
  let payload = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": ":bell: *Standup Owner: * :bell:"
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": data
        }
      }
    ]
  };
  return payload;
}

function listUsers() {
  let token = ""; //https://api.slack.com/apps
  let apiEndpoint = "https://slack.com/api/";
  // var myUserID = MYUSERID;

  let method = "users.list";
  let payload = {token: token};

  Logger.log(payload);

  let completeUrl = apiEndpoint + method;
  let jsonData = UrlFetchApp.fetch(completeUrl, {method: "post", payload: payload});
  let membersFullArr = JSON.parse(jsonData).members;

  let memberList = membersFullArr.map(member => member.profile.real_name)
  Logger.log(memberList);
}

function sendAlert(payload) {
  const webhook = ""; // Webhook URL
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
  catch(e) {
    Logger.log(e);
  }
}