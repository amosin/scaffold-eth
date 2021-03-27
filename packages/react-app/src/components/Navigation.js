import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../assets/ativoCoinLogo.png'
import "../styles/navigation.css"

function Navigation({ address }) {
  return (

    <nav className="navbar navbar-expand-lg navbar-light bg-dark">
      <div className="logo">
        <a className="navbar-brand" href="/"><img src={Logo} alt="NFT.Ativo.Finance" className="logo-img" /> NFTs </a>
      </div>

      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        
      <div className="menu-right">
       

          
          <div className="collapse navbar-collapse" id="navbarNavDropdown">
              
              <ul className="navbar-nav">
                
                  <NavLink exact to="/recent">
                    <li className="nav-item nav-link btn btn-outline-primary">
                      Latest
                    </li>
                  </NavLink>

                  <li className="nav-item">
                    <NavLink className="nav-link btn btn-outline-primary" to={'/artist/' + address}>My Assets</NavLink>
                  </li>
                
                  <NavLink exact to="/holdings">
                  <li className="nav-item nav-link btn btn-outline-primary">
                  Holdings
                  </li>
                  </NavLink>

                <NavLink className="nav-link" to="/create-art">
                <li className="nav-link btn btn-outline-primary rounded-pill">
                  Create
                </li>
                </NavLink>

              </ul>
            </div>
        </div>

    </nav>
    
  );
}

export default Navigation;
