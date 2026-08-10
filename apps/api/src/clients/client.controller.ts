import { Request, Response } from "express";

import {
  createClient,
  deleteClient,
  deactivateClient,
  activateClient,
  getClientById,
  getClients,
  updateClient,
} from "./client.service.js";

import {
  createClientSchema,
  updateClientSchema,
  clientIdSchema,
  listClientsQuerySchema,
} from "./client.schemas.js";

export async function createClientController(
  req: Request,
  res: Response
) {
  const data = createClientSchema.parse(req.body);

  const client = await createClient(data);

  res.status(201).json(client);
}

export async function getClientsController(
  req: Request,
  res: Response
) {
  const query = listClientsQuerySchema.parse(req.query);

  const clients = await getClients(
    query.page,
    query.search
  );

  res.json(clients);
}

export async function getClientController(
  req: Request,
  res: Response
) {
  const { id } = clientIdSchema.parse(req.params);

  const client = await getClientById(id);

  if (!client) {
    return res.status(404).json({
      message: "Client not found",
    });
  }

  res.json(client);
}

export async function updateClientController(
  req: Request,
  res: Response
) {
  const { id } = clientIdSchema.parse(req.params);
  const data = updateClientSchema.parse(req.body);

  const client = await updateClient(id, data);

  res.json(client);
}

export async function deleteClientController(
  req: Request,
  res: Response
) {
  try {
    const { id } = clientIdSchema.parse(req.params);

    await deleteClient(id);

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function activateClientController(
  req: Request,
  res: Response
) {
  try {
    const { id } = clientIdSchema.parse(req.params);

    const client = await activateClient(id);

    res.json(client);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
}

export async function deactivateClientController(
  req: Request,
  res: Response
) {
  const { id } = clientIdSchema.parse(req.params);

  const client = await deactivateClient(id);

  res.json(client);
}

