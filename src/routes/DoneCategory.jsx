import { redirect, useParams, useNavigate } from 'react-router-dom';
import {useState, useEffect} from 'react'
import SideBar from '../common/side_bar';
import Load from '../common/Loading';
import './DoneCategory.modules.css'

// overall very similar to Category.jsx representing the todos/{category} route
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

export function DoneCategories(){
    const [loading, setLoading] = useState(true)
    const [the_data, setData] = useState(null)
    const[isUndoComplete, setUndo] = useState(false)
    let category_name = useParams().category
    let navigate = useNavigate()
    
    useEffect(()=>{
      if(!isUndoComplete){
        fetch("/api/done/" + category_name, {
          method: "get",
        }).then(response => response.json()).then(answer => {
          console.log(answer)
          setData(answer)
          setLoading(false)
        }).catch(error => {navigate("/404");} )
      }
      

    }, [])


    let todos = []
    
    if(the_data){
      todos = the_data["data"]["category_data"]
    }

    

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
            
            <h1> List of Completed Todos: {category_name} </h1>

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
                    <div className="no_todos"> <b> No Completed Todos From This Category! </b> </div>
                }

              </ul>
            </div>
            


        </div>

        }
        
        </div>
    )
}

export const DoneCategory_route = {
    path:"/done/:category",
    element:<DoneCategories></DoneCategories>, 
    loader: loader
  }