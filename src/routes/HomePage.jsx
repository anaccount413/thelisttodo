import './HomePage.modules.css'
import { useLoaderData, redirect } from 'react-router-dom';

// loader to check auth and redirect to todos if user is logged in
async function loader({ request, params }) {
    console.log("IN HERE")
    let result = await fetch('/.auth/me')
    result = await result.json()
    console.log(result)
    // check for authentication roles
    if(result["clientPrincipal"] && result["clientPrincipal"]["userRoles"].includes("anonymous") && result["clientPrincipal"]["userRoles"].includes("authenticated")){
        console.log("OK")
        return redirect("/todos")
    }
    else{
        console.log("passed that..")
        return 1
    }
}

export default function Home(){
    
    let data = useLoaderData();

    console.log(data)
    
    return (
        <div className="home_container">
            
            <div className="text_container">
                <h1> Welcome to theListToDo </h1> 
                <a href={window.location.origin + "/.auth/login/github"}> Click here to sign in through github and get access to all the features of this application </a> 
            </div>

            </div> 
    )
}

export const HomePage_route = {
    path:"/",
    element:<Home></Home>,
    loader: loader,
  }