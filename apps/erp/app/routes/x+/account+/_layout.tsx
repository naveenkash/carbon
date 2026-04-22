import { Heading, VStack } from "@carbon/react";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import type { MetaFunction } from "react-router";
import { Outlet } from "react-router";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";

export const meta: MetaFunction = () => {
  return [{ title: "Carbon | My Account" }];
};

export const handle: Handle = {
  breadcrumb: msg`Account`,
  to: path.to.profile,
  module: "account"
};

export default function AccountRoute() {
  // const { links } = useAccountSubmodules();

  return (
    <VStack
      className="flex w-full h-full items-center justify-start bg-card"
      spacing={0}
    >
      <div className="flex bg-card border-b border-border py-8 px-2 w-full justify-center">
        <div className="w-full max-w-[60rem]">
          <Heading size="h3">
            <Trans>Account Settings</Trans>
          </Heading>
        </div>
      </div>

      {/* <div className="flex-1 min-h-0 w-full overflow-y-auto flex justify-center"> */}
      <div className="max-w-[60rem] w-full flex-1 min-h-0 overflow-y-auto flex justify-center">
        <div className="grid grid-cols-1 w-full gap-8">
          {/* <DetailSidebar links={links} /> */}
          <VStack spacing={0}>
            <Outlet />
          </VStack>
        </div>
        {/* </div> */}
      </div>
    </VStack>
  );
}
