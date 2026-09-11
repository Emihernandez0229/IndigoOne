class PacienteService {

    constructor(pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }


    // CREATE
    async crearPaciente(datosPaciente) {

        const {
            sucursalId,
            nombre,
            telefono,
            email,
            fechaNacimiento
        } = datosPaciente;

        if (!sucursalId) {
            throw new Error('La sucursal es obligatoria');
        }

        if (!nombre) {
            throw new Error('El nombre del paciente es obligatorio');
        }

        return await this.pacienteRepository.crearPaciente({
            sucursalId,
            nombre,
            telefono,
            email,
            fechaNacimiento
        });
    }


    // READ - todos
    async obtenerPacientes(sucursalId) {

        if (!sucursalId) {
            throw new Error('La sucursal es obligatoria');
        }

        return await this.pacienteRepository.obtenerPacientes(
            sucursalId
        );
    }


    // READ - uno
    async obtenerPacientePorId(id) {

        if (!id) {
            throw new Error('El ID del paciente es obligatorio');
        }

        const paciente =
            await this.pacienteRepository.obtenerPacientePorId(id);

        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        return paciente;
    }


    // UPDATE
    async actualizarPaciente(id, datosPaciente) {

        if (!id) {
            throw new Error('El ID del paciente es obligatorio');
        }

        const {
            nombre,
            telefono,
            email,
            fechaNacimiento
        } = datosPaciente;

        if (!nombre) {
            throw new Error('El nombre del paciente es obligatorio');
        }

        const paciente =
            await this.pacienteRepository.actualizarPaciente(
                id,
                {
                    nombre,
                    telefono,
                    email,
                    fechaNacimiento
                }
            );

        if (!paciente) {
            throw new Error('Paciente no encontrado');
        }

        return paciente;
    }
}

module.exports = PacienteService;