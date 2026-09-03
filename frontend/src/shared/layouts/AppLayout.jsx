import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import { useAuth } from "../context/AuthContext";
import { getNavigationForRole } from "../security/roleConfig";

export default function AppLayout() {

  const { user } = useAuth();

  const navigation = getNavigationForRole(user?.role);


  return (

    <div
      className="
        flex
        h-screen
        overflow-hidden
        bg-background
      "
    >

      {/* SIDEBAR */}

      <Sidebar items={navigation} />


      {/* ÁREA PRINCIPAL */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
        "
      >

        <Navbar />

        <main
          className="
            flex-1
            overflow-y-auto
            p-6
            lg:p-8
          "
        >

          <Outlet />

        </main>

      </div>

    </div>

  );

}
