import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { ok, badRequest, unauthorized, notFound, serverError } from "@/lib/response";

/**
 * Helper: busca un gasto por ID y verifica que pertenezca al usuario
 */
async function findExpense(id, userId) {
  const parsed = parseInt(id);
  if (isNaN(parsed)) return null;

  return prisma.expense.findFirst({
    where: { id: parsed, userId },
  });
}

/**
 * GET /api/expenses/[id]
 *
 * Obtiene un gasto específico por su ID primario.
 * Solo devuelve el gasto si pertenece al usuario autenticado.
 *
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request, { params }) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) return unauthorized();

    const { id } = await params;
    const expense = await findExpense(id, userPayload.id);

    if (!expense) return notFound("Gasto no encontrado");

    return ok(expense);
  } catch (error) {
    console.error("[GET /api/expenses/:id]", error);
    return serverError();
  }
}

/**
 * PUT /api/expenses/[id]
 * Body: { title?: string, description?: string, amount?: number }
 *
 * Actualiza un gasto existente del usuario autenticado.
 * Soporta actualización parcial (solo los campos enviados se actualizan).
 *
 * Headers: Authorization: Bearer <token>
 */
export async function PUT(request, { params }) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) return unauthorized();

    const { id } = await params;
    const existing = await findExpense(id, userPayload.id);
    if (!existing) return notFound("Gasto no encontrado");

    const body = await request.json();
    const { title, description, amount } = body;

    // Construir objeto de actualización solo con campos enviados
    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return badRequest("El título no puede estar vacío");
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return badRequest("La descripción debe ser texto");
      }
      updateData.description = description.trim();
    }

    if (amount !== undefined) {
      if (isNaN(Number(amount))) return badRequest("El monto debe ser un número");
      if (Number(amount) < 0) return badRequest("El monto no puede ser negativo");
      updateData.amount = parseFloat(amount);
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("No se enviaron campos para actualizar");
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: updateData,
    });

    return ok(updated);
  } catch (error) {
    console.error("[PUT /api/expenses/:id]", error);
    return serverError();
  }
}

/**
 * DELETE /api/expenses/[id]
 *
 * Elimina un gasto del usuario autenticado.
 *
 * Headers: Authorization: Bearer <token>
 */
export async function DELETE(request, { params }) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) return unauthorized();

    const { id } = await params;
    const existing = await findExpense(id, userPayload.id);
    if (!existing) return notFound("Gasto no encontrado");

    await prisma.expense.delete({ where: { id: existing.id } });

    return ok({ message: "Gasto eliminado correctamente", id: existing.id });
  } catch (error) {
    console.error("[DELETE /api/expenses/:id]", error);
    return serverError();
  }
}
