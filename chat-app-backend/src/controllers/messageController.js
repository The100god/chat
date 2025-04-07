const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.sendMessages = async (req, res) => {
  const {chatId, senderId, content, receiverId} = req.body;

  try {
    const newMessage = new Message({
      chatId,
      sender: senderId,
      receiver:receiverId,
      content,
    });

    const savedMessage = await newMessage.save();
    await Chat.findByIdAndUpdate(chatId, { lastMessage: savedMessage._id });
 // Populate sender data
 const fullMessage = await savedMessage.populate("sender", "_id username profilePic");
    // Send the message to the receiver in real-time using Socket.io
    req.io.to(chatId.toString()).emit('newMessage', fullMessage);

    return res.status(200).json(fullMessage);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.getMessages = async (req, res) => {
  try {
    const message = await Message.find({
      chatId: req.params.chatId,
    }).populate("sender", "-password");
    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.markMessage = async (req, res) => {
  const { userId } = req.body;
  const { chatId } = req.params;

  try {
    await Message.updateMany(
      { chatId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.sendStatus(200);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: error.message });
  }
}
