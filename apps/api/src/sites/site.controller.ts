import { Request, Response } from "express";
import {
  createSite,
  deleteSite,
  getSiteById,
  getSites,
  updateSite,
} from "./site.service.js";
import {
  createSiteSchema,
  updateSiteSchema,
} from "./site.schemas.js";

type SiteParams = {
  id: string;
};

export async function createSiteController(
  req: Request,
  res: Response
) {
  const data = createSiteSchema.parse(req.body);

  const site = await createSite(data);

  res.status(201).json(site);
}

export async function getSitesController(
  _req: Request,
  res: Response
) {
  const sites = await getSites();

  res.json(sites);
}

export async function getSiteController(
  req: Request<SiteParams>,
  res: Response
) {
  const site = await getSiteById(req.params.id);

  if (!site) {
    return res.status(404).json({
      message: "Site not found",
    });
  }

  res.json(site);
}

export async function updateSiteController(
  req: Request<SiteParams>,
  res: Response
) {
  const data = updateSiteSchema.parse(req.body);

  const site = await updateSite(req.params.id, data);

  res.json(site);
}

export async function deleteSiteController(
  req: Request<SiteParams>,
  res: Response
) {
  const site = await deleteSite(req.params.id);

  res.status(200).json(site);
}