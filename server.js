const express = require('express');
// allows node/express server to parse incoming queries and compare them against a schema, then route them 
// to the corresponding resolvers to retrieve the relevant data.
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');
// allows you to build schemas as strings and graphql compiles them into javascript objects to be passed
// into the graphqlHttp middleware under the schema property
const { buildSchema } = require('graphql');
const Event = require('./models/event.js');
const User = require('./models/user.js');
const bcrypt = require('bcryptjs');

const PORT = 3000;
const app = express();


// new way to configure a body-parser that is baked into express
app.use(express.json());

// these events will be passed in in place of the actual created events from mongoose
// because graphql, whenever a query is made for a certain property, it will check if that property holds 
// a value like string or number OR if it is a function it will all that function and give back the return 
// value of that function. such is the flexibility of graphql
// this allows us to model the relations in a highly flexible way because now we can drill as deep as we
// want without causing an infinite loop because the functions will only be called if the field that holds
// it is queried for, no matter how deep
/** 
* @param {object} eventIds - an array of Ids from a mongo user's createdEvents field
*/
const events = eventIds => {
  // this will return all events where the id of the event matches one of the ids in the array of events 
  // passed into this function
  return Event.find({ _id: { $in: eventIds } })
    .then(events => {
      // events will come back as an array
      return events.map(event => {
        return { ...event._doc, _id: event.id, creator: user.bind(this, event.creator) }
      })
    })
    .catch(err => {
      throw err;
    });
};

// this user function will act as the return value for getting the creator data within a given event
// so as to avoid having mongoose enter an infinite loop of this relation
const user = userId => {
  return User.findById(userId)
    .then(user => {
      return { ...user._doc, _id: user.id, createdEvents: events.bind(this, user._doc.createdEvents) }
    })
    .catch(err => {
      throw err;
    });
};
// single graphql endpoint... one supercharged source of truth
app.use('/graphql', graphqlHttp({
  // the buildSchema method is looking for specific keywords that follow the graphql specification
  // the schema object present needs two other keywords
    // query for fetching data (equivalent to REST get request)
    // mutation for changing data (equivalent to rest POST, PATCH, PUT, DELETE for CRUD ops)

  // GraphQL is a typed "language" that allows you to pass in specific types into queries and mutations
  // this allows graphql to have multiple queries and mutations of different labels
  // rather than exposing several routes or endpoints, graphql has one endpoint that exposes a full query 
  // language to the client where the interpretation of that language is left to the server
    // aka define what commands and data are available
    // that's why types are used to specifically define our data and operations
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
      creator: User!
    }

    type User {
      _id: ID!
      email: String!
      password: String ${''/* this password must be nullable because you never want to return it to a req*/}
      createdEvents: [Event!]
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    input UserInput {
      email: String!
      password: String! ${''/*here the password is non nullable because you always require is when creating a user*/}
    }

    type RootQuery {
      ${''/*you can specify that you want a field to return a list by wrapping it in array literals*/}
      events: [ Event! ]!
    }

    type RootMutation {
      ${''/*instead of having a long list of arguments for mutations, you can have a special input type*/}
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  // rootValue bundles all the resolvers (equivalent of REST controllers) that must match the name of the
  // fields in the schema-- if the event field is queried, the event resolver is fired off
  rootValue: {
    events: () => {
      return Event.find()
        // .populate('creator') // tells mongoose to populate any relations it knows defined by the ref key
        .then(events => {
          // map over the array returned from mongoDB
          return events.map(event => {
            // retrieve all of the event data and strip away all the metadata by only accessing the _doc
            return { 
              ...event._doc,
              _id: event.id, /* mongoose has a native id property for easy access*/
              creator: user.bind(this, event._doc.creator)
            }; // overwrite the _id property from mongo 
            // by changing it to a string so graphql can process it
          })
        })
        .catch(err => {
          throw err;
        })
    },
    // mutations will receive an args object that holds all the arguments passed into the mutation. 
    // in createEvent's case, the argument is a "name" that will be a String as defined by the schema
    // both queries and mutations can have arguments
    createEvent: (args) => {
      // const event = {
      //   // these properties need to be comma separated because it's javascript. in graphql types
      //   // you don't need them because the parser handles it automatically
      //   _id: Math.random().toString(),
      //   title: args.eventInput.title,
      //   description: args.eventInput.description,
      //   price: +args.eventInput.price, // the + shorthand converts strings to numbers
      //   date: args.eventInput.date
      // };
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price, // the + shorthand converts strings to numbers
        date: new Date(args.eventInput.date),
        // mongoose auto converts string to an object ID
        creator: '5d7f263d552b9bd6dde702ce'
      });
      // this locally scoped variable will hold the event while the actual updated user is being saved
      let createdEvent;

      // return the async call so graphql knows to wait for it.
      return event
        .save()
        .then(result => {
          // here the createdEvent is saved because we want to save the updated user values first
          createdEvent = { ...result._doc, _id: result._doc._id.toString(), creator: user.bind(this, result._doc.creator) };
          // return the user found by the passed in ID to the next then clause
          return User.findById('5d7f263d552b9bd6dde702ce');
          // again, mongoose has an id propert such that result.id can be used instead of toString() 
        })
        .then(user => {
          if (!user) {
            throw new Error('user does not exist')
          }
          console.log('wheres the user', user);
          // the user that is found will have a createdEvents property per our model. we will then push
          // the entire event that is being created and mongoose will extract the Object ID per our model
          user.createdEvents.push(event);
          // update the user.
          return user.save();
        })
        .then(result => {
          // now we return the created event to the front end
          return createdEvent;
        })
        .catch(err => {
          console.log(err);
          throw err;
        })
    },
    createUser: (args) => {
      return User.findOne({ email: args.userInput.email })
        .then(user => {
          // this then block is always hit unless there is a connection error. user will either be an 
          // object is there is a match, or undefined if not
          if (user) {
            throw new Error('User exists already.')
          }
          // the result of returning bcrypt.hash() will pass the hashedpassword into next then clause
          return bcrypt
            .hash(args.userInput.password, 12)
        })
        .then(hashedPassword => {       
          const user = new User({
            email: args.userInput.email,
            password: hashedPassword
          });
          // the created user is now saved and returned into the next then clause
          return user.save();
        })
        .then(createdUser => {
          // again, overwrite the _id prop with the mongooose provided id 
          // also want to overwrite the returned password to null so as to never run the risk of showing it to frontend.
          return { ...createdUser._doc, password: null, _id: createdUser.id };
        })
        .catch(err => {
          throw err;
        });
      // make sure to return the async operation so express-graphql knows to go into the promise chain and
      // wait for it to resolve


    }
  },
  // gives access to debugging client where you can make queries and play around with your api
  graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@bleepcluster-l56v3.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log('You are now connected to BleepCluster...');
});

app.listen(PORT, () => {
  console.log('Your server is now listening on port:', PORT);
});