import { useState, useEffect } from 'react';
import { redirect, useParams, useNavigate} from 'react-router-dom';
import { Link } from "react-router-dom";
import SideBar from '../common/side_bar';
import Load from '../common/Loading';
import './SingleTodo.modules.css'

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


export function SingleTodo(){
  let navigate = useNavigate();
  const [loading, setLoading] = useState(true)

  let the_id = useParams().id
  

  const [changed_todo, SetChanges] = useState(null)
  const [categories_list, setCategories] = useState(null)
  const [chosen_category, setChoseCategory] = useState(null)


  useEffect(()=>{
      
    fetch("/api/todo/" + the_id, {
      method: "get",
    }).then(response => response.json()).then(answer => {
      setChoseCategory(answer["todo"]["category_name"])
      SetChanges(answer["todo"]["contents"])

      fetch("/api/categories", {
        method: "get",
      }).then(response => response.json()).then(other_answer =>{
        let final_categories = []
        
        let category_list = other_answer["data"]
        for(let i = 0; i < category_list.length; i++){
          final_categories.push(category_list[i]["name"])
        }

        setCategories(final_categories)
      
        setLoading(false)
      })

      }).catch(error => {navigate("/404");} )

  }, [])




  // edit button needs 2 states
  // one for the button text and one for the save/editing state to tell when to change button text
  const [buttonText, setButtonText] = useState("Edit Todo Item")
  const [editing, setEditing] = useState(false)


  async function EditTodo(){
    if(!editing){
      setButtonText("Save Edit")
      setEditing(true)
    }
    
    // this is where you update the data storage 
    else{
      let payload = {
        id: the_id,
        _content: changed_todo
      }


      const result = await fetch("/api/todo/update", {
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
        setButtonText("Edit Todo Item")
        setEditing(false)
        SetChanges(changed_todo)
        return "Completed update"
      }
    }
  }

  // this will update the data storage as well
  async function markTodoComplete(event){
    // fetch request to backend 
      // make sure to send ID of object
      let _id = event.target.id 
      let completion = true

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

  async function deleteTodo(event){

    let redirect = window.location.origin + '/todos'
    let _id = event.target.id 
    let payload = {
      id: _id
    }

    setLoading(true)
    const result = await fetch("/api/delete/todo", {
      method: "DELETE",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })

    if(result.ok){
      window.location.href = redirect
    }

  }

  async function updateCategory(event){
   
    let category_selector = document.getElementById("categories_select")
    
    let _id = event.target.id 
    let payload = {
      id: _id,
      category: category_selector.value
    }

    console.log(payload)
    
    // pressed submit without doing any changes
    // won't actually do anything
    if(payload.category === chosen_category){
      return
    }

    else{
      setChoseCategory(category_selector.value)
    }

    setLoading(true)
    let result = await fetch("/api/todos/categoryupdate", {
      method: "PUT", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    })
    setLoading(false)
    if(result.ok){
      return "Successful Category Update"
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
        <div className="single_container"> 
        <Link to={"/todos"}> Click here to go back to the list of undone todos </Link>
        <br></br>
        <h1> Your Todo Item </h1>

        <div className="editing_container">
          <textarea value= {changed_todo} id={the_id} readOnly={!editing} onChange={e=>SetChanges(e.target.value)}></textarea>
          <div className="select_container"> 
            <p> Update the Category:    </p>
            <select name="categories" id="categories_select"  defaultValue={chosen_category}>
              <option value="n/a"> N/A </option>
              {categories_list.map((item, idx) =>(
                <option key={idx} value={item}> {item} </option> 
              ))}
            </select>
            <button onClick={updateCategory} id={the_id}> Update Category </button>
            <br></br>

          </div>

          <div className="button_container">
            <button onClick={EditTodo}> {buttonText} </button>
            <button onClick={deleteTodo}  id = {the_id}> Delete this todo </button>
            <button onClick={markTodoComplete} id = {the_id}> Mark Todo as Completed </button>
          </div>
          
        </div>
        

      </div>

      }
      
      

    </div>
  )
}

export const SingleTodo_route = {
  path:"/todo/:id",
  element:<SingleTodo></SingleTodo>,
  loader: loader
}