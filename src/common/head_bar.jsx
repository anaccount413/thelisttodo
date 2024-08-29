import './head_bar.modules.css'
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";


function Logo(){
    return (
        <div className="logo_container">
            <img src="/card_logo.png" alt="card logo"></img>
            <Link to="/" className="homepage_link" style={{"color": "black"}}> theListToDo </Link>
        </div>
    )
}

export default function HeadBar(){

    const [logged, setLog] = useState(false)

    useEffect(()=>{
        fetch("/.auth/me").then(response => response.json()).then(results =>{
            // if client principal is undefined, user is logged out
            if(results["clientPrincipal"]){
                setLog(true)
            }
            else{
                setLog(false)
            }
        })
    }, [])

    function buttonClickLogout(){
        window.location.href = window.location.origin + '/.auth/logout'
        return
    }

    function buttonClickLogin(){
        window.location.href = window.location.origin + '/.auth/login/github'
        return
    }

    return (
        <div className ="head_bar">
            <div className="left_headbar"> <Logo></Logo> </div>
            {!logged 
            ? 
             <div className="right_headbar"> <button className="sign_buttons" onClick={buttonClickLogin}> Sign in with Github </button> </div>
            :  
            <div className="right_headbar"> <button className="sign_buttons" onClick={buttonClickLogout}> Sign out </button> </div>}
        </div>
    )
}

