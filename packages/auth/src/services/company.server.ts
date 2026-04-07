import { CarbonEdition, DOMAIN } from "@carbon/auth";
import { Edition } from "@carbon/utils";
import * as cookie from "cookie";

const cookieName = "companyId";
const isTestEdition = CarbonEdition === Edition.Test;

// Cookie domain must be a bare hostname with no port.
// Skip entirely for localhost to avoid cookie domain validation errors.
// const cookieDomain = (() => {
//   if (!DOMAIN) return undefined;
//   const host = DOMAIN.includes("://")
//     ? new URL(DOMAIN).hostname
//     : DOMAIN.split(":")[0];
//   return host === "localhost" ? undefined : host;
// })();

export function setCompanyId(companyId: string | null) {
  const cookieOptions: cookie.SerializeOptions = {
    path: "/",
    maxAge: 31536000
  };
  if (DOMAIN && !DOMAIN.startsWith("localhost")) {
    cookieOptions.domain = isTestEdition ? undefined : DOMAIN;
  }
  if (!companyId) {
    return cookie.serialize(cookieName, "", cookieOptions);
  }

  return cookie.serialize(cookieName, companyId, cookieOptions);
}
