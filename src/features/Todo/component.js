import React from 'react';
const Todo = ({ userId, title, completed, id }) => (
  <div>
    <h5>to-do id: {id}</h5>
    <h3>To-do Item Text: {title}</h3>
    <h4>Created by user: {userId}</h4>
    <h4>Status: {completed ? 'Complete' : 'Pending'}</h4>
  </div>
);

export default Todo;
