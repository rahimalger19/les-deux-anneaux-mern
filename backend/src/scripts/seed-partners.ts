import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database";
import { Partner , IPartner} from "../models/Partner";

dotenv.config();

/*
  Replace every value below only with real official partner information.
  Do not add partners that do not work with Les Deux Anneaux.
*/
const partners : Partial<IPartner>[] = [
 
  {
    name: "Hamoud Boualem",
    category: "CATERER",
    logoUrl: "../../frontend/public/images/partners/hamoud.png",
    websiteUrl: "https://hamoud-boualem.com/fr/",
    displayOrder: 1,
    clickCount: 0,
    active: true,
  },
 
];

async function seedPartners() {
  try {
    await connectDatabase();

    for (const partner of partners) {
      await Partner.collection.updateOne(
        { name: partner.name },
        { $set: partner },
        { upsert: true }
      );
    }

    console.log("Partner seed completed successfully.");
  } catch (error) {
    console.error("Partner seed error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedPartners();