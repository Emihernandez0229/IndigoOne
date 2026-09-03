import {
    hasPermission
} from "../security/accessControl";




export function filterMenuByPermissions(
    menuItems,
    permissions = []
) {



    return menuItems.filter(item => {


        // Separadores
        if (item.section) {

            return true;

        }






        // Menús sin restricción
        if (!item.permission) {

            return true;

        }






        return hasPermission(
            permissions,
            item.permission
        );



    });



}