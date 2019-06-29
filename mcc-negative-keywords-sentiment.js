/**
*
* Exclude Keywords Based On Sentiment Analysis
*
* This script fetches search queries and excludes
* those that have a negative sentiment.
*
* Powered by Watson Natural Language Understanding
*
* Version: 1.0
*
* Google Ads Script maintained by Frederic Harnois
* fred@fredericharnois.com
*
**/

// Choose your accounts
var ACCOUNTS = "INSERT_CIDs"

// Filters queries by spend
// For $10, insert 10
var COST_THRESHOLD = INSERT_COST_THRESHOLD

// Choose your date range
// Choose from DateRangeLiteral here:
// https://developers.google.com/adwords/api/docs/guides/awql#formal_grammar 
var DATE_RANGE = "INSERT_DATE_RANGE"

// Negative sentiment ranges from 0 to -1
var SENTIMENT_SCORE = INSERT_SENTIMENT_SCORE

// Input your Bluemix Natural Language Understanding Service identification here
var USERNAME = "INSERT_USERNAME";
var PASSWORD = "INSERT_PASSWORD";

// DO NOT TOUCH
var MICRO_AMOUNT_MULTIPLIER = 1000000

function main() {

  // Get accounts within MCC
  var accountSelector = MccApp.accounts()
    
    // Selects accounts (CIDs)
    .withIds([ACCOUNTS]); 
  var accountIterator = accountSelector.get();
  
  // Iterate through the list of accounts
  while (accountIterator.hasNext()) {

    // Get account info
    var account = accountIterator.next();    
    var accountName = account.getName();
    
    // Select the client account
    MccApp.select(account);
    
    // Pull all relevant search queries
    var report = AdWordsApp.report(
      "SELECT Query,KeywordTextMatchingQuery,KeywordId,CampaignId,CampaignName,AdGroupId,QueryTargetingStatus,Clicks,Impressions,Cost" +
      " FROM SEARCH_QUERY_PERFORMANCE_REPORT" +
      " WHERE QueryTargetingStatus = " + "NONE" +
      " AND Cost > " + COST_THRESHOLD * MICRO_AMOUNT_MULTIPLIER +
      " DURING " + DATE_RANGE);
    var rows = report.rows();
    
    // Loop through the search queries
    while (rows.hasNext()) {
    
      // Get the next row  
      var row = rows.next();
      
      // Select only certain campaigns
      // Useful for multilingual campaigns
      var campaignName = row['CampaignName']
      if (campaignName.match( /(?=.*-en-)/ )){

        // Get the query   
        var query = row['Query'];
        Logger.log("Query: " + query);
        var encodedQuery = encodeURI(query);

        // Run the sentiment analysis
        var authHeader = 'Basic ' + Utilities.base64Encode(USERNAME + ':' + PASSWORD);
        var options = {headers: {Authorization: authHeader}}
        var response = UrlFetchApp.fetch(
          "https://gateway.watsonplatform.net/natural-language-understanding/api/v1/analyze?version=2017-02-27&text=" + 
          encodedQuery + 
          "&features=sentiment&language=en&concepts.limit=8&entities.limit=50&keywords.limit=50&relations.model=en-news&semantic_roles.limit=50", 
          options
          );

        // Parse the JSON response
        var json = response.getContentText();
        var sentimentData = JSON.parse(json);

        // Get the query's sentiment and score
        var sentimentType = sentimentData.sentiment.document.label;
        Logger.log("Sentiment: " + sentimentType);
        var sentimentScore = sentimentData.sentiment.document.score;
        Logger.log("Score: " + sentimentScore);

        // Filter for the strongly negative queries
        if (sentimentType.indexOf("negative") == 0 && sentimentScore < SENTIMENT_SCORE){
          
          // Get the campaign associated with the query
          var campaignId = row['CampaignId'];
          var campaignIterator = AdWordsApp.campaigns()
            .withIds([campaignId])
            .get();
          if (campaignIterator.hasNext()) {
            var campaign = campaignIterator.next();

            // Add the query as a phrase match negative
            campaign.createNegativeKeyword('"' + query + '"');
            Logger.log("Added " + query + " as a negative keyword in campaign: " + campaign.getName());

          }
        }
      }
    }
  }
}
