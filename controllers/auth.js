const bcrypt = require('bcryptjs');
const crypto =require('crypto');
const nodemailer=require('nodemailer');
const sendgridtransport=require('nodemailer-sendgrid-transport');
const User = require('../models/user');

const{ validationResult }= require('express-validator');

//the transporter gets configured
const transporter=nodemailer.createTransport(sendgridtransport({
  auth:{
    api_key:'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'
  }
})
)

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false
  });
};


exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.redirect('/login');
      }
      bcrypt
          .compare(password, user.password)
          .then(doMatch => {
            if (doMatch) {
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save(err => {
                  console.log(err);
                  res.redirect('/');
              });
            }
            res.redirect('/login');
          })
          .catch(err => {
              console.log(err);
              res.redirect('/login');
          });
      })
      .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors=validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false
  });
  }
  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        // .then(result => {
        //   res.redirect('/login');
        //   return transporter.sendMail({
        //     to:email,
        //     from:'Ecommerce_business.com',
        //     subject:'Signup Sucess',
        //     html:'<h1>Sign in alert</h1>'
        //   });
         
        // });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset=(req,res,next)=>{
  res.render('auth/reset',{
    path:'/reset',
    pageTitle:'Reset Password'
  })
}

exports.postReset=(req,res,next)=>{
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      
      return res.redirect('/reset');
    }
    const token=buffer.toString('hex');
    User.findOne({email:req.body.email})
    .then(user=>{
      if(!user){
       
        return res.redirect('/reset');
      }
      user.resetToken=token;
      user.resetTokenExpiration=Date.now()+3600000;
      return user.save();
    })
    .then(result=>{
      res.redirect('/');
      return transporter.sendMail({
        to:req.body.email,
        from:'Ecommerce_business.com',
        subject:'Password Reset',
        html:`
        <p>The password reset link: </p>
        <p><a href="http://localhost:3000/reset/${token}">Password Reset Link</a></p>
        `
      });

    })
    .catch(err=>{
      console.log(err);
    })

  })
}