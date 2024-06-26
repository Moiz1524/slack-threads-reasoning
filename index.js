const express = require("express")
const bodyParser = require('body-parser')
const crypto = require('crypto')


const app = express()

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET || "<plug-in-the-value-here>"

// Middleware to parse JSON body
app.use(bodyParser.json());

app.post('/welcome', (req, res) => {
  const challenge = req.body.challenge
  res.json({ challenge })
})

app.post("/connect", (req, res) => {
  const slackSignature = req.headers['x-slack-signature']
  const requestTimestamp = req.headers['x-slack-request-timestamp']
  const requestBody = req.rawBody

  const time = Math.floor(new Date().getTime() / 1000)

  
  // Check if the request is older than 5 minutes
  if (Math.abs(time - requestTimestamp) > 300) {
    return res.status(400).send('Ignore this request.')
  }

  // Create a base string as Slack does
  const sigBaseString = `v0:${requestTimestamp}:${requestBody}`

  // Create a HMAC hash using the signing secret
  const hmac = crypto.createHmac("sha256", slackSigningSecret)
  const mySignature = `v0=${hmac.update(sigBaseString).digest("hex")}`
  
  console.log(crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature)))

  if (crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
    res.status(200).send("Request verified.")
  } else {
    // res.status(400).send("Verification failed.")
    res.json({ text: "Connected with Node.js app." })
  }

  // TODO: Instantiate Slack API to get thread conversations and source message

})

app.listen(3000, () => {
  console.log("Listening on port 3000")
})