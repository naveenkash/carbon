import { CarbonEdition, DOMAIN } from "@carbon/auth";
import { Edition } from "@carbon/utils";
import * as cookie from "cookie";

const cookieName = "companyId";
const isTestEdition = CarbonEdition === Edition.Test;

export function setCompanyId(companyId: string | null) {
  const cookieOptions: cookie.SerializeOptions = {
    path: "/"
  };
  if (DOMAIN && !DOMAIN.startsWith("localhost")) {
    cookieOptions.domain = isTestEdition ? undefined : DOMAIN;
  }
  if (!companyId) {
    cookieOptions.expires = new Date(0);
    return cookie.serialize(cookieName, "", cookieOptions);
  }
  cookieOptions.maxAge = 31536000;

  return cookie.serialize(cookieName, companyId, cookieOptions);
}
