import type { Plugin, PluginAPI } from "@lumeweb/relay-types";
import { createHash } from "crypto";
import { Parser } from "xml2js";

export function errorExit(api: PluginAPI, msg: string): void {
  api.logger.error(msg);
  process.exit(1);
}

async function getDomainInfo(
  api: PluginAPI,
  relayDomain: string
): Promise<void> {
  const parser = new Parser();

  const url = new URL("https://freedns.afraid.org/api/");

  const params = url.searchParams;

  params.append("action", "getdyndns");
  params.append("v", "2");
  params.append("style", "xml");

  const hash = createHash("sha1");
  hash.update(
    `${api.config.str("afraid-username")}|${api.config.str("afraid-password")}`
  );

  params.append("sha", hash.digest().toString("hex"));

  const response = await (await fetch(url.toString())).text();

  if (/could not authenticate/i.test(response)) {
    errorExit(api, "Failed to authenticate to afraid.org");
  }

  const json = await parser.parseStringPromise(response);

  let domain = null;

  for (const item of json.xml.item) {
    if (item.host[0] === relayDomain) {
      domain = item;
      break;
    }
  }

  if (!domain) {
    errorExit(api, `Domain ${relayDomain} not found in afraid.org account`);
  }
}

const plugin: Plugin = {
  name: "afraid-dns",
  async plugin(api: PluginAPI): Promise<void> {
    api.dns.setProvider(async (ipAddress: string, domain: string) => {
      await getDomainInfo(api, domain);
    });
  },
};

export default plugin;
