const express = require('express');
// allows node/express server to parse incoming queries and compare them against a schema, then route them 
// to the corresponding resolvers to retrieve the relevant data.
const graphqlHttp = require('express-graphql');
// allows you to build schemas as strings and graphql compiles them into javascript objects to be passed
// into the graphqlHttp middleware under the schema property
const { buildSchema } = require('graphql');

const PORT = 3000;
const app = express();

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
    type RootQuery {
      events: [ String! ]!
    }

    type RootMutation {
      createEvent(name: String): String
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
      return ['Romantic Cooking', 'Netflix and Code', 'Sailing']
    },
    // mutations will receive an args object that holds all the arguments passed into the mutation. 
    // in createEvent's case, the argument is a "name" that will be a String as defined by the schema
    // both queries and mutations can have arguments
    createEvent: (args) => {
      const eventName = args.name;
      return eventName;
    }
  },
  // gives access to debugging client where you can make queries and play around with your api
  graphiql: true
}));

app.listen(PORT, () => {
  console.log('Your server is now listening on port:', PORT);
});