const express = require('express');
// allows node/express server to parse incoming queries and compare them against a schema, then route them 
// to the corresponding resolvers to retrieve the relevant data.
const graphqlHttp = require('express-graphql');
const mongoose = require('mongoose');
const PORT = 3000;

const graphQLSchema = require('./graphql/schema/index.js');
const graphQLResolvers = require('./graphql/resolvers/index.js');

const app = express();

// new way to configure a body-parser that is baked into express
app.use(express.json());

// single graphql endpoint... one supercharged source of truth
app.use('/graphql', graphqlHttp({
  schema: graphQLSchema,
  // rootValue bundles all the resolvers (equivalent of REST controllers) that must match the name of the
  // fields in the schema-- if the event field is queried, the event resolver is fired off
  rootValue: graphQLResolvers,
  // gives access to debugging client where you can make queries and play around with your api
  graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@bleepcluster-l56v3.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
  console.log('You are now connected to BleepCluster...');
});

app.listen(PORT, () => {
  console.log('Your server is now listening on port:', PORT);
});