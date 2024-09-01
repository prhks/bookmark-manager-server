const { model, Schema } = require("mongoose");

const bookmarkSchema = new Schema({
  image: String,
  url: String,
  title: String,
  description: String,
  username: String,
  createdAt: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
  },
});

module.exports = model("Bookmark", bookmarkSchema);
