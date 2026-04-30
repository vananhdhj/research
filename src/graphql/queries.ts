import { gql } from '@apollo/client';

export const GET_TODOS = gql`
  query GetTodos($userId: UUID!) {  
  todosCollection(  
    filter: { user_id: { eq: $userId } }  
  ) {  
    edges {  
      node {  
        id  
        title  
        is_complete  
        created_at  
      }  
    }  
  }  
}
`;


export const ADD_TODO = gql`
  mutation AddTodo($title: String!, $userId: UUID!) {
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

export const UPDATE_TODO_TITLE = gql`
  mutation UpdateTodoTitle($id: BigInt!, $title: String!) {
    updatetodosCollection(
      set: { title: $title }
      filter: { id: { eq: $id } }
    ) {
      records {
        id
        title
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

export const DELETE_ALL_TODOS = gql`
  mutation DeleteAllTodos {
    deleteFromtodosCollection(filter: {}, atMost: 1000) {
      affectedCount
      records {
        id
      }
    }
  }
`;

