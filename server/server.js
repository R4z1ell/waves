const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const formidable = require('express-formidable');
const cloudinary = require('cloudinary');
const moment = require('moment');
const SHA1 = require('crypto-js/sha1');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
// this 'async' is a UTILITY module that is directly available through 'Node.js'(so we DON'T have to install anything)
const async = require('async');
require('dotenv').config();

mongoose.Promise = global.Promise;
mongoose.connect(
  process.env.DATABASE,
  { useNewUrlParser: true }
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Models
const { User } = require('./models/user');
const { Brand } = require('./models/brand');
const { Wood } = require('./models/wood');
const { Product } = require('./models/product');
const { Payment } = require('./models/payment');
const { Site } = require('./models/site');

// Middlewares
const { auth } = require('./middleware/auth');
const { admin } = require('./middleware/admin');

// Utils
const { sendEmail } = require('./utils/mail/index');

//==============================
//   UPLOADING(with 'multer')
//==============================

// This 'storage' below just contains the SETTINGS we then pass to 'multer' inside the 'upload' constant below
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    /* This 'uploads/' below refers to the 'upload' FOLDER we just created in our Project, and its INSIDE this 
    folder that we'll be storing the images we upload */
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
  /* Inside this 'fileFilter' we can DEFINE what type of images we ACCEPT, in our case we're saying that we're going
  to accept ONLY images with 'jpg' or 'png' extension */
  // fileFilter: (req, file, cb) => {
  //   const ext = path.extname(file.originalname);
  //   if (ext !== '.jpg' && ext !== '.png') {
  //     return cb(res.status(400).end('only jpg, png is allowed'), false);
  //   }
  //   cb(null, true);
  // }
});

const upload = multer({ storage: storage }).single('file');

app.post('/api/users/uploadfile', auth, admin, (req, res) => {
  // This 'upload' refers to the 'upload' constant we just defined here above
  upload(req, res, err => {
    if (err) {
      return res.json({ success: false, err });
    }
    return res.json({ success: true });
  });
});

app.get('/api/users/admin_files', auth, admin, (req, res) => {
  /* with this code below we're saying that we want to go to MAIN root of our Project(and this is why we're passing
  the '.' to the 'resolve' method) and THEN we just move to the 'uploads' Folder. So in the end we're just storing
  the LOCALTION of the images we upload in this 'dir' const */
  const dir = path.resolve('.') + '/uploads/';
  fs.readdir(dir, (err, items) => {
    // Here we're just returning ALL the images we've in the 'uploads' Folder pretty much
    return res.status(200).send(items);
  });
});

app.get('/api/users/download/:id', auth, admin, (req, res) => {
  const file = path.resolve('.') + `/uploads/${req.params.id}`;
  res.download(file);
});

//==============================
//            USERS
//==============================

app.post('/api/users/reset_user', (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    user.generateResetToken((err, user) => {
      if (err) return res.json({ success: false, err });
      sendEmail(user.email, user.name, null, 'reset_password', user);
      return res.json({ success: true });
    });
  });
});

app.post('/api/users/reset_password', (req, res) => {
  var today = moment()
    .startOf('day')
    .valueOf();

  /* Here below we're finding inside the 'users' Collection of our Database the user with the SAME 'resetToken' we 
  catch from the URL, and if we found him we CHECK if the 'resetTokenExp' VALUE(that we have for ALL the elements of
  the 'users' collection) is GREATER or EQUAL(so >=) of the value stored inside the 'today' here above(that we're
  calculating with the 'moment' library). IF the value stored in 'today' happens to be GREATER or equal to the value
  stored inside 'resetTokenExp' then NOTHING will be returned and everything is going to FAIL */
  User.findOne(
    {
      resetToken: req.body.resetToken,
      resetTokenExp: {
        $gte: today
      }
    },
    (err, user) => {
      if (!user)
        return res.json({
          success: false,
          message: 'Sorry, bad token. Generate a new one'
        });

      user.password = req.body.password;
      user.resetToken = '';
      user.resetTokenExp = '';

      user.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        return res.status(200).json({
          success: true
        });
      });
    }
  );
});

app.get('/api/users/auth', auth, (req, res) => {
  res.status(200).json({
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    cart: req.user.cart,
    history: req.user.history
  });
});

app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);

  /* This is how we store data in our MongoDB Database, and when we store something in the Database MongoDB give us back
  a 'document'(so the 'doc' argument in the 'save' method pretty much) containing WHAT we just stored in the Database */
  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    sendEmail(doc.email, doc.name, null, 'welcome');
    return res.status(200).json({
      success: true
    });
  });
});

/* First we have to FIND the user's EMAIL, if the email of the user is NOT inside our Database this means that the user
is NOT registered. If instead the email IS inside our Database we need to CHECK if his password, if the password the
user is trying to enter MATHCES the one inside the Database THEN we're going to let the user ENTER in our App if NOT we
are going to KICK him out. In the end IF both the 'email' and 'password' are CORRECT, we're going to generate a new
TOKEN */
app.post('/api/users/login', (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: 'Auth failed, email not found'
      });

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({
          loginSuccess: false,
          message: 'Wrong password'
        });

      // 'w_auth' is the NAME we choose for the COOKIE that will be created when the user login
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);
        res
          .cookie('w_auth', user.token)
          .status(200)
          .json({
            loginSuccess: true
          });
      });
    });
  });
});

app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: '' }, (err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({
      success: true
    });
  });
});

// the 'formidable' here below is just a MIDDLEWARE that we need when SENDING files
app.post('/api/users/uploadimage', auth, admin, formidable(), (req, res) => {
  /* Whenever we upload something to 'cloudinary' the CALLBACK we have inside 'upload' as SECOND argument will be
  triggered */
  cloudinary.uploader.upload(
    req.files.file.path,
    result => {
      console.log(result);
      res.status(200).send({
        public_id: result.public_id,
        url: result.url
      });
    },
    {
      public_id: `${Date.now()}`,
      resource_type: 'auto'
    }
  );
});

app.get('/api/users/removeimage', auth, admin, (req, res) => {
  let image_id = req.query.public_id;

  // With the code below we can REMOVE an image from 'Cloudinary', the only needed thing is the 'id' of the image
  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error });
    res.status(200).send('ok');
  });
});

app.post('/api/users/addToCart', auth, (req, res) => {
  User.findOne({ _id: req.user._id }, (err, doc) => {
    let duplicate = false;

    doc.cart.forEach(item => {
      // This 'item.id' refers to the 'id' property we have INSIDE the 'cart'(we have 'id, 'quantity' and 'date')
      if (item.id == req.query.productId) {
        duplicate = true;
      }
    });
    if (duplicate) {
      /* Here we're searching in our Database for the user with THIS specific 'req.user_id' and INSIDE this 'user'
      we get back we want to LOOK inside the 'cart' property for an element with a SPECIFIC 'ObjectId' equal to the
      value of 'req.user.productId'. THEN when we found that element we INCREMENT the 'quantity' property by ONE, the
      '{new: true}' will give us back ALL the elements we've INSIDE the 'cart' property */
      User.findOneAndUpdate(
        {
          _id: req.user._id,
          'cart.id': mongoose.Types.ObjectId(req.query.productId)
        },
        { $inc: { 'cart.$.quantity': 1 } },
        { new: true },
        () => {
          if (err) return res.json({ success: false, err });
          res.status(200).json(doc.cart);
        }
      );
    } else {
      /* As we can see we've created the 'id' property of the 'cart' as a mongoose 'ObjectId', this because LATER we 
      are going to loop over ALL the elements of the 'cart' property and USE in this loop that 'ObjectId' that is the
      SAME 'ObjectId' that is stored inside the 'products' Collection for that SPECIFIC product. So pretty much we're
      going to be able to retrieve the SPECIFIC guitar inside the 'products' Collection with the SAME 'ObjectId' of 
      the element we've INSIDE the 'cart'. With the '{new: true}' code then we're able to get back the WHOLE document,
      so not JUST the 'cart' we modified but the WHOLE informations */
      User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: {
            cart: {
              id: mongoose.Types.ObjectId(req.query.productId),
              quantity: 1,
              date: Date.now()
            }
          }
        },
        { new: true },
        (err, doc) => {
          if (err) return res.json({ success: false, err });
          /* IF all goes well we JUST send back the 'doc.cart' and NOT the whole 'doc'(that is a new instance of the
          'User' Model pretty much). Inside this 'cart' we're just storing the 'id', the 'quantity' AND the 'date',
          so the three properties we're adding above when we PUSH a new item inside the 'cart' property of the 'User'
          Model */
          res.status(200).json(doc.cart);
        }
      );
    }
  });
});

/* To remove something we use this '$pull' MongoDB Operator(it takes an Object), THEN we specify from WHERE we want 
to pull out something(in our case the 'cart') and THEN we search the Element we want to remove by using the '_id' 
that we have INSIDE the Url(that's why we're using 'req.query._id'). After we have removed the item we want to return
the NEW state of the 'cart' and so we use the code '{new: true}'(if we DON'T add this code we would get the OLD state
of the 'cart' and we don't need that)  */
app.get('/api/users/removeFromCart', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    {
      $pull: { cart: { id: mongoose.Types.ObjectId(req.query._id) } }
    },
    { new: true },
    (err, doc) => {
      let cart = doc.cart;
      /* We KNOW that inside the 'cart' we have THREE informations('id', 'quantity' and 'date') but we ONLY need the
      'id', so that's why we're using the map method to loop over ALL the elements inside the 'cart' and from return
      a new Array that ONLY contains the 'id'(that is the only information that we NEED). The VALUE of the 'id' 
      property of EACH element inside 'cart' is just a STRING but we NEED it to be an 'ObjectId', that's why we're
      CONVERTING the 'id' STRING into an ObjectId also. */
      let array = cart.map(item => {
        return mongoose.Types.ObjectId(item.id);
      });

      /* Here below we're returning ALL the elements inside the 'product' COLLECTION that have the SAME id of
      the elements inside the 'array'(so the new array we created here above by mapping the 'cart') */
      Product.find({ _id: { $in: array } })
        .populate('brand')
        .populate('wood')
        .exec((err, cartDetail) => {
          // the 'cart' we're returning refers to the 'doc.cart' so the NEW state of the 'cart'
          return res.status(200).json({ cartDetail, cart });
        });
    }
  );
});

app.post('/api/users/successBuy', auth, (req, res) => {
  let history = [];
  let transactionData = {};
  const date = new Date();
  // This 'po' stands for PURCHASE ORDER, it's just the name we choosed
  const po = `PO-${date.getSeconds()}${date.getMilliseconds()}-${SHA1(
    req.user._id
  )
    .toString()
    .substring(0, 8)}`;

  req.body.cartDetail.forEach(item => {
    /* Inside the 'cartDetail' we have properties we DON'T need like 'images','sold','description' and so on. So here
    belowe we're adding ONLY the properties of 'cartDetail' that we really NEED */
    history.push({
      porder: po,
      dateOfPurchase: Date.now(),
      name: item.name,
      brand: item.brand.name,
      id: item._id,
      price: item.price,
      quantity: item.quantity,
      /* This 'paymentID' refers to the 'paymentID' property inside the 'payment' OBJECT that gets returned after a
      SUCCESSFULL purchase. Inside the 'onSuccess' Function we have in the 'paypal.js' file we can see ALL the 
      properties contained in the 'payment' Object */
      paymentId: req.body.paymentData.paymentID
    });
  });

  transactionData.user = {
    /* We can access these data(id,name,lastname,email) below DIRECTLY from 'req.user' because we're using the 'auth' 
    MIDDLEWARE that returns the 'user' data from our Database */
    id: req.user._id,
    name: req.user.name,
    lastname: req.user.lastname,
    email: req.user.email
  };
  transactionData.data = { ...req.body.paymentData, porder: po };
  transactionData.product = history;

  User.findOneAndUpdate(
    { _id: req.user._id },
    /* Here below we're PUSHING the 'history' Array we defined above INSIDE the 'history' property we have on the 
    'user' data in our Database(so in the 'user' we have this 'history' property because we created it in the 'user'
    Model). And then we're setting the 'cart' property to be an EMPTY Array */
    { $push: { history: history }, $set: { cart: [] } },
    { new: true },
    (err, user) => {
      if (err) return res.json({ success: false, err });

      const payment = new Payment(transactionData);
      // Here we're SAVING the newly created 'payment' INSIDE our Database, so NOW we'll have a 'payment' COLLECTION
      payment.save((err, doc) => {
        if (err) return res.json({ success: false, err });
        let products = [];
        doc.product.forEach(item => {
          products.push({
            id: item.id,
            quantity: item.quantity
          });
        });

        /* Here below we're using the 'eachSeries' METHOD of the 'async' MODULE we imported above directly from
        Node.js(it's pretty much equal to the 'forEach' JS method in the end), this method takes THREE arguments. The 
        first argument is the Array/Object containing the elements we want to loop through, the second argument is
        an ASYNCHRONOUS Function that is applied to EACH element(in our case to each element inside the 'products'
        Array) and is called with an 'item' and a 'callback' arguments. The last and third arguments(that is OPTIONAL)
        is a CALLBACK function which is called when ALL the asynchronous functions(that we're passing as second
        arguments) that we run for EACH element of the 'products' Array have FINISHED. In our case in this third
        argument we're just checking if we have an error or we send back a status 200 code with a json RESPONSE */
        async.eachSeries(
          products,
          (item, callback) => {
            Product.update(
              { _id: item.id },
              { $inc: { sold: item.quantity } },
              { new: false },
              callback
            );
          },
          err => {
            if (err) return res.json({ success: false, err });
            /* This 'user' refers to the 'user' we have inside the function we're passing as FORTH argument to the
            'findOneAndUpdate' method above(where we have '(err,user) => {...}' pretty much) */
            sendEmail(user.email, user.name, null, 'purchase', transactionData);
            res.status(200).json({
              success: true,
              /* This 'user.cart' below its the SAME 'cart' that ABOVE inside the 'User.findOneAndUpdate' we've SET
              to be an EMPTY Array with the code '$set: { cart: [] }', we could have used just 'cart: []' BUT we have
              these information inside the UPDATED 'user' so we're using that. BELOW instead for the 'cartDetail' we
              DON'T have that info inside 'user' so we MANUALLY set it to an empty Array */
              cart: user.cart,
              cartDetail: []
            });
          }
        );
      });
    }
  );
});

app.post('/api/users/update_profile', auth, (req, res) => {
  User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: req.body },
    { new: true },
    (err, doc) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({ success: true });
    }
  );
});

//==============================
//            BRAND
//==============================

/* We could have added the logic of the 'admin' middleware INSIDE the 'auth' middleware but we've created a new file
just for the 'admin' middleware to show that we can CHAIN middlewares. So now when an user reach this route we're FIRST
going to execute the 'auth' middleware and IF the user passes it we're going to make him pass from the 'admin'
middleware */
app.post('/api/product/brand', auth, admin, (req, res) => {
  const brand = new Brand(req.body);

  // By DEFAULT the 'save' method return us the DOCUMENT('doc') that is pretty much what we've saved in the database
  brand.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      brand: doc
    });
  });
});

app.get('/api/product/get_brands', (req, res) => {
  /* With this QUERY we're fetching ALL the items we've inside our 'brands' Collection pretty much and returning
  them IF we don't have any errors */
  Brand.find({}, (err, brands) => {
    if (err) return res.status(400).send(err);
    res.status(200).send(brands);
  });
});

//==============================
//            WOODS
//==============================

app.post('/api/product/wood', auth, admin, (req, res) => {
  const wood = new Wood(req.body);

  wood.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      wood: doc
    });
  });
});

app.get('/api/product/woods', (req, res) => {
  Wood.find({}, (err, woods) => {
    if (err) return res.status(400).send(err);
    res.status(200).send(woods);
  });
});

//==============================
//          PRODUCTS
//==============================

app.post('/api/product/article', auth, admin, (req, res) => {
  const product = new Product(req.body);

  product.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({
      success: true,
      article: doc
    });
  });
});

/* For this end-point we've choosed to use the QUERY STRINGS method instead of the JSON method of retrieving data, just
to show BOTH of them. So in this case we're taking the info DIRECTLY from the URL, for example we could have an url like
this 'http://localhost:3002/api/product/articles_by_id?id=5b2d3648ca6a03cd33af924c&type=single' so the 'let type'
variable make reference to WHAT we have after the 'type=' so 'single' in our case, the 'let items' variable instead
make reference to what we have after the 'id=' in the url, so that long number. */
app.get('/api/product/articles_by_id', (req, res) => {
  // We're able to access the 'req.query.type' because at the top of this file we're using 'bodyParser.urlencoded'
  let type = req.query.type;
  let items = req.query.id;

  if (type === 'array') {
    /* The 'split' method lets us split a STRING Object into an ARRAY of strings, so if for example we have something
    like this inside the id '&id=3040cs020,200sd0sd0,9ksd920s0' we're going to SPLIT this long string into SUBSTRING
    using in our specific case the ',' comma as SEPARATOR, so we'll get an Array ['3040cs020', '200sd0sd0', '9ksd920s0']
    like this as result for example */
    let ids = req.query.id.split(',');
    items = [];
    items = ids.map(item => {
      /* Here we're pretty much CONVERTING each single 'id'(that is a STRING) in the 'ids' Array into an 'ObjectId'.
      So in the end we're storing inside the 'items' Array(initially empty) ALL the 'id' of the items BUT converted
      into 'ObjectId' */
      return mongoose.Types.ObjectId(item);
    });
  }

  /* Inside 'items' we could have ONE single element or MANY elements, so 'items' is equal to a SINGLE value OR to an
  Array of values. The 'populate' is a mongoose METHOD that lets us REFERENCE documents in OTHER Collections, population
  is the process of AUTOMATICALLY replacing the specified PATHS in the document with document(s) from OTHER Collection(s).
  In our case with "populate('brand')" for example we're saying that we want to POPULATE the 'brand' PROPERTY(that we
  have inside our 'product' MODEL) with the data coming from the 'brands' collection(and THAT is why we used that
  "ref: 'Brand'" in the 'product' Model) with THAT specific 'id' that we're passing in the 'find' METHOD, so now INSIDE
  the 'brand' property for the product we've fetched from the Database INSTEAD of having just a simple 'id' STRING as
  value we'll have an OBJECT(so that ObjectId') with ALL the data(like the name of the brand, that is what we need) */
  Product.find({ _id: { $in: items } })
    .populate('brand')
    .populate('wood')
    .exec((err, docs) => {
      // What we're doing is just finding products by id and returning them inside the 'docs'
      return res.status(200).send(docs);
    });
});

// BY ARRIVAL
// /articles?sortBy=createdAt&order=desc&limit=4

// BY SELL
// /articles?sortBy=sold&order=desc&limit=4

app.get('/api/product/articles', (req, res) => {
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  /* By DEFAULT all the values we have in the URL are converted to STRING(that's why Query String) so because we NEED
  to have the 'limit' to be a NUMBER(for the MongoDB Query below to WORK) we just have to convert it from string to
  number with the 'parseInt' Method */
  let limit = req.query.limit ? parseInt(req.query.limit) : 100;

  Product.find()
    .populate('brand')
    .populate('wood')
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, articles) => {
      if (err) return res.status(400).send(err);
      res.send(articles);
    });
});

app.post('/api/product/shop', (req, res) => {
  let order = req.body.order ? req.body.order : 'desc';
  let sortBy = req.body.sortBy ? req.body.sortBy : '_id';
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === 'price') {
        findArgs[key] = {
          /* The '$gte' and '$lte' are 'Comparison Query Operator' of MongoDB and they means '>=' OR '<=' pretty much.
          In our case we're using them because when we're dealing with the PRICE of a guitar we want to FILTER our
          Database from values in between the '$gte' AND '$lte' */
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1]
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  findArgs['publish'] = true;

  Product.find(findArgs)
    .populate('brand')
    .populate('wood')
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, articles) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        size: articles.length,
        articles
      });
    });
});

//==============================
//             SITE
//==============================

app.get('/api/site/site_data', (req, res) => {
  Site.find({}, (err, site) => {
    if (err) return res.status(400).send(err);
    res.status(200).send(site[0].siteInfo);
  });
});

app.post('/api/site/site_data', (req, res) => {
  Site.findOneAndUpdate(
    { name: 'Site' },
    { $set: { siteInfo: req.body } },
    { new: true },
    (err, doc) => {
      if (err) return res.json({ success: false, err });
      return res.status(200).send({
        success: true,
        siteInfo: doc.siteInfo
      });
    }
  );
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});
