const express = require('express')
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express()
const bodyParser = require('body-parser');
const db = require("./config/db");
const flash = require('connect-flash');
const logger = require('morgan');
const favicon = require('serve-favicon');
const path = require('path');

// Create an HTTPS server with TLS 1.2
const fs = require('fs');

// Create an HTTPS server with TLS 1.2
const https = require('https');

//Routers
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const dashboardRouter = require('./routes/dashboard');
const newPasswordRouter = require('./routes/newPassword');
const logoutRouter = require('./routes/logout');
const resetpasswordRouter = require('./routes/passwordReset');
const verificationCodeRouter = require('./routes/verificationCode');
const choosePasswordRouter = require('./routes/choosePassword');


app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static('public'))
app.use(logger('dev'))
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  name: 'LTDsession',
  secret: 'my-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 3600000 // 1 hour
  }
}));

app.use(flash());


app.use((req, res, next) => {
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  next();
});


app.use('/register', registerRouter);
app.use('/', loginRouter);
app.use('/dashboard', dashboardRouter);
app.use('/newPassword', newPasswordRouter);
app.use('/logout', logoutRouter);
app.use('/passwordReset', resetpasswordRouter);
app.use('/verificationCode', verificationCodeRouter);
app.use('/choosePassword', choosePasswordRouter);

// Connect to the database using the connect method
db.userDbConfig.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

const privateKeyPath = process.env.PRIVATE_KEY_PATH || 'utils/certificatFiles/localhost.key';
const certificatePath = process.env.CERTIFICATE_PATH || 'utils/certificatFiles/localhost.crt';

// Load the SSL certificate and private key
const privateKey = fs.readFileSync(privateKeyPath);
const certificate = fs.readFileSync(certificatePath);

// Create an HTTPS server with TLS 1.2
const server = https.createServer({ key: privateKey, cert: certificate, secureProtocol: 'TLSv1_2_method' }, app);

// Start the server and listen for incoming requests on port 443
const port = process.env.PORT || 443;
server.listen(port, () => {
  console.log(`HTTPS server running on ${port}`);
});