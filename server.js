const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const passport = require("passport");
const { Strategy } = require("passport-google-oauth20");
const cookieSession = require("cookie-session");

require("dotenv").config();

const PORT = 3000;

const config = {
  CLIENT_ID: process.env.CLIENT_ID,
  CLIENT_SECRET: process.env.CLIENT_SECRET,
  COOKIE_KEY_1: process.env.COOKIE_KEY_1,
  COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
  callbackURL: "/auth/google/callback",
  clientID: config.CLIENT_ID,
  clientSecret: config.CLIENT_SECRET,
};

function verifyCallBack(accessToken, refreshToken, profile, done) {
  console.log("Google Profile", profile);
  done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallBack));

// Save session to the cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Read session from the cookie
passport.deserializeUser((id, done) => {
  // Could be used to look up a user in the database
  // The first argument is the same one that the done function takes in the serialize method.

  // User.findById(id).then(user => {
  //   done(null, user)
  // })

  done(null, id);
});

app = express();

app.use(helmet());

app.use(
  cookieSession({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.COOKIE_KEY_1, config.COOKIE_KEY_2],
  })
);

app.use(passport.initialize());
app.use(passport.session()); // Sets up req.user for express

function checkLoggedIn(req, res, next) {
  console.log(`Current user: ${req.user}`);

  const isLoggedIn = req.isAuthenticated() && req.user;

  if (!isLoggedIn) {
    return res.status(401).json({
      error: "You need to log in.",
    });
  }

  next();
}

app.get(
  "/auth/google",
  passport.authenticate("google", {
    // scope: ["email", "profle"],
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/failure",
    successRedirect: "/",
    session: true,
  }),
  (req, res) => {
    console.log("Google called back.");
  }
);

app.get("/auth/logout", (req, res) => {
  req.logout(); // Remove req.uesr and terminate the existing session
  return res.redirect("/");
});

app.get("/secret", checkLoggedIn, (req, res) => {
  return res.send("Secret is 123");
});

app.get("/failure", (req, res) => {
  return res.send("Failed to log in.");
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

https
  .createServer(
    {
      key: fs.readFileSync("key.pem"),
      cert: fs.readFileSync("cert.pem"),
    },
    app
  )
  .listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
