# GEMINI.md - Project Context

## Project Overview
This project is a **Todo List application** built with **React (TypeScript)** and **Vite**. It uses **Apollo Client** to interact with a **Supabase** backend via the `pg_graphql` extension. The application demonstrates real-time CRUD operations using GraphQL queries and mutations.

## Core Technologies
- **Frontend Framework:** React (v19)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Data Fetching:** Apollo Client (v4)
- **Backend:** Supabase (PostgreSQL with `pg_graphql` extension)
- **Styling:** CSS (App.css)

## Key Configuration Files
- `src/lib/apolloClient.ts`: Configures the Apollo Client with Supabase's GraphQL endpoint and handles authentication via the `apiKey` and `Authorization` headers.
- `src/graphql/queries.ts`: Contains the GraphQL queries (`GET_TODOS`) and mutations (`ADD_TODO`, `TOGGLE_TODO`, `DELETE_TODO`).
- `.env`: Stores the Supabase URL and Anon Key.
- `src/main.tsx`: Wraps the application with `ApolloProvider`.

## Building and Running
To get started with development, follow these commands:

### Prerequisites
1.  Ensure you have a Supabase project set up.
2.  Enable the `pg_graphql` extension in your Supabase dashboard.
3.  Create a `todos` table in the `public` schema.

### Installation
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

## Development Conventions
- **TypeScript:** Use strong typing for components and GraphQL response data.
- **GraphQL Imports:** Always import hooks like `useQuery` and `useMutation` from `@apollo/client/react` for proper compatibility with the current setup.
- **State Management:** Local UI state is managed with React's `useState`. Remote state is handled by Apollo Client's `useQuery` and updated via `refetch` after mutations.

## Environment Variables
The following variables must be defined in your `.env` file:
- `VITE_SUPABASE_URL`: Your Supabase Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
