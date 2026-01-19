// ============================================
// LAB 1-2: Google Apps Script Project
// ============================================

// ============================================
// EXERCISE 1: Customer Email System
// Sends personalized emails from Google Sheets data
// ============================================

/**
 * Sends personalized HTML emails to customers from a Google Sheets file.
 * Sheet format: Column A = Name, Column B = Payment Amount, Column C = Email
 * 
 * SETUP: Replace SPREADSHEET_ID with your actual spreadsheet ID
 */
function sendCustomerEmails() {
  // TODO: Replace with your Spreadsheet ID (from the URL)
  var SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
  
  var file = DriveApp.getFileById(SPREADSHEET_ID);
  var spreadsheet = SpreadsheetApp.open(file);
  var sheet = spreadsheet.getSheets()[0];
  
  // Get all data from the sheet
  var data = sheet.getDataRange().getValues();
  
  // Load the HTML template
  var template = HtmlService.createTemplateFromFile("customer-email");
  
  // Skip header row, start from row 2 (index 1)
  for (var i = 1; i < data.length; i++) {
    var name = data[i][0];
    var amount = data[i][1];
    var email = data[i][2];
    
    // Skip empty rows
    if (!email || email === "") continue;
    
    // Set template variables
    template.customerName = name;
    template.paymentAmount = amount;
    
    // Generate HTML content
    var htmlBody = template.evaluate().getContent();
    
    // Send email
    GmailApp.sendEmail(email, "Payment Confirmation", "", {
      htmlBody: htmlBody
    });
    
    Logger.log("Email sent to: " + name + " (" + email + ")");
  }
  
  Logger.log("All customer emails sent successfully!");
}


// ============================================
// EXERCISE 2: Conference Registration Form
// Auto-sends confirmation when form is submitted
// ============================================

/**
 * Trigger function - runs when the Google Form is submitted.
 * Sends a confirmation email listing the sections the participant registered for.
 * 
 * SETUP:
 * 1. Open your Google Form
 * 2. Click ⋮ → Script editor
 * 3. Paste this code
 * 4. Go to Triggers → Add Trigger → onFormSubmit → From form → On form submit
 */
function onFormSubmit(e) {
  var response = e.response;
  var items = response.getItemResponses();
  
  var title = "";
  var fullName = "";
  var email = "";
  var sections = [];
  
  // Parse form responses
  items.forEach(function(item) {
    var question = item.getItem().getTitle().toLowerCase();
    var answer = item.getResponse();
    
    if (question.includes("title") || question.includes("titlu")) {
      title = answer;
    } else if (question.includes("name") || question.includes("nume")) {
      fullName = answer;
    } else if (question.includes("email") || question.includes("e-mail")) {
      email = answer;
    } else if (question.includes("section") || question.includes("secțiun")) {
      // Checkboxes return an array
      sections = Array.isArray(answer) ? answer : [answer];
    }
  });
  
  // Alternative: Get email from logged-in user (if form collects emails)
  if (!email || email === "") {
    email = e.response.getRespondentEmail();
  }
  
  // Send confirmation email
  var template = HtmlService.createTemplateFromFile("conference-confirmation");
  template.title = title;
  template.fullName = fullName;
  template.sections = sections;
  
  var htmlBody = template.evaluate().getContent();
  
  GmailApp.sendEmail(email, "Conference Registration Confirmation", "", {
    htmlBody: htmlBody
  });
  
  Logger.log("Confirmation sent to: " + fullName + " (" + email + ")");
}


// ============================================
// EXERCISE 3: Email-Based Registration (Advanced)
// Processes emails with subject "Conference Registration"
// ============================================

/**
 * Processes incoming registration emails and records them to a spreadsheet.
 * 
 * Expected email format:
 * Subject: Conference Registration
 * Body:
 *   Name: John Doe
 *   Sections: AI Workshop, Cloud Computing, Data Science
 * 
 * SETUP:
 * 1. Create a Google Sheet and copy its ID
 * 2. Replace REGISTRATION_SHEET_ID below
 * 3. Add a time-based trigger to run this function every 5-10 minutes
 */
function processRegistrationEmails() {
  // TODO: Replace with your Spreadsheet ID
  var REGISTRATION_SHEET_ID = "YOUR_REGISTRATION_SHEET_ID_HERE";
  
  // Search for unread emails with the specific subject
  var threads = GmailApp.search('subject:"Conference Registration" is:unread');
  
  if (threads.length === 0) {
    Logger.log("No new registration emails found.");
    return;
  }
  
  // Open the spreadsheet
  var spreadsheet = SpreadsheetApp.openById(REGISTRATION_SHEET_ID);
  var sheet = spreadsheet.getSheets()[0];
  
  // Add headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Name", "Email", "Sections", "Status"]);
  }
  
  var processedCount = 0;
  
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      
      // Skip if already read
      if (!message.isUnread()) continue;
      
      var body = message.getPlainBody();
      var senderEmail = extractEmail(message.getFrom());
      
      // Parse the email body
      var nameMatch = body.match(/Name:\s*(.+)/i);
      var sectionsMatch = body.match(/Sections:\s*(.+)/i);
      
      if (nameMatch && sectionsMatch) {
        var name = nameMatch[1].trim();
        var sections = sectionsMatch[1].trim();
        
        // Record to spreadsheet
        sheet.appendRow([
          new Date(),
          name,
          senderEmail,
          sections,
          "Confirmed"
        ]);
        
        // Send confirmation email
        sendRegistrationConfirmation(senderEmail, name, sections.split(","));
        
        // Mark email as read
        message.markRead();
        
        // Add label for organization (optional)
        var label = GmailApp.getUserLabelByName("Processed Registrations");
        if (!label) {
          label = GmailApp.createLabel("Processed Registrations");
        }
        threads[i].addLabel(label);
        
        processedCount++;
        Logger.log("Processed registration for: " + name);
      } else {
        Logger.log("Could not parse email from: " + senderEmail);
        // Mark as read anyway to avoid reprocessing
        message.markRead();
      }
    }
  }
  
  Logger.log("Total registrations processed: " + processedCount);
}

/**
 * Extracts email address from sender string like "John Doe <john@example.com>"
 */
function extractEmail(sender) {
  var match = sender.match(/<(.+)>/);
  return match ? match[1] : sender.trim();
}

/**
 * Sends a confirmation email for email-based registration
 */
function sendRegistrationConfirmation(email, name, sectionsArray) {
  var template = HtmlService.createTemplateFromFile("email-registration-confirmation");
  template.name = name;
  template.sections = sectionsArray.map(function(s) { return s.trim(); });
  
  var htmlBody = template.evaluate().getContent();
  
  GmailApp.sendEmail(email, "Registration Confirmed - Conference 2026", "", {
    htmlBody: htmlBody
  });
}


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test function - logs current user email
 */
function testSession() {
  Logger.log("Current user: " + Session.getActiveUser().getEmail());
}

/**
 * Test function - creates a sample file in Drive
 */
function testDrive() {
  var file = DriveApp.createFile("test.txt", "Hello from Apps Script!");
  Logger.log("File created: " + file.getUrl());
}

/**
 * Test function - fetches weather data
 */
function testWeatherAPI() {
  var lat = 47.6517; // Suceava coordinates
  var lon = 26.2556;
  var url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat +
            "&longitude=" + lon + "&current_weather=true";
  
  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());
  
  Logger.log("Temperature: " + data.current_weather.temperature + "°C");
  Logger.log("Wind Speed: " + data.current_weather.windspeed + " km/h");
}
