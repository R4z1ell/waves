let admin = (req, res, next) => {
  /* When the 'role' is equal to zero we're refering to a simple USER, instead when the 'role' is equal to ONE 
    we're refering to an ADMIN */
  if (req.user.role === 0) {
    return res.send('you are not allowed, get out now!');
  }
  next();
};

module.exports = { admin };
