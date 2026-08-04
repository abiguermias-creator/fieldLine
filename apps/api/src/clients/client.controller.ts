import { Request, Response } from "express";
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
} from "./client.service.js";
import {
  createClientSchema,
  updateClientSchema,
} from "./client.schemas.js";

type ClientParams = {
  id: string;
};

export async function createClientController(
  req: Request,
  res: Response
) {
  const data = createClientSchema.parse(req.body);

  const client = await createClient(data);

  res.status(201).json(client);
}

export async function getClientsController(
  _req: Request,
  res: Response
) {
  const clients = await getClients();

  res.json(clients);
}

export async function getClientController(
  req: Request<ClientParams>,
  res: Response
) {
  const client = await getClientById(req.params.id);

  if (!client) {
    return res.status(404).json({
      message: "Client not found",
    });
  }

  res.json(client);
}

export async function updateClientController(
  req: Request<ClientParams>,
  res: Response
) {
  const data = updateClientSchema.parse(req.body);

  const client = await updateClient(req.params.id, data);

  res.json(client);
}

export async function deleteClientController(
  req: Request<ClientParams>,
  res: Response
) {
  await deleteClient(req.params.id);

  res.status(204).send();
}