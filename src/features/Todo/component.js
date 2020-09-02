import React from 'react';
const Todo = ({ userId, title, completed }) => (
  <div>
    <h3>{title}</h3>
    <h4>Created by user: {userId}</h4>
    <h4>Status: {completed ? 'Complete' : 'Pending'}</h4>
  </div>
);

export default Todo;
