import { Route } from "react-router-dom";

import LoginPage from "../auth/pages/LoginPage";


export default function PublicRoutes() {

  return (

    <Route path="/login" element={<LoginPage />} />

  );

}
