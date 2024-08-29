import { useEffect, useState } from 'react';
import { redirect, useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import './Todos.modules.css'
import Todo from "../common/Todo"
import Load from '../common/Loading';
import SideBar from '../common/side_bar';

// mainly used for auth redirect
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


export function TodoItems(){

    const [loading, setLoading] = useState(true)

    // states for new todo item
    // one for the item while its being made and one to add the item to db
    const [todo_item, SetTodoContent] = useState("")
    const [alltodos, SetTodos] = useState(null)
    let navigate = useNavigate()
    
    // states for the categories
    // one for the input for adding categories, one for the actual list of categories when one is added
    const [thecategories, setCategories] = useState(null)
    const [name, setCategoryName] = useState("")


    // state for whether it is updating link time or not
    // mainly for second fetch to get IDs to synchronize loading with the fetch before it
    const [links, getLinks] = useState(false)

    useEffect(()=>{

      
      fetch("/api/todos", {
        method: "get",
      }).then(response => response.json()).then(answer => {
        SetTodos(answer["data"])
        fetch("/api/categories", {
          method: "get",
        }).then(response => response.json()).then(other_answer =>{
          setCategories(other_answer["data"])
          setLoading(false)
        })

      })
      .catch(error => {console.log(error); navigate("/404")} )

    }, [])

    

    // additional state which will be used to determine when to do the useEffect
    // will just be a boolean, when the boolean changes it will lead to the useEffect being called
    const [fetchEffect, setFetch] = useState(false)


    // useEffect hook which will depend on alltodos
    // this is to help update the links in the todos by getting the IDs, and IDs will be used in the rendering 
    useEffect(()=>{
        console.log(loading)
        let is_loading = true
        if(!loading || links){
          console.log("hey")
          setLoading(true)
          is_loading = false
        }
        console.log("Hello mate")

        fetch("/api/todos", {
          method: "GET",
        }).then(response => response.json()).then(results => {
          SetTodos(results["data"])
        }).then(()=>{if(!is_loading){ setLoading(false); getLinks(false)}})


    }, [fetchEffect])

    

    // event handler will keep track of changing items to checked/unchecked

    async function checkHandler(event){
     

      // fetch request to backend 
      // make sure to send ID of object
      let _id = event.target.id 
      let completion = event.target.checked 

      let payload = {
        id: _id,
        _completed: completion
      }
      setLoading(true)
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



    async function submitHandler(){
      
      let to_add = {
        _contents: todo_item,
        _completed: false
      }
      
      // second validation for item length, one more in server
      if(todo_item.length < 1 || todo_item.length > 1000){
        alert("Invalid Todo Length")
        return
      }

      let category_selector = document.getElementById("categories_select")

      // n/a is the default, no categories with this name will be able to be generated either
      if(category_selector.value !== "n/a"){
        to_add["category"] = category_selector.value
      }

      // check if the select dropdown has a value
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
      // this will keep with displaying the most recent first
      let temp = [...alltodos]
      temp.unshift(await result.json())
      SetTodos(temp);
      SetTodoContent("");

      // will lead to the useEffect hook being called so we can get IDs updated (for the sake of the links when rendering)
      setFetch(!fetchEffect)
      }

      else{
        return "Failed to submit todo"
      }

    }

    async function newCategory(){

      // check if category inputted is a duplicate, if so reject it
      // n/a is the base option, no categories can be named it
      for(let i = 0; i < thecategories.length; i++){
        if(name.toLowerCase() === thecategories[i]["name"].toLowerCase() || name.toLowerCase() === "n/a"){
          alert("Categories must be uniquely named!")
          setCategoryName("")
          return
        }
      }
      
      // 2nd validation for length check on category name (3rd check in server)
      if(name.length < 1 || name.length > 50){
        alert("Invalid Category Name!")
        setCategoryName("")
        return
      }

     
      
      let to_add = {
          category_name: name
      }
      setLoading(true)
      const result = await fetch("/api/category", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(to_add)
      })
      
      setLoading(false)


      if(result.ok){
        // set categories list
        setCategories([...thecategories, await result.json()]);
        setCategoryName("")
      }

      else{
        return "Category addition failed"
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

      setLoading(false)
      if(result.ok){
        window.location.href = redirect
      }
      else{
        return "Invalid deletion"
      }
    
    }

    
    return (

      <div className="todos_container">
        <div className="sidebarContainer">
        <SideBar/>
        </div>
        {
          loading
          ?
          <Load></Load>
          :
          <div className="all_undone_todos"> 
            
            <h1> Undone Todos </h1>

            <ul className="category_list">
            <li className="list_category"> Categories </li>
            {thecategories.map((category, idx) =>(

              <li key={idx} className="list_category">
                <Link to={"/todos/" + category.name} style={{textDecoration: "none"}}> {category.name} </Link>
                <button id={category.name} className="trashbuttons" onClick={deleteCategory}> Del &#x1F5D1; </button>
              </li>

            ))}

            </ul>

            <div className="add_category">
              <br></br>
              <input id="category_input" value={name} maxLength={50} minLength={1} placeholder="name" onChange={e=>setCategoryName(e.target.value)}/>
              <button id="category_button" onClick={newCategory}> + Add Category </button>
              <br></br>
            </div>

            <div className="todo_items_container">
              <ul className="todo_list">
                {
                  alltodos.length > 0 ?

                    alltodos.map((item, idx) =>(
                      <li key = {idx}>
                        <div className="listitems">
                          <input type = "checkbox" name = {item.contents.substring(0, 20)} id = {item._id} onChange={checkHandler}/>
                          
                          <Todo item={
                            item.contents.length > 50  ? 
                            {_id: item._id, contents: `${item.contents.substring(0, 50)}...`, completed: item.completed}
                            : 
                            item
                            }></Todo>
                        </div>
                      </li>
  
                    ))
                  :
                  <div className="no_todos"> <b> Looks like there are no todo items yet </b> </div>
                  
                }
              </ul>
            </div>


            <div className="new_todo_container">

              <h2> Add a Todo </h2>


              <textarea value={todo_item} id="textbox_todo" minLength={1} maxLength={1000} placeholder="Write a todo item here" onChange={e=>{SetTodoContent(e.target.value)}}/>
              
              <div className="select_container"> 
                <br></br>
                <p> Choose a Category For The New Todo Item:    </p>
                <select name="categories" id="categories_select">
                <option value="n/a"> N/A </option>
                  {thecategories.map((item, idx) =>(
                    <option key={idx} value={item.name}> {item.name} </option>
                  ))}
                </select>
                <br></br>
              </div>
              
              <button onClick={submitHandler}> + Add New Todo </button>

            </div>
            
        </div>

        }
        
        </div>
    )
}

export const Todo_route = {
    path:"/todos",
    element:<TodoItems></TodoItems>,
    loader: loader
  }