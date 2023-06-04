//jshint esversion:6
import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import pkg from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import encrypt from "mongoose-encryption";

const { urlencoded } = pkg;

const app = express();
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB connect
const dbConnect = async function () {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
    console.log("Connected to userDB");
  } catch (err) {
    console.error(err);
  }
};
dbConnect();

// DB schema, model

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
});

// Encrypt

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: ["password"],
});

const User = mongoose.model("User", userSchema);

app.route("/").get((req, res) => {
  res.render("home");
});

// Register
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post(async (req, res) => {
    try {
      const { username, password } = req.body;
      let user = await User.findOne({ username: username });
      console.log(user);
      if (!user) {
        user = new User({ username: username, password: password });
        await user.save();
        res.render("secrets");
      } else {
        throw new Error(`User ${username} already exist.`);
      }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

// Login
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post(async (req, res) => {
    try {
      const user = await User.findOne({ username: req.body.username });
      console.log(user);

      if (user.password !== req.body.password) {
        throw new Error("Wrong user or password.");
      } else {
        res.render("secrets");
      }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

app.route("/logout").get((req, res) => {
  res.redirect("/");
});

app.listen("3000", () => console.log("Server started on port 3000."));
