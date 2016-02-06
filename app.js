/**
 * Module dependencies.
 */
var express = require('express');
var hexi = require('hexi');
var favicon = require('serve-favicon');
var session = require('express-session');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var lusca = require('lusca');
var dotenv = require('dotenv');
var MongoStore = require('connect-mongo/es5')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var sass = require('node-sass-middleware');
var _ = require('lodash');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 *
 * Default path: .env (You can remove the path argument entirely, after renaming `.env.example` to `.env`)
 */
dotenv.load({ path: '.env.example' });

/**
 * Create Hexi server.
 */
var app = express();
var server = hexi();
app.use(server.express);

module.exports = server
.register([
  {
    register: require('hexi-static'),
  },
  {
    register: require('hexi-default'),
  },
])
.then(function() {
  server.route({
    method: 'USE',
    path: '/',
    config: {
      auth: false,
      detached: true,
    },
    handler:
      sass({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        sourceMap: true,
      }),
  });

  app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));

  server.route({
    path: '/',
    method: 'USE',
    config: {
      auth: false,
      detached: true,
    },
    handler: {
      static: {
        root: path.join(__dirname, 'public'),
        maxAge: 31557600000,
      },
    },
  });
  //app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

  /**
   * Connect to MongoDB.
   */
  mongoose.connect(process.env.MONGODB || process.env.MONGOLAB_URI);
  mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
  });

  /**
   * Express configuration.
   */
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.use(logger('dev'));

  server.beforeHandler(expressValidator());
  server.beforeHandler(session({
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      url: process.env.MONGODB || process.env.MONGOLAB_URI,
      autoReconnect: true
    })
  }));
  server.beforeHandler(passport.initialize());
  server.beforeHandler(passport.session());
  server.beforeHandler(flash());
  server.beforeHandler(lusca({
    csrf: true,
    xframe: 'SAMEORIGIN',
    xssProtection: true
  }));
  server.beforeHandler(function(req, res, next) {
    res.locals.user = req.user;
    next();
  });
  server.beforeHandler(function(req, res, next) {
    if (/api/i.test(req.path)) {
      req.session.returnTo = req.path;
    }
    next();
  });

  return server.register([
    {
      register: require('hexi-auth'),
    },
    {
      /**
       * API keys and Passport configuration.
       */
      register: require('./config/passport'),
    },
    {
      register: require('./controllers/home'),
    },
    {
      register: require('./controllers/user'),
    },
    {
      register: require('./controllers/contact'),
    },
    {
      register: require('./controllers/api'),
    },
  ]);
})
.then(function() {
  /**
   app.use(logger('dev'));
  * OAuth authentication routes. (Sign in)
 */
  server.route({
    method: 'GET',
    path: '/auth/instagram',
    config: {
      auth: false,
    },
    handler: passport.authenticate('instagram'),
  });
  server.route({
    method: 'GET',
    path: '/auth/instagram/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('instagram', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/facebook',
    config: {
      auth: false,
    },
    handler: passport.authenticate('facebook', { scope: ['email', 'user_location'] }),
  });
  server.route({
    method: 'GET',
    path: '/auth/facebook/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('facebook', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/github',
    config: {
      auth: false,
    },
    handler: passport.authenticate('github'),
  });
  server.route({
    method: 'GET',
    path: '/auth/github/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('github', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/google',
    config: {
      auth: false,
    },
    handler: passport.authenticate('google', { scope: 'profile email' }),
  });
  server.route({
    method: 'GET',
    path: '/auth/google/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('google', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/twitter',
    config: {
      auth: false,
    },
    handler: passport.authenticate('twitter'),
  });
  server.route({
    method: 'GET',
    path: '/auth/twitter/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('twitter', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/linkedin',
    config: {
      auth: false,
    },
    handler: passport.authenticate('linkedin', { state: 'SOME STATE' }),
  });
  server.route({
    method: 'GET',
    path: '/auth/linkedin/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authenticate('linkedin', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  /**
  * OAuth authorization routes. (API examples)
  */
  server.route({
    method: 'GET',
    path: '/auth/foursquare',
    config: {
      auth: false,
    },
    handler: passport.authorize('foursquare'),
  });
  server.route({
    method: 'GET',
    path: '/auth/foursquare/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authorize('foursquare', { failureRedirect: '/api' }),
      function(req, res) {
        res.redirect('/api/foursquare');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/tumblr',
    config: {
      auth: false,
    },
    handler: passport.authorize('tumblr'),
  });
  server.route({
    method: 'GET',
    path: '/auth/tumblr/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authorize('tumblr', { failureRedirect: '/api' }),
      function(req, res) {
        res.redirect('/api/tumblr');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/venmo',
    config: {
      auth: false,
    },
    handler: passport.authorize('venmo', { scope: 'make_payments access_profile access_balance access_email access_phone' }),
  });
  server.route({
    method: 'GET',
    path: '/auth/venmo/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authorize('venmo', { failureRedirect: '/api' }),
      function(req, res) {
        res.redirect('/api/venmo');
      },
    ],
  });

  server.route({
    method: 'GET',
    path: '/auth/steam',
    config: {
      auth: false,
    },
    handler: passport.authorize('openid', { state: 'SOME STATE' }),
  });
  server.route({
    method: 'GET',
    path: '/auth/steam/callback',
    config: {
      auth: false,
    },
    handler: [
      passport.authorize('openid', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect(req.session.returnTo || '/');
      },
    ],
  });

  /**
   * Error Handler.
   */
  app.use(errorHandler());

  /**
   * Start Express server.
   */
  app.listen(app.get('port'), function() {
    console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
  });

  return Promise.resolve(app);
})
.catch(function(err) {
  console.log(err)
  throw err;
});
