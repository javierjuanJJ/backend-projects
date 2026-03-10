
export class ExpensesModel {
  static async getAll({ text, title, level, limit = 10, technology, offset = 0 }) {
    let filteredJobs = jobs

    if (text) {
      const searchTerm = text.toLowerCase()
      filteredJobs = filteredJobs.filter(job =>
        job.titulo.toLowerCase().includes(searchTerm) || job.descripcion.toLowerCase().includes(searchTerm)
      )
    }

    if (technology) {
      filteredJobs = filteredJobs.filter(job =>
        job.tecnologias.includes(technology)
      )
    }

    const limitNumber = Number(limit)
    const offsetNumber = Number(offset)

    const paginatedJobs = filteredJobs.slice(offsetNumber, offsetNumber + limitNumber)

    return paginatedJobs
  }

  static async getById(id) {
    const job = jobs.find(job => job.id === id)
    return job
  }

  static async getByIndexId(id) {
    return jobs.findIndex(job => job.id === id);
  }

  static async create({ titulo, empresa, ubicacion, data }) {
    const newJob = {
      id: crypto.randomUUID(),
      titulo,
      empresa,
      ubicacion,
      data
    }

    jobs.push(newJob) // lo haremos en una base de datos con un INSERT

    return newJob
  }

  static async update({ id, titulo, empresa, ubicacion, data }) {

    const index = await ExpensesModel.getByIndexId(id);

    // Creamos el objeto actualizado
    const updatedJob = {
      ...jobs[index],  // mantenemos lo que haya
      titulo,
      empresa,
      ubicacion,
      data
    };

    // Persistimos en memoria
    jobs[index] = updatedJob;

    return updatedJob;
  }

  static async partialUpdate({ id, partialData }) {
    const index = await ExpensesModel.getByIndexId(id);
    // Actualizamos solo las propiedades que vienen en partialData
    jobs[index] = { ...jobs[index], ...partialData };

    return jobs[index];
  }


  static async delete(id) {
    const index = await ExpensesModel.getByIndexId(id);

    jobs.splice(index, 1);
  }
}