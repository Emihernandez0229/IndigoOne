# IndigoOne
Sistema para clientes de Indigo


1. Para crear la base de datos
    Con Git Bash
        1. Entras a la carpeta de database ejemplo: cd /c/Users/EMILIANO/OneDrive/Documentos/Estadia/IndigoOne/database
        2. Pones bash reset-db.sh
    Primero buscara si ya existe una y la eliminara y creara una nueva

2. Para crear un super usuario, esto es para el primero, solo funcionara la primera vez, despues un super usuario puede crear a otro
    Lo hare con postman, lo ponemos como POST
        {
        "nombre": "Emi",
        "usuario": "EMI",
        "password": "emi123"
        }

3. Para que un super usuario cree a otro super usuario
    1. Debe de iniciar sesion el primer super usuario, esto con postman con POST
        http://localhost:4000/api/auth/login/indigo
            {
            "usuario": "EMI",
            "password": "emi123"
            }
        Copian el token que les de, con POST
            http://localhost:4000/api/indigo/usuarios/super-usuarios
                { "nombre": "Leo" }
            Y le creara un usuario y una contraseña que seran la misma:
                {
                    "id": "a3010342-0519-4552-b7fb-182d0df09cb6",
                    "nombre": "Leo",
                    "usuario": "SU723228",
                    "rol": "super_usuario",
                    "credencial_provisional": "SU723228"
                }

4. Para crear a un usuario con credenciales de dueño
    Al iniciar sesion con un super usuario les dara un token,copiar y pegar ese token - POST
        http://localhost:4000/api/indigo/usuarios/duenos
            { "nombre": "Urbino" }
        Le creara un un usuario y una contraseña que seran la misma, despues la puede cambiar
            {
                "id": "a89f0ac4-eae6-4f4b-9499-cf18bffdd2a3",
                "nombre": "Urbino",
                "usuario": "DUE356642",
                "rol": "dueno",
                "credencial_provisional": "DUE356642"
            }

5. Para que un Gerente de sucursal, primero se debe de dar de alta a una sucursal
    Primero debe de iniciar sesion como dueño, y copiar el token que te de - POST
        http://localhost:4000/api/auth/login/indigo
            {
            "usuario": "DUE356642",
            "password": "DUE356642"
            }
        Al copiar el token que te deje te vas a - POST
            http://localhost:4000/api/indigo/sucursales
                { "nombre": "Indigo Tapachula" }
                como resultado nos dara:
                    {
                        "id": "bf1dbe73-31de-447a-acf2-466fdc6aaa61",
                        "nombre": "Indigo Tapachula",
                        "direccion": null,
                        "telefono": null,
                        "activo": true,
                        "created_at": "2026-09-02T02:19:46.212Z"
                    }
                Ahora si podemos crear al Gerente de esta sucursal, para poder vincular un gerente a una sucursal, debe de existir una sucursal que no tenga un gerente, tendremos que poner nuevamente el token del dueño
                    Nos vamos a - POST
                        http://localhost:4000/api/indigo/usuarios/gerentes
                            { "nombre": "Erick",
                            "sucursal_id": "bf1dbe73-31de-447a-acf2-466fdc6aaa61" }
                                Como resultado nos dara
                                    {
                                        "id": "2200b005-ae4f-483f-b9c6-a5019c52c3ba",
                                        "sucursal_id": "bf1dbe73-31de-447a-acf2-466fdc6aaa61",
                                        "nombre": "Erick",
                                        "usuario": "GTE921093",
                                        "password_hash": "$2b$10$BddOBlDHcubVLKf7x.4fv.iSrCS1N1CQKId2pIY6ESc6BWpz4Hasy",
                                        "rol": "gerente_sucursal",
                                        "dado_de_alta_por": "a89f0ac4-eae6-4f4b-9499-cf18bffdd2a3",
                                        "activo": true,
                                        "created_at": "2026-09-02T02:49:48.585Z",
                                        "updated_at": "2026-09-02T02:49:48.585Z",
                                        "credencial_provisional": "GTE921093"
                                    }
                    Se puede asignarle una sucursal de una vez o sino despues
                        Podemos ver a los gerentes disponibles que no tenga una sucursal asignada - GET
                            http://localhost:4000/api/indigo/sucursales/gerentes-disponibles
                                [
                                    {
                                        "id": "3d18570f-e4e4-4f28-8576-8429442a565e",
                                        "nombre": "Saul",
                                        "usuario": "GTE715737"
                                    }
                                ]

6. Para crear un empleado de ventas o de laboratorio
        Usamos el token del gerente,para esto debe de estar asignado a una sucursal - POST
            http://localhost:4000/api/indigo/usuarios/empleados
                En el body le ponemos dependiendo el rol que tendra si ventas o laboratorio
                    { "nombre": "Yoanna", 
                    "tipo": "ventas" }
                        El resultado seria este
                            {
                                "id": "fb9b1105-5ca2-45e7-955b-bd674eb687dc",
                                "sucursal_id": "bf1dbe73-31de-447a-acf2-466fdc6aaa61",
                                "nombre": "Yoanna",
                                "usuario": "VTA839640",
                                "password_hash": "$2b$10$0eg/T8wOZ28mKbDTiO5GZ.Ral6gIP5x6Jx98cIdXd1stIswofsDEK",
                                "rol": "empleado_ventas",
                                "dado_de_alta_por": "2200b005-ae4f-483f-b9c6-a5019c52c3ba",
                                "activo": true,
                                "created_at": "2026-09-02T03:03:43.227Z",
                                "updated_at": "2026-09-02T03:03:43.227Z",
                                "credencial_provisional": "VTA839640"
                            }


                            
