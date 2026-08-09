import { Request, Response } from "express";
import {
  createSite,
  deleteSite,
  deactivateSite,
  getSiteById,
  getSites,
  updateSite,
  updateSiteLocation,
} from "./site.service.js";

import {
  createSiteSchema,
  updateSiteSchema,
} from "./site.schemas.js";

import type
 { AuthRequest } 
 from "../middleware/auth.js";


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
  req: AuthRequest,
  res: Response
) {
  const sites = await getSites(req.user);

  res.json(sites);
}



export async function getSiteController(
  req: Request<SiteParams>,
  res: Response
) {
  const site = await getSiteById(
    req.params.id
  );

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
  const data = updateSiteSchema.parse(
    req.body
  );

  const site = await updateSite(
    req.params.id,
    data
  );

  res.json(site);
}



export async function deleteSiteController(
  req: Request<SiteParams>,
  res: Response
) {

  try {

    const site = await deleteSite(
      req.params.id
    );

    res.status(200).json(site);

  } catch(error:any){

    res.status(400).json({
      message:error.message,
    });

  }

}



export async function deactivateSiteController(
  req: Request<SiteParams>,
  res: Response
) {

  const site = await deactivateSite(
    req.params.id
  );

  res.json(site);

}

export async function updateSiteLocationController(
  req: Request<SiteParams>,
  res: Response
) {
  const { latitude, longitude } = req.body;

  const site = await updateSiteLocation(
    req.params.id,
    {
      latitude,
      longitude,
    }
  );

  res.json(site);
}