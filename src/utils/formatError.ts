import { ApolloError, formatApolloErrors } from 'apollo-server-core';
import debug from 'debug';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

const log = debug('formatError');

const formatError = (error: GraphQLError): GraphQLFormattedError => {
  let newError = error;
  log({ error });
  if (error.extensions?.exception?.validationErrors) {
    const messages = error.extensions.exception.validationErrors.map((e): string[] => {
      return Object.keys(e.constraints).map((k): string => e.constraints[k]);
    })[0];
    const formattedError = new ApolloError(messages[0], 'VALIDATION_ERROR');
    newError = formatApolloErrors([formattedError])[0];
  }

  if (process.env.NODE_ENV === 'production') delete newError.extensions.exception.stacktrace;

  return newError;
};

export default formatError;
