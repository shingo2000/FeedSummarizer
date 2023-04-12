const slackChannelName = "○○○"
const slackApiToken = '○○○'
const feedlyAccessToken = '○○○'
const feedlyStreamId = "user/○○○/category/○○○"
const gptApiKey = '○○○'

function task(){
  let feedList = getNewFeedList();
  postSlack('☀ 今日のニュースフィードです。', slackChannelName)
  let messageCount = 0
  feedList.items.forEach(function(item){
    let url = item.canonicalUrl || item.originId
    let article
    if(item.content){
      article = item.content.content
    }else{
      article = getArticle(url)
    }

    if(article){
      let summary = gptSummarize(item.title, article)
      
      if(summary){
        messageCount += 1
        let message =  "*" + messageCount + "： <" + url + "|" + item.title + ">*\n```" + summary + '\n```'
        postSlack(message, slackChannelName)
      }
    }
  })
}

// FeedlyからのFeedの取得

function getNewFeedList() {
  return getMixesConntents(feedlyAccessToken, feedlyStreamId)
}

function getMixesConntents(accessToken, streamId) {
  // 過去24時間のおすすめコンテンツを10件取得
  let param = encodeURIComponent(streamId) + "&count=10&hours=24"
  return requestFeedlyGetApi(accessToken,'/v3/mixes/contents?streamId=' + param)
}

function requestFeedlyGetApi(accessToken, api) {
  let url = 'https://cloud.feedly.com' + api
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken,
  };
  let options = {
    'method' : 'get',
    'headers' : headers,
  };
  var response = JSON.parse(UrlFetchApp.fetch(url,options).getContentText());
  return response
}


// URLから本文を取得

function getArticle(url){
  url = getRedirect(url)
  let options = {
    'method':'get',
    'headers':{
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Encoding':'gzip, deflate, br',
      'Accept-Language': 'ja',
      'Cache-Control':'no-cache'
    }
  }
  try{
    let res = UrlFetchApp.fetch(url, options).getContentText("UTF-8")
    // 本文と関係なさそうなタグを除去
    res = res.replace(/(<(head|script|style|header|footer|nav|iframe|aside)[^>]*>([\s\S]*?)<\/(head|script|style|header|footer|nav|iframe|aside)>)/g, '')
    // htmlタグを除去
    res = res.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'')
    // 連続する改行やスペースを除去
    res = res.replace(/\s{2,}/g, ' ');
    return res

  }catch(error){
    Logger.log(error)
    return null
  }
}

function getRedirect(url) {
  Logger.log(['getRedirect', url])
  var response = UrlFetchApp.fetch(url, {'followRedirects': false, 'muteHttpExceptions': false})
  var redirectUrl = response.getHeaders()['Location']
  var responseCode = response.getResponseCode()
  if (redirectUrl && redirectUrl != url) {
    var nextRedirectUrl = getRedirect(redirectUrl)
    return nextRedirectUrl
  } else {
    return url
  }
}


// GPTでの要約

function gptSummarize(title, article){
  let system = 
`与えられた文章の要点を3点のみでまとめ、以下のフォーマットで日本語で出力してください。
タイトルの日本語訳
・要点1
・要点2
・要点3`
  let user = 'title: ' + title + '\nbody: ' + article.substring(0,2000)

  return gptRequestCompletion([
    {"role": "system", "content": system},
    {"role": "user", "content": user}
  ])
}
function gptRequestCompletion(messages) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  let headers = {
    'Authorization':'Bearer '+ gptApiKey,
    'Content-type': 'application/json',
    'X-Slack-No-Retry': 1
  };

  let options = {
    'muteHttpExceptions' : true,
    'headers': headers, 
    'method': 'POST',
    'payload': JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': messages})
  };

  const response = JSON.parse(UrlFetchApp.fetch(apiUrl, options).getContentText());

  try {
    let text = response.choices[0].message.content;
    return text;
  }catch(error){
    Logger.log(error);
    return null
  }

}

// Slackへの投稿

function postSlack(text, channelName){
  let payload = {
    "token" : slackApiToken,
    "channel" : channelName,
    "as_user" : true,
    "text" : text
  }
  var options =
   {
     "method" : "post",
     "payload" : payload
   };
  var response = UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
  return JSON.parse(response.getContentText());
}
