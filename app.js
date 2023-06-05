//jshint esversion:6
import "dotenv/config";
import mongoose from "mongoose";
import express from "express";
import pkg from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
// import encrypt from "mongoose-encryption";
// import md5 from "md5";

const { urlencoded } = pkg;

const app = express();
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saltRounds = 12;

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

// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"],
// });

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
      if (!user) {
        const hash = await bcrypt.hash(password, saltRounds);
        user = new User({ username: username, password: hash });
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
      if (!user) throw new Error("User does not exist.");
      const match = await bcrypt.compare(req.body.password, user.password);

      if (match) {
        res.render("secrets");
      } else {
        throw new Error("Wrong password.");
      }
      // if (user.password !== md5(req.body.password)) {
      //   throw new Error("Wrong user or password.");
      // } else {
      //   res.render("secrets");
      // }
    } catch (err) {
      console.log(err);
      res.send(err.message);
    }
  });

app.route("/logout").get((req, res) => {
  res.redirect("/");
});

app.listen("3000", () => console.log("Server started on port 3000."));
