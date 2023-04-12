# FeedSummarizer
Feedlyにフィード登録した英語記事から毎朝おすすめの記事を日本語要約して投稿するSlackボットです。
Feedly API、ChatGPT、Slack APIをGoogle Apps　Scriptから利用しています。

前提として以下の準備が必要です。
- Google Apps Scriptの利用
- Feedlyのアカウント登録とニュースフィードの追加
- Feedly APIのAccessTokenを取得
- Slackのアカウント登録とAPIのTokenの取得
- Open AIのアカウント登録とAPI Keyの取得

Google Apps Scriptから時間主導型のトリガーを設定して実行します。

解説記事： https://note.com/shingo2000/n/n227ccba3e2b8
