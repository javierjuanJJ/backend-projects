import { NextResponse } from "next/server";

export function ok(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created(data) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function badRequest(message) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function unauthorized(message = "No autorizado") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function serverError(message = "Error interno del servidor") {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
