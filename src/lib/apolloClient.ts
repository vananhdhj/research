import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { supabase } from './supabaseClient';
import { getEnv } from './env';

const httpLink = createHttpLink({
  uri: `${getEnv('VITE_SUPABASE_URL')}/graphql/v1`,
});

const authLink = setContext(async (_, { headers }) => {
  // Get the current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    headers: {
      ...headers,
      apiKey: getEnv('VITE_SUPABASE_ANON_KEY'),
      // Use the session token if available, otherwise fallback to anon key
      Authorization: token ? `Bearer ${token}` : `Bearer ${getEnv('VITE_SUPABASE_ANON_KEY')}`,
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
