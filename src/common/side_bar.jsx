import './side_bar.modules.css'
import { Link } from "react-router-dom";


export default function SideBar(){
    return (
        
        <div className="sidebar">
            <div className="sidebar_list">
                <ul>
                    <li className="home_link"> <Link to="/"> Home </Link> </li>
                    <li className="edit_link"> <Link to="/todos"> Edit Todos </Link> </li>
                    <li className="view_link"> <Link to="/done"> Completed Todos </Link> </li>
                </ul>
            </div>
            
        </div>
    )
}