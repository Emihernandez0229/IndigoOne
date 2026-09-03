import { useEffect, useState } from "react";


import {
  getOpticaDashboardData
} from "../services/dashboardService";



export default function useOpticaDashboard(){


  const [data,setData] = useState(null);


  const [loading,setLoading] = useState(true);


  const [error,setError] = useState(null);



  useEffect(()=>{


    async function loadDashboard(){


      try{


        setLoading(true);


        const response =
          await getOpticaDashboardData();


        setData(response);



      }catch(error){


        setError(error);


      }finally{


        setLoading(false);


      }


    }



    loadDashboard();



  },[]);




  return {

    data,

    loading,

    error

  };


}