"use strict";
exports.__esModule = true;
var graphql_tools_1 = require("graphql-tools");
var fs_1 = require("fs");
// This can be an SDL schema string (eg the result of `buildClientSchema` above)
// or a GraphQLSchema object (eg the result of `buildSchema` from `graphql`)
var schema = fs_1["default"].readFileSync('schema.gql', {
    encoding: 'utf-8'
});
// Same mocks object that `addMockFunctionsToSchema` takes above
var mocks = {};
var preserveResolvers = false;
var server = graphql_tools_1.mockServer(schema, mocks, preserveResolvers);
var query = "{ __typename }";
var variables = {};
server.query(query, variables)
    .then(function (response) {
    console.log(response);
});
