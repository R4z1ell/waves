const mongoose = require('mongoose');
/* We've created this constant 'Schema' just to have an ALIAS and don't have to type 'mongoose.Schema.Types.ObjectId'.
Now instead we can just write 'Schema.Types.ObjectId', so we created this alias just to type LESS code pretty much */
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
      unique: 1,
      maxlength: 100
    },
    description: {
      required: true,
      type: String,
      maxlength: 100000
    },
    price: {
      required: true,
      type: Number,
      maxlength: 255
    },
    brand: {
      /* As we can see for this 'brand' property we've choosed a type of 'Schema.Types.ObjectId', and this is refering
      to the '_id' property that gets automatically created my MongoDB inside the Database when a new record gets stored.
      So now when we ADD a new item inside the 'products' COLLECTION in our Database, under this 'brand' property we'll
      have a value like this for example 'ObjectId("5bc2491484cb7a0ed0992213")', and that number inside the ObjectId is
      EXACTLY the value of the '_id' property of the 'Brand' of the guitar we just added through 'Postman' that in THIS
      case was from the 'Ibanez' BRAND. We've done all of this because if in the feature for example the 'Ibanez' Brand
      would decide to CHANGE his name into something else THEN(if we didn't choosed to add this 'ObjectId' type) we
      would have to go through ALL the records inside the 'products' collection and CHANGE the brand name MANUALLY for
      EACH item and this of course is NOT what we want. NOW instead if a brand decide to change his name we would have 
      to just make a REFERENCE to the brand with that SPECIFIC 'ObjectId' and change it, and this change will propagate 
      to ALL the items with that same brand, and THIS is how we should always work when dealing with Databases. So again
      we're using this 'ObjectId' TYPE because later we're going to NEED this value */
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true
    },
    shipping: {
      required: true,
      type: Boolean
    },
    available: {
      required: true,
      type: Boolean
    },
    wood: {
      type: Schema.Types.ObjectId,
      ref: 'Wood',
      required: true
    },
    frets: {
      required: true,
      type: Number
    },
    sold: {
      type: Number,
      maxlength: 100,
      default: 0
    },
    publish: {
      required: true,
      type: Boolean
    },
    images: {
      type: Array,
      default: []
    }
  },
  /* by setting 'timestramps' to TRUE, everytime we add a new product inside our Database, MongoDB will create the
  'createdAt' AND 'updatedAt' properties AUTOMATICALLY for EACH new added item, we're doing this because later we're
  going to NEED these informations */
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = { Product };
