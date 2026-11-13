import { deliverAsset } from "../src/campaign.ts";

const result = await deliverAsset({
  subscriber: process.env.DEMO_SUBSCRIBER ?? "reader@example.com",
  creator: "Mina Chen",
  assetTitle: "Launch notes",
  downloadUrl: "https://example.com/assets/launch-notes"
});
console.log(JSON.stringify(result, null, 2));
