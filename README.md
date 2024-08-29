# CSCI 5117 Spring 2024 -- Module 2 Homework


Instructions can be [found on canvas](https://canvas.umn.edu/courses/413159/pages/homework-2)

Please fill out all of the following sections to help us grade your submission:

## Student (to be completed individually)

* Anas Mohamed, moha1325@umn.edu

## Link to Site

https://gray-ocean-0f6893e0f.5.azurestaticapps.net/ 

## Challenge Task

* I started the challenge task: [yes/no] 
Yes
* I completed the challenge task: [yes/no] 
Yes



Some quick notes: Added a delete button for uncompleted todos (accessible from /todo/:id). Todos which are completed (so from the /done route) cannot be accessed by a link anymore. However, there is a button "undo completion" which will set the todo as incomplete again and redirect to the /todos page. When todos are marked complete (from either /todo/:id, /todos/:category, /todos) it redirects to /done as well. There is also an undo complete button which is similar to the complete checkbox but for todos marked done, clicking the button navigates a user to /todos with the todo they had clicked for marked incomplete again. 

For the requirement on links to /todos from /done and /done from /todos, these are covered by the sidebar(Edit Todo links to /todos and View Todos links to /done)

