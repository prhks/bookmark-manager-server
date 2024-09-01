const axios = require("axios");
const cheerio = require("cheerio");
const { AuthenticationError } = require("apollo-server");

const Bookmark = require("../../models/Bookmark");
const checkAuth = require("../../util/check-auth");
const { argsToArgsConfig } = require("graphql/type/definition");

module.exports = {
  Query: {
    async getBookmarks() {
      try {
        const bookmarks = await Bookmark.find().sort({ createdAt: -1 });
        return bookmarks;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getBookmark(_, { bookmarkId }) {
      try {
        const bookmark = await Bookmark.findById(bookmarkId);
        if (bookmark) {
          return bookmark;
        } else {
          throw new Error("Bookmark not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async searchBookmarks(_, { query }, context) {
      const user = checkAuth(context);

      try {
        if (!query) {
          throw new Error("Search query must not be empty");
        }

        // Perform the search operation using Mongoose
        const bookmarks = await Bookmark.find({
          title: { $regex: query, $options: "i" }, // Case-insensitive search
        }).sort({ createdAt: -1 }); // Sort by creation date, descending

        if (!bookmarks.length) {
          throw new Error("No bookmarks found matching the query");
        }

        return bookmarks;
      } catch (err) {
        console.error("Error searching bookmarks:", err);
        throw new Error("Error searching bookmarks");
      }
    },
  },
  Mutation: {
    async createBookmark(_, { url }, context) {
      const user = checkAuth(context);

      if (url.trim() === "") {
        throw new Error("Url must not be empty");
      }

      // Check if the URL already exists in the database
      const existingBookmark = await Bookmark.findOne({
        url,
        username: user.username,
      });
      if (existingBookmark) {
        throw new Error("Bookmark for this URL already exists.");
      }

      // Fetch the HTML content of the URL
      let html;
      try {
        const response = await axios.get(url);
        html = response.data;
      } catch (err) {
        throw new Error("Failed to fetch URL content");
      }

      // Load the HTML content into cheerio
      const $ = cheerio.load(html);

      // Extract and clean up metadata
      let title = $("title").text().trim() || "No Title";

      // remove symbols and extraneous text
      title = title
        .replace(/\|.*/g, "")
        .replace(/[\u21d2\u25ba\u25b6\u25b8\u25b4\u2192\u203a]+/g, "");

      const description =
        $('meta[name="description"]').attr("content") || "No Description";

      // Extract and prioritize favicon URLs based on size
      let image;
      const faviconLinks = $(
        'link[rel="apple-touch-icon"], link[rel="icon"], link[rel="shortcut icon"]'
      );

      let largestSize = 0;
      faviconLinks.each((_, elem) => {
        const sizes = $(elem).attr("sizes");
        let size = 0;

        if (sizes) {
          // Get the largest dimension (width or height)
          size = Math.max(...sizes.split("x").map(Number));
        }

        if (size > largestSize) {
          largestSize = size;
          image = $(elem).attr("href");
        }

        // Default to the first icon if sizes attribute is not present
        if (!sizes && !image) {
          image = $(elem).attr("href");
        }
      });

      // Convert relative URL to absolute URL
      if (image && !image.startsWith("http")) {
        const urlObject = new URL(url);
        image = urlObject.origin + image;
      } else if (!image) {
        image = "default-image-url"; // Fallback image URL
      }

      const newBookmark = new Bookmark({
        image,
        url,
        title,
        description,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString(),
      });

      const bookmark = await newBookmark.save();

      return bookmark;
    },
    async deleteBookmark(_, { bookmarkId }, context) {
      const user = checkAuth(context);

      try {
        const bookmark = await Bookmark.findById(bookmarkId);
        if (!bookmark) {
          throw new Error("Bookmark not found");
        }

        // Check if the bookmark has a username field
        if (!bookmark.username) {
          throw new Error("Bookmark is missing the username field");
        }

        // Compare user.username with bookmark.username
        if (user.username === bookmark.username) {
          await bookmark.deleteOne({ _id: bookmarkId });
          return "Bookmark deleted successfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
};
