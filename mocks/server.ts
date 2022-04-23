import { mockServer } from 'graphql-tools';
import fs from 'fs';

// This can be an SDL schema string (eg the result of `buildClientSchema` above)
// or a GraphQLSchema object (eg the result of `buildSchema` from `graphql`)
const schema = fs.readFileSync('schema.gql', {
  encoding: 'utf-8'
})

// Same mocks object that `addMockFunctionsToSchema` takes above
const mocks = {}
const preserveResolvers = false

const server = mockServer(schema, mocks, preserveResolvers);

const query = `{ __typename }`
const variables = {}

server.query(query, variables)
  .then(response => {
    console.log(response)
  })