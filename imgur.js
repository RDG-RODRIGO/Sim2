const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "imgur",
    version: "1.0",
    author: "Jubayer",
    countDown: 10,
    role: 0,
    shortDescription: "Upload images/videos to Imgur",
    longDescription: "Reply to a photo/gif/video with {pn}imgur to upload to Imgur",
    category: "utility",
    guide: "{pn}imgur"
  },

  onStart: async function() {},

  onChat: async function({ event, message }) {
  },

  onReply: async function({ event, message, getLang, usersData, api }) {
    if (event.type !== "message_reply") return;
    
    const replyMessage = event.body.toLowerCase();
    if (!replyMessage.includes("imgur")) return;

    try {
      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return message.reply("❌ | আপনি কোন ছবি/GIF/ভিডিও রিপ্লাই করেন নি!");
      }

      const attachment = attachments[0];
      if (!["photo", "animated_image", "video"].includes(attachment.type)) {
        return message.reply("❌ | শুধুমাত্র ছবি, GIF বা ভিডিও আপলোড করা যাবে!");
      }

      const clientId = "6f1378a5a0c652e";
      
      const imageResponse = await axios.get(attachment.url, {
        responseType: "arraybuffer"
      });

      const formData = new FormData();
      formData.append("image", Buffer.from(imageResponse.data, "binary"));

      const uploadResponse = await axios.post("https://api.imgur.com/3/image", formData, {
        headers: {
          "Authorization": `Client-ID ${clientId}`,
          ...formData.getHeaders()
        }
      });

      if (uploadResponse.data.success) {
        const imgurLink = uploadResponse.data.data.link;
        message.reply(`✅ | সফলভাবে Imgur-এ আপলোড করা হয়েছে!\n🔗 লিংক: ${imgurLink}`);
      } else {
        message.reply("❌ | আপলোড ব্যর্থ হয়েছে, দয়া করে পরে আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error(error);
      message.reply("❌ | একটি ত্রুটি ঘটেছে: " + error.message);
    }
  }
};
