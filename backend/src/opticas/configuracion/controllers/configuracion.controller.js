
class ConfiguracionController {
    constructor(configuracionService) {
        this.configuracionService = configuracionService;
    }

    obtener = async (req, res) => {
        const configuracion = await this.configuracionService.obtenerConfiguracion(
                req.user.optica_id
            );

        return res.status(200).json({
            message: 'Configuración obtenida correctamente',
            data: configuracion
        });
    };

    obtenerOperativa = async (req, res) => {
        const configuracion = await this.configuracionService.obtenerConfiguracionOperativa(
                req.user.optica_id
            );

        return res.status(200).json({
            message: 'Configuración operativa obtenida correctamente',
            data: configuracion
        });
    };

    crear = async (req, res) => {
        const configuracion = await this.configuracionService.crearConfiguracion(
                req.user.optica_id,
                req.body
            );

        return res.status(201).json({
            message: 'Configuración creada correctamente',
            data: configuracion
        });
    };

    actualizar = async (req, res) => {
        const configuracion = await this.configuracionService.actualizarConfiguracion(
                req.user.optica_id,
                req.body
            );

        return res.status(200).json({
            message: 'Configuración actualizada correctamente',
            data: configuracion
        });
    };
}

module.exports = ConfiguracionController;
