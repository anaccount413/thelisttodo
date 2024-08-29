import './App.css';
import { Outlet } from 'react-router-dom';
import HeadBar from './common/head_bar'
import SideBar from './common/side_bar'

function App() {
  return (
    <div className="App">
      
      <HeadBar/>
      <Outlet />
      
    </div>
  );
}

export default App;
