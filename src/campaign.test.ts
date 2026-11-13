import { classifyEvents } from "./campaign.ts";

const opened = classifyEvents([{ type: "delivered" }, { type: "opened" }]);
if (opened !== "opened") throw new Error(`expected opened, got ${opened}`);

const bounced = classifyEvents([{ event: "bounce" }]);
if (bounced !== "bounced") throw new Error(`expected bounced, got ${bounced}`);

console.log("campaign decision test passed");
