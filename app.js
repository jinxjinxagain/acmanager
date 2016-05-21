var express = require('express'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  flash = require('express-flash'),
  expressLayouts = require('express-ejs-layouts'),
  session = require('express-session'),
  mongoose = require('mongoose'),
  path = require('path'),
  fs = require('fs'),
  cfg = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json')));

mongoose.connect(cfg.mongodb.host);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', callback => console.log('Connected to mongodb %s', cfg.mongodb.host));

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(expressLayouts);

var passport = require('passport');
var User = require('./models/user');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routes/index'));

// app.use(function(req, res, next) {
//   if (!req.user) {
//     res.redirect('/login?return=' + req.path);
//   } else {
//     next();
//   }
// });

app.use('/users', require('./routes/users'));
app.use('/tags', require('./routes/tags'));
app.use('/problems', require('./routes/problems'));
app.use('/spider', require('./routes/spider'));
app.use('/contest', require('./routes/contest'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}

module.exports = app;