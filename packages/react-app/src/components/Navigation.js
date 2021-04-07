import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from '../assets/ativoCoinLogo.png'
import "../styles/navigation.css"
import { Account } from './';

function Navigation({ address }) {
  return (

    <nav className="navbar navbar-expand-lg navbar-light bg-dark">
      <div className="navbar-brand">
        <a  href="/"><img src={Logo} alt="NFT.Ativo.Finance" className="logo-img" /> <span className="sitename-lower"> NFT Factory </span> </a>

      </div>

      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
    <span className="navbar-toggler-icon my-toggler"></span>
    </button>
        
      <div className="menu-right">
       

          
      <div className="collapse navbar-collapse" id="navbarNav">
              
              <ul className="navbar-nav ml-auto">
                
                  <NavLink exact to="/latest">
                    <li className="nav-item nav-link btn btn-lg btn-outline-primary">
                      Latest
                    </li>
                  </NavLink>

                  <li className="nav-item">
                    <NavLink className="nav-link btn btn-lg btn-outline-primary" to={'/accounts/' + address}>My Assets</NavLink>
                  </li>
                
                  <NavLink exact to="/holdings">
                  <li className="nav-item nav-link btn btn-lg btn-outline-primary">
                  Holdings
                  </li>
                  </NavLink>

                <NavLink className="nav-link" to="/create-asset">
                <li className="nav-link btn btn-lg btn-outline-primary rounded-pill">
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
