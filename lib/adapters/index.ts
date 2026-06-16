import type { NormalizedGroup, SourceType } from "@/types";
import { fetchGroupsFromSendflow } from "./sendflow";
import { fetchGroupsFromDevzapp } from "./devzapp";
import { fetchGroupsFromManual } from "./manual";
import { fetchGroupsFromGenericSource } from "./generic";

export async function fetchGroupsBySourceType(
  sourceType: SourceType,
  sourceUrl: string
): Promise<NormalizedGroup[]> {
  switch (sourceType) {
    case "sendflow":
      return fetchGroupsFromSendflow(sourceUrl);
    case "devzapp":
      return fetchGroupsFromDevzapp(sourceUrl);
    case "manual":
      return fetchGroupsFromManual(sourceUrl);
    case "other":
      return fetchGroupsFromGenericSource(sourceUrl);
    default:
      throw new Error(`Tipo de fonte desconhecido: ${sourceType}`);
  }
}

export {
  fetchGroupsFromSendflow,
  fetchGroupsFromDevzapp,
  fetchGroupsFromManual,
  fetchGroupsFromGenericSource,
};
