const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "imgur",
    version: "1.1",
    author: "Your Name",
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
        return message.reply("❌ | আপনি কোন ছবি/GIF/ভিডিও রিপ্লাই করেন নি!");
      }

      const clientId = process.env.IMGUR_CLIENT_ID || "6f1378a5a0c652e";
      const links = [];

      for (const attachment of attachments) {
        if (!["photo", "animated_image", "video"].includes(attachment.type)) {
          message.reply("❌ | শুধুমাত্র ছবি, GIF বা ভিডিও আপলোড করা যাবে!");
          continue;
        }

        // Validate attachment.url
        console.log("Attachment:", attachment); // Debug log
        if (!attachment.url || typeof attachment.url !== "string") {
          message.reply("❌ | Attachment URL is missing or invalid!");
          continue;
        }

        // Download the file
        const imageResponse = await axios.get(attachment.url, {
          responseType: "arraybuffer"
        });

        // Validate file size
        const maxFileSize = attachment.type === "video" ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
        if (imageResponse.data.length > maxFileSize) {
          message.reply(`❌ | ফাইলের আকার খুব বড়! সর্বোচ্চ আকার: ${maxFileSize / (1024 * 1024)}MB`);
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
        } else {
          message.reply("❌ | আপলোড ব্যর্থ হয়েছে, দয়া করে পরে আবার চেষ্টা করুন।");
        }
      }

      if (links.length > 0) {
        message.reply(`✅ | সফলভাবে Imgur-এ আপলোড করা হয়েছে!\n🔗 লিংক:\n${links.join("\n")}`);
      } else {
        message.reply("❌ | কোনো ফাইল আপলোড করা যায়নি।");
      }
    } catch (error) {
      console.error("Error details:", error.stack); // Log full error stack
      if (error.response && error.response.status === 429) {
        return message.reply("❌ | Imgur API রেট লিমিট অতিক্রম করেছে। দয়া করে পরে আবার চেষ্টা করুন।");
      }
      if (error.response) {
        return message.reply(`❌ | Imgur API ত্রুটি: ${error.response.data.data.error || error.message}`);
      }
      if (error.request) {
        return message.reply("❌ | নেটওয়ার্ক ত্রুটি: সার্ভারের সাথে সংযোগ করা যায়নি।");
      }
      message.reply(`❌ | একটি ত্রুটি ঘটেছে: ${error.message}`);
    }
  }
};
