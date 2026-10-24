import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import { useAuth } from "../context/AuthContext";
import { getNavigationForRole } from "../security/roleConfig";
import { OpticaBrandThemeProvider, useOpticaBrandTheme } from "../context/OpticaBrandThemeContext";

export default function AppLayout() {

  const { user } = useAuth();

  const navigation = getNavigationForRole(user?.role);

  return (
    <OpticaBrandThemeProvider role={user?.role}>
      <AppLayoutShell navigation={navigation} />
    </OpticaBrandThemeProvider>
  );

}

function AppLayoutShell({ navigation }) {

  const { style } = useOpticaBrandTheme();

  return (

    <div
      className="
        flex
        h-screen
        overflow-hidden
        bg-background
      "
      style={style}
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
