import { Link } from "react-router-dom";
import './Error.modules.css'

export default function Errors(){
    return (
        <div className="error_container">
            <h1 id="error_message"> Page Not Found </h1>
            <p> <Link to="/"> Click here to go back to the home page </Link> </p>
        </div>
    )
}