import { useEffect, useState } from 'react';
import { redirect, useParams, useNavigate } from 'react-router-dom';
import SideBar from '../common/side_bar';
import Todo from "../common/Todo"
import Load from "../common/Loading"
import './Category.modules.css'

async function loader({ request, params }) {
  let authresult = await fetch('/.auth/me')
  authresult = await authresult.json()
  console.log(authresult)
  // check for authentication roles
  if(!authresult["clientPrincipal"] || !authresult["clientPrincipal"]["userRoles"].includes("anonymous") || !authresult["clientPrincipal"]["userRoles"].includes("authenticated")){
 
    return redirect("/")
  }
  else{
      return true
  }


}

export function CategoryItem(){
    let navigate = useNavigate()
    let true_category = useParams();
    let a_category = true_category.category

    const [loading, setLoading] = useState(true)
    const [the_data, setData] = useState(null)


    // used in the second useEffect for consistent loading, helps synchronize the fetch for IDs with the fetch before it
    const [links, getLinks] = useState(false)

    useEffect(()=>{

      fetch("/api/todos/" + a_category, {
        method: "get",
      }).then(response => response.json()).then(answer => {
        setData(answer)
        SetTodos(answer["data"]["category_data"])
        setLoading(false)
      })
      .catch(err => {navigate('/404')})

    }, [])

   
    let todos;
    if(!the_data){
      todos = []
    }

    else{
      todos = the_data["data"]["category_data"]
    }
    
    let the_category = a_category

    // states for new todo item
    // one for the item while its being made and one to add the item to db
    const [todo_item, SetTodoContent] = useState("")
    const [alltodos, SetTodos] = useState(null)


    // additional state which will be used to determine when to do the useEffect
    // will just be a boolean, when the boolean changes it will lead to the useEffect being called
    // similar thing in Todos.jsx
    const [fetchEffect, setFetch] = useState(false)

    useEffect(()=>{
      let is_loading = true
      if(!loading || links){
        setLoading(true)
        is_loading = false
      }
      
      fetch("/api/todos/" + the_category, {
        method: "GET",
      }).then(response => response.json()).then(results => {
        SetTodos(results["data"]["category_data"])
      }).then(()=>{if(!is_loading){ setLoading(false)}})

  }, [fetchEffect])
    

    


    // event handler will keep track of changing items to checked/unchecked

    async function checkHandler(event){
      setLoading(true)
      // fetch request to backend 
      // make sure to send ID of object
      let _id = event.target.id 
      let completion = event.target.checked 

      let payload = {
        id: _id,
        _completed: completion
      }

      const result = await fetch("/api/todos/completionupdate", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })

      if(!result.ok){
        return "Failed"
      }

      else{
        window.location.href = window.location.origin + '/done'
        return "Completed update"
      }
      
    }


    // in category so submitting here automatically adds todo to that category
    async function submitHandler(){
      


      let to_add = {
        _contents: todo_item,
        _completed: false,
        category: the_category
      }

      setLoading(true)
      const result = await fetch("/api/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(to_add)
      })
      getLinks(true)

      if(result.ok){
      SetTodos([...alltodos, await result.json()]);
      SetTodoContent("");
      setFetch(!fetchEffect)
      }
    }

    async function deleteCategory(event){

      let redirect = window.location.origin + '/todos'
      let _category = event.target.id 
      let payload = {
        category: _category
      }
      
      setLoading(true)
      const result = await fetch("/api/delete/category", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      })
  
      if(result.ok){
        window.location.href = redirect
      }
      else{
        return "Deletion failed"
      }
  
    }





    return (
      <div className="todos_container">
      <div className="sidebarContainer">
      <SideBar/>
      </div>
      {loading
      ?
      <Load></Load>
      :
      <div className="all_undone_todos"> 
            
      <h1> List of Todos: {the_category} </h1>

      <div className="todo_items_container">
        <ul className="todo_list">

          {
          alltodos.length > 0 
          ?
            alltodos.map((item, idx) =>(
              <li key = {idx}>
                <div className="listitems">
                  <input type = "checkbox" name = {item.contents.substring(0, 20)} id = {item._id} onChange={checkHandler}/>
                  
                  <Todo item={
                    item.contents.length > 50  ? 
                    {_id: item._id, _contents: `${item.contents.substring(0, 50)}...`, _completed: item._completed}
                    : 
                    item
                    }></Todo>
                </div>
              </li>

            ))

            :
            <div className="no_todos"> <b> No todo items in this category </b> </div>
          }

        </ul>
      </div>


      <div className="new_todo_container">
        <h2> Add a Todo To This Category </h2>
        <textarea value={todo_item} id="textbox_todo" placeholder="Write a todo item here" onChange={e=>{SetTodoContent(e.target.value)}}/>
        <br></br>
        <button onClick={submitHandler}> + Add New Todo </button>
      </div>

      <button className="delete_category" id={the_data["data"]["category"]} onClick={deleteCategory}> Delete this Category </button>
      


      </div>
      }
      
      </div>
      
    )
}

export const Category_route = {
    path:"/todos/:category",
    element:<CategoryItem></CategoryItem>,
    loader: loader
  }



  