/**
 * Tests del caso de uso crearPedido + dominio, con el adaptador en memoria
 * (sin Supabase). Correr: npx tsx --test tests/crear-pedido.test.ts
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { crearPedido, ERROR_SIN_LINEAS } from "../lib/aplicacion/crear-pedido";
import { siguienteEstado } from "../lib/domain/pedido";
import { repoMemoria } from "../lib/infra/repo-memoria";

const catalogo = [
  { id: 1, precio: 100, tenantId: "A" },
  { id: 2, precio: 250, tenantId: "A" },
  { id: 3, precio: 999, tenantId: "B" },
];

test("el total sale del precio del catálogo", async () => {
  const repo = repoMemoria(catalogo);
  await crearPedido(repo, {
    tenantId: "A",
    clienteId: "10",
    origen: "vendedor",
    cantidades: new Map([
      [1, 2],
      [2, 1],
    ]),
  });

  const [pedido] = repo.guardados;
  assert.equal(pedido.subtotal, 450);
  assert.equal(pedido.descuento, 0);
  assert.equal(pedido.total, 450);
  assert.deepEqual(
    pedido.lineas.map((l) => l.precioUnitario),
    [100, 250],
  );
});

test("vendedor → confirmado, portal → pendiente", async () => {
  const repo = repoMemoria(catalogo);
  const cantidades = new Map([[1, 1]]);
  await crearPedido(repo, { tenantId: "A", clienteId: "10", origen: "vendedor", cantidades });
  await crearPedido(repo, { tenantId: "A", clienteId: "10", origen: "cliente_portal", cantidades });

  assert.equal(repo.guardados[0].estado, "confirmado");
  assert.equal(repo.guardados[1].estado, "pendiente");
});

test("cantidades 0 o negativas → error", async () => {
  const repo = repoMemoria(catalogo);
  await assert.rejects(
    crearPedido(repo, {
      tenantId: "A",
      clienteId: "10",
      origen: "vendedor",
      cantidades: new Map([
        [1, 0],
        [2, -3],
      ]),
    }),
    { message: ERROR_SIN_LINEAS },
  );
  assert.equal(repo.guardados.length, 0);
});

test("un producto de otro tenant no entra al pedido", async () => {
  const repo = repoMemoria(catalogo);
  await crearPedido(repo, {
    tenantId: "A",
    clienteId: "10",
    origen: "cliente_portal",
    cantidades: new Map([
      [1, 1],
      [3, 5], // producto del tenant B
    ]),
  });

  const [pedido] = repo.guardados;
  assert.deepEqual(pedido.lineas.map((l) => l.productoId), [1]);
  assert.equal(pedido.total, 100);
});

test("el correlativo es por tenant", async () => {
  const repo = repoMemoria(catalogo);
  const pedir = (tenantId: string, productoId: number) =>
    crearPedido(repo, {
      tenantId,
      clienteId: "10",
      origen: "vendedor",
      cantidades: new Map([[productoId, 1]]),
    });

  assert.equal((await pedir("A", 1)).numeroPedido, 1);
  assert.equal((await pedir("A", 2)).numeroPedido, 2);
  assert.equal((await pedir("B", 3)).numeroPedido, 1);
  assert.equal((await pedir("A", 1)).numeroPedido, 3);
});

test('siguienteEstado("pendiente") = "confirmado", siguienteEstado("entregado") = null', () => {
  assert.equal(siguienteEstado("pendiente"), "confirmado");
  assert.equal(siguienteEstado("entregado"), null);
});
