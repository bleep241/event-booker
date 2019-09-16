// allows you to build schemas as strings and graphql compiles them into javascript objects to be passed
// into the graphqlHttp middleware under the schema property
const { buildSchema } = require('graphql');

// the buildSchema middleware is looking for specific keywords that follow the graphql specification
// the schema object present needs two other keywords
  // query for fetching data (equivalent to REST get request)
  // mutation for changing data (equivalent to rest POST, PATCH, PUT, DELETE for CRUD ops)
// GraphQL is a typed "language" that allows you to pass in specific types into queries and mutations
// this allows graphql to have multiple queries and mutations of different labels
// rather than exposing several routes or endpoints, graphql has one endpoint that exposes a full query 
// language to the client where the interpretation of that language is left to the server
  // aka define what commands and data are available
  // that's why types are used to specifically define our data and operations
module.exports = buildSchema(`
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
`);
