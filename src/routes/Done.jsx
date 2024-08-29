import { redirect, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SideBar from '../common/side_bar';
import Load from '../common/Loading';
import './Done.modules.css'

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


export function CompletedItems(){
  
    const [loading, setLoading] = useState(true)
    console.log(loading)
    const [the_data, setData] = useState({})
    const [thecategories, setCategories] = useState(null)
    const[isUndoComplete, setUndo] = useState(false)
    let navigate = useNavigate()
    
    useEffect(()=>{
      console.log(isUndoComplete)
      if(!isUndoComplete){
        fetch("/api/todos/done", {
          method: "get",
        }).then(response => response.json()).then(answer => {
          setData(answer)
          fetch("/api/categories", {
            method: "get",
          }).then(response => response.json()).then(other_answer =>{
            setCategories(other_answer["data"])
            console.log("hi")
            setLoading(false)
          })
        }).catch(error => {navigate('/404');} )
      }
      else{
        setUndo(false)
      }
      

    }, [])
    

    let todos = the_data["data"]
    
    async function undoComplete(event){
      

      let _id = event.target.id 
      let completion = false
      let payload = {
        id: _id,
        _completed: completion
      }

      setLoading(true)
      setUndo(true)
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
        window.location.href = window.location.origin + '/todos'
        return "Completed update"
      }

    }

    async function deleteCategory(event){

      setLoading(true)

      let redirect = window.location.origin + '/todos'
      let _category = event.target.id 
      let payload = {
        category: _category
      }
  
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
        {loading
        ?
        <Load></Load>
        :
        <div className="all_undone_todos"> 
            
            <h1> List of Completed Todos </h1>

            <ul className="category_list">
            <li className="list_category"> Categories </li>
            {thecategories.map((category, idx) =>(

              <li key={idx} className="list_category">
                <Link to={"/done/" + category.name} style={{textDecoration: "none"}}> {category.name} </Link>
                <button id={category.name} className="trashbuttons" onClick={deleteCategory}> Del &#x1F5D1; </button>
              </li>

            ))}

            </ul>

            <div className="todo_items_container">
              <ul>

                {
                  todos.length > 0 
                  ?
                    todos.map((item, idx) =>(
                      <li key = {idx}>
                        <div className="listitems">
                          
                          {
                            item.contents.length > 50  ? 

                            <p> &#10003; {item.contents.substring(0, 50)}...</p>
                            : 
                            <p> &#10003; {item.contents} </p>
                            }
                            <button onClick={undoComplete} id={item._id} className="undo_button"> Undo Completion </button>
                        </div>
                      </li>

                    ))
                  :
                    <div className="no_todos" > <b> No Completed Todos! </b> </div>
                }

              </ul>
            </div>
            


        </div>
        }
        
        </div>
    )
}


export const Done_route = {
    path:"/done",
    element:<CompletedItems></CompletedItems>,
    loader: loader
  }