// dateColumnRange is the column of dates that buildRow() will get values for, which will later be filtered down to only "next Monday's" date. Editing the spreadsheet's date column directly means this value should be updated as well
let sheetName =  "Data"
let dateColumnRange = "A1:A"
let dateColumnValues = SpreadsheetApp.getActive().getSheetByName(sheetName).getRange(dateColumnRange).getValues();

// agentColumnNumber is the column number for the column that contains all of the agents names (zero-based indices)
let agentColumnNumber = 2


// Parent function 
function notifyStandupHost() {
  // Tells script to look at the Google Sheet that the script is anchored to
  const ss = SpreadsheetApp.getActive();
  
  // Check the date of the following Monday based on "today's" date
  let nextMonday = getNextMonday("Monday", false) 
  
  // Gets row number containing next Monday's date (zero-based indices)
  let nextMondayRowNumber = buildRow(nextMonday) 
  
  // Check if next Monday's date exists in the chosen date column. If it doesn't exist yet, tell readers to check the spreadsheet manually 
  try {
    sheetHost = ss.getSheetByName(sheetName).getRange(nextMondayRowNumber, agentColumnNumber).getValues().toString(); // Gets the cell value in column in row that matches next Monday's date (string)

  // Get list of all users in workspace
  let slackUserList = listUsers()

  // host is a Slack user ID that will be passed as a mention in the Slack message. Obtained by matching host name from Sheet to user name from slackUserList
  let slackHost = buildSlackHost(sheetHost, slackUserList)
  }
  catch(e) {
    Logger.log(e)
    slackHost = "No host found. Please check the spreadsheet!"
  }
  
  // Build the payload for the Slack message sent via incoming webhook
  let payload = buildAlert(slackHost); 
  sendAlert(payload);
}

// https://stackoverflow.com/questions/33078406/getting-the-date-of-next-monday
function getNextMonday(dayName, excludeToday = true, refDate = new Date()) {
    const dayOfWeek = ["sun","mon","tue","wed","thu","fri","sat"]
                      .indexOf(dayName.slice(0,3).toLowerCase());
    if (dayOfWeek < 0) return;
    refDate.setHours(0,0,0,0);
    refDate.setDate(refDate.getDate() + +!!excludeToday + 
                    (dayOfWeek + 7 - refDate.getDay() - +!!excludeToday) % 7);
    return refDate;
}

function buildRow(nextMondayRowNumber) {
  let row = 0
  dateColumnValues.forEach((date, index) => {
    if (date.toString() === nextMondayRowNumber.toString()) {
      row += index + 1
    }
  })
  return row
}

// https://api.slack.com/methods/users.list
function listUsers() {
  try {
    // Request set up
    const token = ""; //https://api.slack.com/apps
    let apiEndpoint = "https://slack.com/api/";
    let method = "users.list";
    let payload = {token: token};
    Logger.log("listUsers() payload: " + payload);

    let completeUrl = apiEndpoint + method;

    // Make request and store response in membersFullArr
    let jsonData = UrlFetchApp.fetch(completeUrl, {method: "post", payload: payload});
    let membersFullArr = JSON.parse(jsonData).members;

    // Convert membersFullArr to simpler, shorter, user list (key = real name, value = user ID)
    let userList = membersFullArr.map(member => {
        const container = {}
        container[member.profile.real_name] = member.id

        return container
      })
    Logger.log(userList);
    return userList
  }
  catch(e) {
    Logger.log("listUsers(): " + e)
  }
}

// Search for host user ID in spreadsheet within the array of users we got from Slack
function buildSlackHost(sheetHost, slackUserList) {
  let hostID = ""
  
  // From the full workspace user/user ID object list, get the key value pair that corresponds to the host that is listed in the spreadsheet.
  let member = slackUserList.find(memberObject => memberObject.hasOwnProperty(sheetHost))[sheetHost]

  hostID += `<@${member}>`
  return hostID
}

function buildAlert(slackHost) {
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
          "text": slackHost
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