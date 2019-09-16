const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  // createdEvents will be an array or "list" of Ids referncing the ids of the events that a user creates
  createdEvents: [
    {
      type: Schema.Types.ObjectId,
      // this ref field lets mongoose setup a relation between two models. in this case it's the Event model
      // it needs be the same exact case and now mongoose knows this will be a list of object ids from the
      // Event model
      ref: 'Event'
    }
  ]
});

module.exports = mongoose.model('User', userSchema);