import { gql } from '@apollo/client';

export const GET_TODOS = gql`
  query GetTodos {
    todosCollection {
      edges {
        node {
          id
          title
          is_complete
        }
      }
    }
  }
`;

export const ADD_TODO = gql`
  mutation AddTodo($title: String!) {
    insertIntotodosCollection(objects: [{ title: $title }]) {
      records {
        id
        title
        is_complete
      }
    }
  }
`;

export const TOGGLE_TODO = gql`
  mutation ToggleTodo($id: BigInt!, $is_complete: Boolean!) {
    updatetodosCollection(
      set: { is_complete: $is_complete }
      filter: { id: { eq: $id } }
    ) {
      records {
        id
        is_complete
      }
    }
  }
`;

export const DELETE_TODO = gql`
  mutation DeleteTodo($id: BigInt!) {
    deleteFromtodosCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`;
