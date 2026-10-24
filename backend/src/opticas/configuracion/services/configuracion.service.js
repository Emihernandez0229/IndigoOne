
const {
    NotFoundError,
    ConflictError
} = require('../../../core/utils/errors');

class ConfiguracionService {
    constructor(configuracionRepository) {
        this.configuracionRepository = configuracionRepository;
    }

    async obtenerConfiguracion(opticaId) {
        const configuracion = await this.configuracionRepository.obtenerPorOpticaId(opticaId);

        if (!configuracion) {
            throw new NotFoundError(
                'La óptica todavía no tiene una configuración registrada'
            );
        }

        return configuracion;
    }

    async obtenerConfiguracionOperativa(opticaId) {
        const configuracion = await this.configuracionRepository.obtenerConfiguracionOperativa(
                opticaId
            );

        if (!configuracion) {
            throw new NotFoundError(
                'La configuración de la óptica no existe'
            );
        }

        return configuracion;
    }

    async crearConfiguracion(opticaId, datos) {
        const existente = await this.configuracionRepository.obtenerPorOpticaId(opticaId);

        if (existente) {
            throw new ConflictError(
                'La configuración de esta óptica ya existe'
            );
        }

        try {
            return await this.configuracionRepository.crear(opticaId, datos);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictError(
                    'La configuración de esta óptica ya existe'
                );
            }

            throw error;
        }
    }

    async actualizarConfiguracion(opticaId, datos) {
        const configuracion = await this.configuracionRepository.actualizarPorOpticaId(
                opticaId,
                datos
            );

        if (!configuracion) {
            throw new NotFoundError(
                'No existe una configuración para esta óptica'
            );
        }

        return configuracion;
    }
}

module.exports = ConfiguracionService;
