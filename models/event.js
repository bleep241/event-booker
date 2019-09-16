const mongoose = require('mongoose');
// Schema is a function on mongoose module for building a plan
const Schema = mongoose.Schema;

// Schemas are like plans for building something
const eventSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, require: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  // not a list because each event will only have one creator
  creator: {
    // now setup a reference to the User model 
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

// models are blueprints that incorporate the schema plans to create objects that work in our app
module.exports = mongoose.model('Event', eventSchema);