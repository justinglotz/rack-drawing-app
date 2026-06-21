import { apiFetch } from "./client";
import {
  genericEquipmentSchema,
  GenericEquipment,
} from "@/types/genericEquipmentTypes";
import { z } from "zod";

export async function getGenericEquipment(): Promise<GenericEquipment[]> {
  return apiFetch("/generic-equipment", z.array(genericEquipmentSchema));
}
