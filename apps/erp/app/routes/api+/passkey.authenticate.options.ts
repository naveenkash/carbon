import { assertIsPost } from "@carbon/auth";
import { getPasskeyAuthenticationOptions } from "@carbon/auth/passkey.server";
import { nanoid } from "nanoid";
import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  assertIsPost(request);

  const challengeId = nanoid();
  const options = await getPasskeyAuthenticationOptions(challengeId);

  return data({ ...options, challengeId });
}
