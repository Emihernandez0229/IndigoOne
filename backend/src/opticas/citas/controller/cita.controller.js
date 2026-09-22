
const CitaService = require('../services/CitaService');

class CitaController {

    constructor(citaService) {
        this.citaService = citaService;
    }

    /**
     * Crea una nueva cita.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async crearCita(req, res) {
        const {
            clienteId,
            fechaHora,
            motivo
        } = req.body;

        const sucursalId = req.user.sucursalId;
        const creadoPor = req.user.id;

        const cita = await this.citaService.crearCita(
            sucursalId,
            clienteId,
            fechaHora,
            motivo,
            creadoPor
        );

        res.status(201).json({
            success: true,
            message: 'Cita creada correctamente.',
            data: cita
        });
    }

    /**
     * Obtiene todas las citas de la sucursal del usuario autenticado.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async obtenerTodasCitas(req, res) {
        const sucursalId = req.user.sucursalId;

        const citas = await this.citaService.obtenerTodasCitas(
            sucursalId
        );

        res.status(200).json({
            success: true,
            data: citas
        });
    }

    /**
     * Obtiene una cita específica.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async obtenerCitaPorId(req, res) {
        const { citaId } = req.params;
        const sucursalId = req.user.sucursalId;

        const cita = await this.citaService.obtenerCitaPorId(
            sucursalId,
            citaId
        );

        res.status(200).json({
            success: true,
            data: cita
        });
    }

    /**
     * Obtiene todas las citas de un cliente.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async obtenerCitasPorCliente(req, res) {
        const { clienteId } = req.params;
        const sucursalId = req.user.sucursalId;

        const citas =
            await this.citaService.obtenerCitasPorCliente(
                clienteId,
                sucursalId
            );

        res.status(200).json({
            success: true,
            data: citas
        });
    }

    /**
     * Obtiene las citas correspondientes a una fecha.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async obtenerCitasPorDia(req, res) {
        const { fecha } = req.query;
        const sucursalId = req.user.sucursalId;

        const citas =
            await this.citaService.obtenerCitasPorDia(
                sucursalId,
                fecha
            );

        res.status(200).json({
            success: true,
            data: citas
        });
    }

    /**
     * Obtiene las citas filtradas por estado.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async obtenerCitasPorEstado(req, res) {
        const { estado } = req.query;
        const sucursalId = req.user.sucursalId;

        const citas =
            await this.citaService.obtenerCitasPorEstado(
                sucursalId,
                estado
            );

        res.status(200).json({
            success: true,
            data: citas
        });
    }

    /**
     * Actualiza la fecha, hora o motivo de una cita.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async actualizarCita(req, res) {
        const { citaId } = req.params;

        const {
            fechaHora,
            motivo
        } = req.body;

        const sucursalId = req.user.sucursalId;

        const cita =
            await this.citaService.actualizarCita(
                citaId,
                sucursalId,
                fechaHora,
                motivo
            );

        res.status(200).json({
            success: true,
            message: 'Cita actualizada correctamente.',
            data: cita
        });
    }

    /**
     * Actualiza el estado de una cita.
     *
     * @param {import('express').Request} req - Solicitud HTTP.
     * @param {import('express').Response} res - Respuesta HTTP.
     * @returns {Promise<void>}
     */
    async actualizarEstadoCita(req, res) {
        const { citaId } = req.params;
        const { estado } = req.body;

        const sucursalId = req.user.sucursalId;

        const cita =
            await this.citaService.actualizarEstadoCita(
                citaId,
                sucursalId,
                estado
            );

        res.status(200).json({
            success: true,
            message: 'Estado de la cita actualizado correctamente.',
            data: cita
        });
    }
}

module.exports = CitaController;