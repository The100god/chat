const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.sendMessages = async (req, res) => {
  const [chatId, senderId, content] = req.body;

  try {
    const newMessage = new Message({
      chatId,
      sender: senderId,
      content,
    });

    const savedMessage = await newMessage.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });

    return res.status(200).json(savedMessage);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const message = await Message.find({
      chatId: req.params.userId,
    }).populate("sender", "-password");
    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json(error);
  }
};
