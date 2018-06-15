# Negative Keywords By Sentiment AdWords Script

This script excludes search queries with a negative sentiment.

The [Watson Natural Language Understanding API](https://www.ibm.com/watson/services/natural-language-understanding/) is used to run the sentiment analysis.

## Setup

Before running this script, create an [IBM Cloud account](https://console.bluemix.net/registration/) and set up a Bluemix Natural Language Understanding Service.

Other than setting your variables before the function, you can also limit the script to specific campaigns with this regular expression:

```javascript
// Select only certain campaigns
// Useful for multilingual campaigns
var campaignName = row['CampaignName']
if (campaignName.match( /(?=.*-en-)/ )){
```

## Limitations

- Brand terms affect the sentiment analysis.
  - I would probably recommend running this on generic campaigns to start.
  - Having the script only exclude highly negative queries (SENTIMENT_SCORE of -0.8 to -0.9) also mitigates this
- Language affects the sentiment analysis.
  - The Natural Language Understanding API supports multiple languages but struggles when queries contain more than one.
    - For example, English brand + French queries isn't ideal.
  - The script can be easily modified for multilingual campaigns using the regular expression mentioned above and the "&language=" URL parameter
