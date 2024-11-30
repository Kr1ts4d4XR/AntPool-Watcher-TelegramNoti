require('dotenv').config();
const https = require("https");

const apiUrl = "https://mempool.space/api/v1/blocks";
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

let lastHeight = 0;

function fetchBlockData() {
  https.get(apiUrl, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const blocks = JSON.parse(data);

        if (blocks && blocks.length > 0) {
          const latestBlock = blocks[0];
          const currentHeight = latestBlock.height;

          if (currentHeight > lastHeight && latestBlock.extras?.pool?.name === "AntPool") {
            sendTelegramMessage(latestBlock);
            lastHeight = currentHeight;
          }
        }
      } catch (error) {
        console.error("Error parsing JSON:", error.message);
      }
    });
  }).on("error", (err) => {
    console.error("Error fetching API:", err.message);
  });
}

function sendTelegramMessage(block) {
  const message = `🚨 *New Block Detected!* 🚨\n` +
                  `*Height:* ${block.height}\n` +
                  `*Pool Name:* ${block.extras.pool.name}`;

  const postData = JSON.stringify({
    chat_id: telegramChatId,
    text: message,
    parse_mode: "Markdown"
  });

  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  const req = https.request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  }, (res) => {
    res.on("data", (chunk) => {
      console.log(`Response: ${chunk}`);
    });
  });

  req.on("error", (error) => {
    console.error(`Error sending Telegram message: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

setInterval(fetchBlockData, 10000);
