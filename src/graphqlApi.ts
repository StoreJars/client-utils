import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { createUploadLink } from 'apollo-upload-client/lib/index';
import gql from 'graphql-tag';

import { from } from './operators';

export default class API {
  private URL: string;
  private tokenStorage: any;

  constructor(url: string, tokenStorage: any) {
    this.URL = url;
    this.tokenStorage = tokenStorage;
  }

  private client(token) {
    return new ApolloClient({
      link: ApolloLink.from([
        onError(({ graphQLErrors, networkError }) => {
          if (graphQLErrors) {
            graphQLErrors.forEach((message, locations, path) => {
              console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
            });
          }
          if (networkError) {
            console.log(`[Network error]: ${networkError}`);
          }
        }),
        createUploadLink({
          uri: this.URL,
          credentials: 'same-origin',
          headers: { Authorization: token },
        }),
      ]),
      cache: new InMemoryCache(),
    });
  }

  public query$(query: any, payload = {}) {
    const { token } = this.tokenStorage.get();

    return from(
      this.client(token).query({
        query: gql`
          ${query}
        `,
        variables: { input: payload },
      }),
    );
  }

  public mutate$(query: any, payload: any) {
    const { token } = this.tokenStorage.get();

    return from(
      this.client(token).mutate({
        mutation: query,
        variables: { input: payload },
      }),
    );
  }

  public query(query: any, payload = {}) {
    const { token } = this.tokenStorage.get();

    return this.client(token).query({
      query: gql`
        ${query}
      `,
      variables: { input: payload },
    });
  }

  public mutate(query: any, payload: any) {
    const { token } = this.tokenStorage.get();

    return this.client(token).mutate({
      mutation: query,
      variables: { input: payload },
    });
  }
}
