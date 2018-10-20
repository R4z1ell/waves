const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const SALT_I = 10;
require('dotenv').config();

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: 1
  },
  password: {
    type: String,
    required: true,
    minlength: 5
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  lastname: {
    type: String,
    required: true,
    maxlength: 100
  },
  cart: {
    type: Array,
    default: []
  },
  history: {
    type: Array,
    default: []
  },
  role: {
    type: Number,
    default: 0
  },
  token: {
    type: String
  },
  resetToken: {
    type: String
  },
  resetTokenExp: {
    type: Number
  }
});

userSchema.pre('save', function(next) {
  var user = this;

  /* With this 'if-else' statement we're saying that IF the user is trying to MODIFY his password we're going to HASH
  his password, if INSTEAD the user is trying to modify something ELSE (for example the 'name') we're just going to 
  SKIP the password REHASH, because before the implementation of this 'if-else' statement EVERY time the user was 
  trying to modify something the password would have been REHASHED and that is NOT what we wanted to do of course */
  if (user.isModified('password')) {
    bcrypt.genSalt(SALT_I, function(err, salt) {
      if (err) return next(err);

      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

/* MongoDB allows us to create METHODS inside the models, so here below we're going to create the 'comprarePassword'
method that will allow us to compare the password the user enter with the one stored inside the Database */
userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return callback(err);
    /* IF the password the user entered and the one in the database are the SAME then this 'isMatch' will be equal to
    'true'(the boolean) else will be equal to 'false'*/
    callback(null, isMatch);
  });
};

userSchema.methods.generateResetToken = function(callback) {
  var user = this;

  // With the 'randomBytes' we can generate a RANDOM string in this case of 20 characters
  crypto.randomBytes(20, function(err, buffer) {
    // Above we defined the 'resetToken' property to be of type STRING, so here below we're CONVERTING it to String
    var token = buffer.toString('hex');
    var today = moment()
      .startOf('day')
      .valueOf();
    var tomorrow = moment(today)
      .endOf('day')
      .valueOf();

    user.resetToken = token;
    user.resetTokenExp = tomorrow;

    user.save(function(err, user) {
      if (err) return callback(err);
      callback(null, user);
    });
  });
};

userSchema.methods.generateToken = function(callback) {
  var user = this;
  /* this '_id' is the the name of the property that gets automatically created by MongoDB in our Database when we
  store something there, so this 'user._id' is referencing to exactly THAT id */
  var token = jwt.sign(user._id.toHexString(), process.env.SECRET);

  user.token = token;
  user.save(function(err, user) {
    if (err) return callback(err);
    /* If everything goes ok we're going to return this 'callback' and now the 'user' will have inside the 'token'
    property */
    callback(null, user);
  });
};

// 'statics' is the same as 'methods' BUT it should be used when we want to query the WHOLE 'User' collection
userSchema.statics.findByToken = function(token, callback) {
  var user = this;

  /* Here below we're VERIFYING if the 'token'(that we get from the COOKIES) is CORRECT by checking the 'token' AND the
  'process.env.SECRET' password, IF they're ok we move forward. When we DECODE our 'token' we will get back the '_id'
  property we have on the Database but ONLY if the 'token' was VALID, if we DON'T get the '_id' it means that the 
  'token' is NOT valid */
  jwt.verify(token, process.env.SECRET, function(err, decode) {
    user.findOne({ _id: decode, token: token }, function(err, user) {
      if (err) return callback(err);
      callback(null, user);
    });
  });
};

const User = mongoose.model('User', userSchema);

module.exports = { User };
