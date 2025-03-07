const path = require('path');
const fs=require('fs');
const https =require('https');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csurf=require('csurf');
const multer=require('multer');
const helmet=require('helmet');
const compression=require('compression');
const morgan=require('morgan')

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.26upo.mongodb.net/${process.env.MONGO_DEFAULT_DB}`;

const csrfProtection=csurf();

const fileStorage=multer.diskStorage({
  destination: (req,file,cb)=>{
      cb(null,'images');
  },
  filename:(req,file,cb)=>{
    cb(null,file.filename+'-'+ file.originalname);
  }
})

const fileFilter=(req,file,cb)=>{
  if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg')
  {
    cb(null,true);
  }
  else{
    cb(null,false);
  }
  
  
}

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream }));
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { fstat } = require('fs');
const { Stream } = require('stream');




app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({dest:'images/',storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);

const privateKey=fs.readFileSync('server.key');
const certificate=fs.readFileSync('server.cert');


app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken=req.csrfToken();
    next();
})

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI, 
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
      console.log("Database Connected!");
      https.createServer({key:privateKey,cert:certificate},app).listen(process.env.PORT || 3000);
    })
    .catch(err => {
      console.log(err);
  });
