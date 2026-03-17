import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/response";

/**
 * GET /api/expenses
 *
 * Lista los gastos del usuario autenticado.
 * Soporta filtrado mediante query params:
 *   - ?id=1              → busca por ID exacto
 *   - ?search=texto      → busca en title o description (contiene)
 *   - ?minAmount=10      → filtro por monto mínimo
 *   - ?maxAmount=500     → filtro por monto máximo
 *
 * Headers: Authorization: Bearer <token>
 */
export async function GET(request) {
  try {
    // Autenticar usuario con JWT
    const userPayload = authenticate(request);
    if (!userPayload) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    // ── Filtro por ID exacto ──────────────────────────────────────────────────
    if (id) {
      const expense = await prisma.expense.findFirst({
        where: {
          id: parseInt(id),
          userId: userPayload.id, // solo del usuario autenticado
        },
      });

      if (!expense) {
        return ok(null); // no encontrado, pero no error
      }

      return ok(expense);
    }

    // ── Construir filtros dinámicos ───────────────────────────────────────────
    const where = {
      userId: userPayload.id,
    };

    // Búsqueda por cadena de texto en title O description (OR lógico)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por rango de monto
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return ok(expenses);
  } catch (error) {
    console.error("[GET /api/expenses]", error);
    return serverError();
  }
}

/**
 * POST /api/expenses
 * Body: { title: string, description: string, amount: number }
 *
 * Crea un nuevo gasto asociado al usuario autenticado.
 * Headers: Authorization: Bearer <token>
 */
export async function POST(request) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) return unauthorized();

    const body = await request.json();
    const { title, description, amount } = body;

    // Validaciones
    if (!title || typeof title !== "string" || title.trim() === "") {
      return badRequest("El título es requerido");
    }
    if (!description || typeof description !== "string") {
      return badRequest("La descripción es requerida");
    }
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return badRequest("El monto debe ser un número válido");
    }
    if (Number(amount) < 0) {
      return badRequest("El monto no puede ser negativo");
    }

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        amount: parseFloat(amount),
        userId: userPayload.id,
      },
    });

    return created(expense);
  } catch (error) {
    console.error("[POST /api/expenses]", error);
    return serverError();
  }
}
