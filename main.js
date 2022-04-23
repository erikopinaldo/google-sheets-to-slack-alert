// Parameter for getRange() is the column of dates that buildRow() will look through. Editing the spreadsheet's date column directly means this value should be updated as well.
let sheetName =  "Data"
let dateColumnRange = "A1:A"
let dateColumnValues = SpreadsheetApp.getActive().getSheetByName(sheetName).getRange(dateColumnRange).getValues();
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
    sheetHost = ss.getSheetByName(sheetName).getRange(rowNumber, agentColumn).getValues().toString(); // Gets the cell value in column in row that matches next Monday's date (string)
  }
  catch(e) {
    Logger.log("buildStandoOwner(): " + e)
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

  dateColumnValues.forEach((date, index) => {
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
    // Request set up
    let token = ""; //https://api.slack.com/apps
    let apiEndpoint = "https://slack.com/api/";
    let method = "users.list";
    let payload = {token: token};
    Logger.log("listUsers() payload: " + payload);
    let completeUrl = apiEndpoint + method;

    // Set up payload for request
    let jsonData = UrlFetchApp.fetch(completeUrl, {method: "post", payload: payload});
    let membersFullArr = JSON.parse(jsonData).members;

    // Convert response to simple user list (key = real name, value = user ID)
    let memberList = membersFullArr.map(member => {
        const container = {}
        container[member.profile.real_name] = member.id

        return container
      })
    Logger.log(memberList);
    return memberList
  }
  catch(e) {
    Logger.log("listUsers(): " + e)
  }
}

// Search for host in spreadsheet within the array of users we got from Slack
function buildHost(sheetHost, slackUserList) {
  let hostID = ""
  
  // From the full workspace user/user ID object list, get the key value pair that corresponds to the host that is listed in the spreadsheet.
  let member = slackUserList.find(memberObject => memberObject.hasOwnProperty(sheetHost))[sheetHost]

  hostID += `<@${member}>`
  return hostID
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