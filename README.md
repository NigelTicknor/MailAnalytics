# MailReadChecker
This is a proof of concept server to track the reading of emails that you send using NodeJS.


Before you run this, set up your database by running mailchecker.sql file, then copy config-example.json to config.json and change the values to your own.


**Basic Usage:**
1. Import mailchecker.sql into your DB. This will set up the tables and procedures. This file was built on MariaDB 10, but should be compatible with MySQL.
2. Copy config-example.json to config.json and edit it with your own values.
3. Run `npm install`

The server will run on its own, but you can also just copy/paste the code into your existing Express server if you'd rather do that.

**Endpoints:**
* /email/\<id>/\<emailMD5> - Returns a PNG image with the amount of times the email has been viewed. This is really just for testing.
* /secret/\<id>/\<emailMD5> - Returns a 1px/1px transparent PNG. This is what you will generally use as your analytics checker.
* /count/\<id> - Returns the PNG of the amount of times the email has been viewed, but doesn't increment it.
