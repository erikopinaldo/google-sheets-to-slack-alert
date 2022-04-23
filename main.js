// Parameter for getRange() is the column of dates that buildRow() will look through. Editing the spreadsheet's date column directly means this value should be updated as well.
let dateColumn = SpreadsheetApp.getActive().getSheetByName('Data').getRange("A1:A").getValues();
let agentColumn = 2 

// Parent function 
function buildStandupOwner() {
  const ss = SpreadsheetApp.getActive();
  
  // Check the date of the following Monday
  let nextMonday = getNextDayOfTheWeek("Monday", false) 
  
  // Gets row number containing next Monday's date
  let rowNumber = buildRow(nextMonday) 
  
  // Check if next Monday's date exists in the chosen date column. If it doesn't exist yet, tell readers to check the spreadsheet manually. 
  try {
    sheetHost = ss.getSheetByName('Data').getRange(rowNumber, agentColumn).getValues().toString(); // Gets the cell value in column in row that matches next Monday's date (string)
  }
  catch(e) {
    Logger.log(e)
    sheetHost = "Please check the spreadsheet!"
  }
  
  // Get list of all users in workspace
  let slackUserList = listUsers()

  let host = buildHost(sheetHost, slackUserList)
  
  // Variable "host" needs to be a string
  let payload = buildAlert(host); 
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

// Get a list of workspace's users
// https://api.slack.com/methods/users.list
function listUsers() {
  try {
    let token = ""; //https://api.slack.com/apps
    let apiEndpoint = "https://slack.com/api/";

    let method = "users.list";
    let payload = {token: token};

    Logger.log(payload);

    let completeUrl = apiEndpoint + method;
  
    let jsonData = UrlFetchApp.fetch(completeUrl, {method: "post", payload: payload});
    let membersFullArr = JSON.parse(jsonData).members;

    let memberList = membersFullArr.map(member => member.profile.real_name)
    Logger.log(memberList);
    return memberList
  }
  catch(e) {
    Logger.log(e)
  }
}

// Search for host in spreadsheet within the array of users we got from Slack
function buildHost(sheetHost, slackUserList) {
  if (slackUserList.includes(sheetHost)) {
    return slackUserList.find(member => member === sheetHost)
  }
  else {
    Logger.log('No matching users found')
  }
}

function buildAlert(host) {
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
          "text": host
        }
      }
    ]
  };
  return payload;
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