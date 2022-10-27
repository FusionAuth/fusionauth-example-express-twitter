var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var passport = require("passport");
var OAuth2Strategy = require("passport-oauth2").Strategy;
var passOAuth = require("passport-oauth2");
var { FusionAuthClient } = require("@fusionauth/typescript-client");
var session = require("express-session");
const { ensureLoggedIn } = require('connect-ensure-login');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: "TOPSECRET" }));
app.use(passport.initialize());
app.use(passport.session());

const fusionClient = new FusionAuthClient(
  "<YOUR_FUSION_API_KEY>",
  "https://<YOUR_FUSIONAUTH_URL>"
);

passport.use(
  new OAuth2Strategy(
    {
      authorizationURL: "https://<YOUR_FUSIONAUTH_URL>/oauth2/authorize",
      tokenURL: "https://<YOUR_FUSIONAUTH_URL>/oauth2/token",
      clientID: "<YOUR_FUSIONAUTH_APP_CLIENTID>",
      clientSecret: "<YOUR_FUSIONAUTH_APP_CLIENT_SECRET>",
      callbackURL: "http://localhost:3000/auth/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      // Get the user profile from Fusion:
      fusionClient
        .retrieveUserUsingJWT(accessToken)
        .then((clientResponse) => {
          console.log(
            "User:",
            JSON.stringify(clientResponse.response.user, null, 2)
          );
          return cb(null, clientResponse.response.user);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  )
);

passport.serializeUser(function (user, done) {
  process.nextTick(function () {
    done(null, user);
  });
});

passport.deserializeUser(function (user, done) {
  process.nextTick(function () {
    done(null, user);
  });
});

app.use('/', indexRouter);
app.get("/login", passport.authenticate("oauth2"));
app.get(
  "/auth/callback",
  passport.authenticate("oauth2", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.use('/users', ensureLoggedIn('/login'), usersRouter);

/* logout home page. */
app.get('/logout', function (req, res, next) {
  req.session.destroy();
  res.redirect(302, '/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
