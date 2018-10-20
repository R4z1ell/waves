const mongoose = require('mongoose');

const woodSchema = mongoose.Schema({
  name: {
    required: true,
    type: String,
    unique: 1,
    maxlength: 100
  }
});

/* An IMPORTANT thing, the name we gave to the constant have to be EXACTLY the same as the one we add INSIDE the 'model',
and this is ALSO true for possible CAPITAL letters, so if name the constant 'Wood' with a first CAPITAL 'w' we HAVE to
name what we put inside the model EXACTLY the same with 'Wood' */
const Wood = mongoose.model('Wood', woodSchema);

module.exports = { Wood };
