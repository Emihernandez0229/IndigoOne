import { StrictMode } from "react"

import { createRoot } from "react-dom/client"

import { HashRouter } from "react-router-dom"

import App from "./App.jsx"

import "./index.css"


import {

  AuthProvider

} from "./shared/context/AuthContext"





createRoot(document.getElementById("root")).render(


  <StrictMode>


    <AuthProvider>


      <HashRouter>


        <App />


      </HashRouter>


    </AuthProvider>


  </StrictMode>


)