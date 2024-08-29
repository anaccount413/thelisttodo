import { Link } from "react-router-dom";
import './Todo.modules.css'

// don't want div so used https://stackoverflow.com/questions/33766085/how-to-avoid-extra-wrapping-div-in-react
export default function Todo({item}) {
    return( <>
        <Link to={"/todo/" + item._id} style={{color: 'black', paddingLeft: '0.4em', fontSize: '1.1em'}}>
            { item.contents }
        </Link>
        </>
    )
}