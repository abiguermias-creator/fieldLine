import { prisma } from "../db/client.js";
import { geocodeSite } from "../geocode/geocode.service.js";

export async function createSite(data: {
  clientId: string;
  name: string;
  address: string;
  city: string;
  accessNotes?: string;
}) {

  const site = await prisma.site.create({
    data,
  });


  // background geocoding
  geocodeSite(site.id)
    .catch((error) => {
      console.error(
        "Background geocoding failed:",
        error
      );
    });


  return site;
}



export async function getSites(user?: {
  role: string;
  userId: string;
}) {

  let where = {};

  if (user?.role === "CLIENT") {

    const currentUser = await prisma.user.findUnique({
      where: {
        id: user.userId,
      },
      select: {
        clientId: true,
      },
    });

    if (currentUser?.clientId) {
      where = {
        clientId: currentUser.clientId,
      };
    }
  }

  return prisma.site.findMany({
    where,

    include: {
      client: true,
      workOrders: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getSiteById(id: string) {

  return prisma.site.findUnique({

    where: {
      id,
    },

    include: {
      client: true,
      workOrders: true,
    },

  });

}


export async function updateSite(
  id:string,
  data:{
    clientId?:string;
    name?:string;
    address?:string;
    city?:string;
    accessNotes?:string;
  }
){

  return prisma.site.update({

    where:{
      id,
    },

    data,

  });

}



export async function deleteSite(id:string){

  const workOrderCount =
    await prisma.workOrder.count({
      where:{
        siteId:id,
      },
    });


  if(workOrderCount > 0){

    throw new Error(
      `Cannot delete site. It has ${workOrderCount} work orders. Deactivate instead.`
    );

  }


  return prisma.site.delete({
    where:{
      id,
    },
  });

}



export async function deactivateSite(id:string){

  return prisma.site.update({

    where:{
      id,
    },

    data:{
      isActive:false,
    },

  });

}

export async function updateSiteLocation(
  id: string,
  data: {
    latitude: number;
    longitude: number;
  }
) {
  return prisma.site.update({
    where: {
      id,
    },
    data: {
      latitude: data.latitude,
      longitude: data.longitude,
      coordinatesManual: true,
    },
  });
}