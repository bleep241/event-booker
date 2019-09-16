const express = require('express');
// allows node/express server to parse incoming queries and compare them against a schema, then route them 
// to the corresponding resolvers to retrieve the relevant data.
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');
// allows you to build schemas as strings and graphql compiles them into javascript objects to be passed
// into the graphqlHttp middleware under the schema property
const { buildSchema } = require('graphql');

const PORT = 3000;
const app = express();

const events = [];

// new way to configure a body-parser that is baked into express
app.use(express.json());

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
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type RootQuery {
      ${''/*you can specify that you want a field to return a list by wrapping it in array literals*/}
      events: [ Event! ]!
    }

    type RootMutation {
      ${''/*instead of having a long list of arguments for mutations, you can have a special input type*/}
      createEvent(eventInput: EventInput): Event
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
      return events;
    },
    // mutations will receive an args object that holds all the arguments passed into the mutation. 
    // in createEvent's case, the argument is a "name" that will be a String as defined by the schema
    // both queries and mutations can have arguments
    createEvent: (args) => {
      const event = {
        // these properties need to be comma separated because it's javascript. in graphql types
        // you don't need them because the parser handles it automatically
        _id: Math.random().toString(),
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price, // the + shorthand converts strings to numbers
        date: args.eventInput.date
      };
      events.push(event);
      return event;
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