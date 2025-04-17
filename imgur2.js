const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "imgur",
    version: "1.1",
    author: "Jubayer",
    countDown: 10,
    role: 0,
    shortDescription: "Upload images/videos to Imgur",
    longDescription: "Reply to a photo/gif/video with {pn}imgur to upload to Imgur",
    category: "utility",
    guide: "{pn}imgur"
  },

  onReply: async function ({ event, message }) {
    if (event.type !== "message_reply") return;
    const replyMessage = event.body.toLowerCase();
    if (!replyMessage.includes("imgur")) return;

    try {
      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return message.reply("❌ | No image/GIF/video replied to!");
      }

      const clientId = process.env.IMGUR_CLIENT_ID || "6f1378a5a0c652e";
      const links = [];

      for (const attachment of attachments) {
        if (!["photo", "animated_image", "video"].includes(attachment.type)) {
          continue;
        }

        // Validate file size
        const maxFileSize = attachment.type === "video" ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
        const imageResponse = await axios.get(attachment.url, { responseType: "arraybuffer" });
        if (imageResponse.data.length > maxFileSize) {
          message.reply(`❌ | File too large! Max size: ${maxFileSize / (1024 * 1024)}MB`);
          continue;
        }

        // Upload to Imgur
        const formData = new FormData();
        formData.append("image", Buffer.from(imageResponse.data, "binary"));
        const uploadResponse = await axios.post("https://api.imgur.com/3/image", formData, {
          headers: {
            Authorization: `Client-ID ${clientId}`,
            ...formData.getHeaders()
          }
        });

        if (uploadResponse.data.success) {
          links.push(uploadResponse.data.data.link);
        }
      }

      if (links.length > 0) {
        message.reply(`✅ | Successfully uploaded to Imgur!\n🔗 Links:\n${links.join("\n")}`);
      } else {
        message.reply("❌ | No files could be uploaded.");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 429) {
        return message.reply("❌ | Imgur API rate limit exceeded. Please try again later.");
      }
      if (error.response) {
        return message.reply(`❌ | Imgur API error: ${error.response.data.data.error || error.message}`);
      }
      if (error.request) {
        return message.reply("❌ | Network error: Could not connect to the server.");
      }
      message.reply(`❌ | An error occurred: ${error.message}`);
    }
  }
};
