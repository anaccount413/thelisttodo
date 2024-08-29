import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { Todo_route } from './routes/Todos';
import { SingleTodo_route } from './routes/SingleTodo';
import { Done_route } from './routes/Done';
import { Category_route } from './routes/Category';
import { HomePage_route } from './routes/HomePage';
import { DoneCategory_route } from './routes/DoneCategory';
import Errors  from './common/Error'


// configure the paths here
const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children:[
      HomePage_route,
      Todo_route,
      SingleTodo_route,
      Done_route,
      Category_route,
      DoneCategory_route
    ],
    errorElement: <Errors/>
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
     <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
