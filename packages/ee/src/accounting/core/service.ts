import type { Database } from "@carbon/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Accounting, TablesWithExternalId } from "../entities";
import { XeroProvider } from "../providers";
import {
  ExternalIdSchema,
  ProviderCredentials,
  ProviderCredentialsSchema,
  ProviderID
} from "./models";
import { AccountingSyncPayload } from "./sync";

export const getAccountingIntegration = async <T extends ProviderID>(
  client: SupabaseClient<Database>,
  companyId: string,
  provider: T
) => {
  const integration = await client
    .from("companyIntegration")
    .select("*")
    .eq("companyId", companyId)
    .eq("id", provider)
    .single();

  if (integration.error || !integration.data) {
    throw new Error(
      `No ${provider} integration found for company ${companyId}`
    );
  }

  const config = ProviderCredentialsSchema.safeParse(integration.data.metadata);

  if (!config.success) {
    console.error(integration.error);
    throw new Error("Invalid provider config");
  }

  return {
    id: provider as T,
    config: config.data
  } as const;
};

export const getProviderIntegration = (
  client: SupabaseClient<Database>,
  companyId: string,
  provider: ProviderID,
  config?: ProviderCredentials
) => {
  const { accessToken, refreshToken, tenantId } = config ?? {};

  // Create a callback function to update the integration metadata when tokens are refreshed
  const onTokenRefresh = async (auth: ProviderCredentials) => {
    try {
      console.log("Refreshing tokens for", provider, "integration");
      const update: ProviderCredentials = {
        ...auth,
        expiresAt:
          auth.expiresAt || new Date(Date.now() + 3600000).toISOString(), // Default to 1 hour if not provided
        tenantId: auth.tenantId || tenantId
      };

      await client
        .from("companyIntegration")
        .update({ metadata: update })
        .eq("companyId", companyId)
        .eq("id", provider);

      console.log(
        `Updated ${provider} integration metadata for company ${companyId}`,
        config
      );
    } catch (error) {
      console.error(
        `Failed to update ${provider} integration metadata:`,
        error
      );
    }
  };

  switch (provider) {
    // case "quickbooks": {
    //   const environment = process.env.QUICKBOOKS_ENVIRONMENT as
    //     | "production"
    //     | "sandbox";
    //   return new QuickBooksProvider({
    //     companyId,
    //     tenantId,
    //     environment: environment || "sandbox",
    //     clientId: process.env.QUICKBOOKS_CLIENT_ID!,
    //     clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
    //     redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
    //     onTokenRefresh
    //   });
    // }
    case "xero":
      return new XeroProvider({
        companyId,
        tenantId,
        accessToken,
        refreshToken,
        clientId: process.env.XERO_CLIENT_ID!,
        clientSecret: process.env.XERO_CLIENT_SECRET!,
        redirectUri: process.env.XERO_REDIRECT_URI,
        onTokenRefresh
      });
    // Add other providers as needed
    // case "sage":
    //   return new SageProvider(config);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export const getContactFromExternalId = async (
  client: SupabaseClient<Database>,
  companyId: string,
  provider: ProviderID,
  id: string
) => {
  const contact = await client
    .from("contact")
    .select("*")
    .eq("companyId", companyId)
    .eq("externalId->>provider", provider)
    .eq("externalId->>id", id)
    .single();

  if (contact.error || !contact.data) {
    return null;
  }

  const externalId = await ExternalIdSchema.safeParseAsync(
    contact.data.externalId
  );

  if (!externalId.success) {
    throw new Error("Invalid external ID format");
  }

  return {
    ...contact.data,
    externalId
  };
};

export const getEntityWithExternalId = async <T extends TablesWithExternalId>(
  client: SupabaseClient<Database>,
  table: T,
  companyId: string,
  provider: ProviderID,
  select: { externalId: string } | { id: string }
) => {
  let query = client
    .from(table as any) // Supabase typing issue
    .select("*")
    .eq("companyId", companyId)
    .eq(`externalId->${provider}->>provider`, provider);

  if ("id" in select) {
    query = query.eq("id", select.id);
  }

  if ("externalId" in select) {
    query = query.eq(`externalId->${provider}->>id`, select.externalId);
  }

  const entry = await query.maybeSingle();

  if (!entry.data) {
    return null;
  }

  const externalId = await ExternalIdSchema.safeParseAsync(
    // @ts-expect-error Supabase typing issue
    entry.data.externalId
  );

  if (!externalId.success) {
    throw new Error("Invalid external ID format");
  }

  return {
    ...(entry.data as unknown as Omit<
      Database["public"]["Tables"][T]["Row"],
      "externalId"
    >),
    externalId: externalId.data
  };
};

export const upsertAccountingCustomer = async (
  client: SupabaseClient<Database>,
  remote: Accounting.Contact,
  payload: AccountingSyncPayload
) => {
  let customer = await getEntityWithExternalId(
    client,
    "customer",
    payload.companyId,
    payload.provider,
    { externalId: remote.id }
  );

  if (!customer) {
    const inserted = await client
      .from("customer")
      .insert({
        name: remote.name,
        companyId: remote.companyId,
        website: remote.website,
        taxId: remote.taxId,
        currencyCode: remote.currencyCode,
        externalId: {
          [payload.provider]: {
            id: remote.id,
            provider: payload.provider,
            metadata: payload.metadata
          }
        }
      })
      .select("id")
      .single();

    if (inserted.error || !inserted.data) {
      throw inserted.error;
    }

    customer = await getEntityWithExternalId(
      client,
      "customer",
      payload.companyId,
      payload.provider,
      { externalId: remote.id }
    );
  }

  if (!customer) {
    throw new Error("Failed to upsert customer");
  }

  // Handle addresses
  for (const address of remote.addresses) {
    const record = {
      companyId: payload.companyId,
      addressLine1: address.line1,
      addressLine2: address.line2,
      city: address.city,
      countryCode: address.country,
      postalCode: address.postalCode
    };

    if (address.country) {
      const country = await client
        .from("country")
        .select("alpha2")
        .eq("alpha3", address.country)
        .or("alpha2.eq." + address.country)
        .single();

      if (country.error || !country.data) continue;

      record.countryCode = country.data.alpha2;
    }

    const insertedAddress = await client
      .from("address")
      .upsert(record)
      .select("id")
      .single();

    if (insertedAddress.error || !insertedAddress.data) {
      throw insertedAddress.error;
    }

    await client.from("customerLocation").insert({
      name: address.label ?? "Primary address",
      addressId: insertedAddress.data.id,
      customerId: customer.id,
      tags: [payload.provider]
    });
  }

  return customer;
};

export const upsertAccountingContact = async (
  client: SupabaseClient<Database>,
  remote: Accounting.Contact,
  customerId: string,
  payload: AccountingSyncPayload
) => {
  const contactConnections: Array<{
    name: string;
    contactId: string;
    customerId: string;
    tags: string[];
  }> = [];

  const phones = remote.phones.filter(
    (p) => typeof p.phone === "string" && p.phone!.trim() !== ""
  );

  for (let i = 0; i < phones.length; i++) {
    const phone = phones[i]!;

    if (!phone.phone) continue;

    const contact = await client
      .from("contact")
      .upsert({
        firstName: remote.firstName,
        lastName: remote.lastName,
        companyId: payload.companyId,
        mobilePhone: phone.phone,
        isCustomer: true
      })
      .select("id")
      .single();

    if (contact.error || !contact.data) {
      throw contact.error;
    }

    contactConnections.push({
      name: remote.name,
      contactId: contact.data.id,
      customerId: customerId,
      tags: [payload.provider]
    });
  }

  if (remote.email) {
    const contact = await client
      .from("contact")
      .upsert(
        {
          firstName: remote.firstName,
          lastName: remote.lastName,
          companyId: payload.companyId,
          email: remote.email,
          isCustomer: true
        },
        {
          onConflict: "email,companyId,isCustomer"
        }
      )
      .select("id")
      .single();

    if (contact.error) throw contact.error;

    contactConnections.push({
      name: remote.name,
      contactId: contact.data.id,
      customerId: customerId,
      tags: [payload.provider]
    });
  }

  await client.from("customerContact").upsert(contactConnections);

  return contactConnections;
};
