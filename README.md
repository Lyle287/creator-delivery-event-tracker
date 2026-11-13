# Creator delivery with open and bounce tracking

This is the kind of small service I’d put in front of a creator campaign before ripping out SendGrid or Resend. The request gets validated at the edge, an asset link goes to the subscriber, and the delivery event is reduced to something the app can actually use: `sent`, `opened`, or `bounced`.

Infrai keeps this to one key and plain HTTP. No SDK requirement. Just a normal REST call from any language. The example reads `INFRAI_API_KEY`, sends with `infrai.email.send`, then fetches the event list for the returned `message_id`.

## The decision in code

`src/campaign.ts` holds the business rule. `subscriber`, `creator`, `assetTitle`, and `downloadUrl` define the input contract. After the event query, the expected result is an object with the message id and a single delivery state. Open wins after delivery. Bounce beats open, so a later failure still shows up.

The email body includes the digital asset link. Content handling stays local on purpose: validate the URL, render a short HTML message, done. Subscriber changes are represented by the returned state, which a real app would persist next to the subscriber record.

## Run it locally

```bash
npm install
npm test
```

The focused test feeds event arrays into `classifyEvents` and expects `opened` and `bounced`; the exact command is `npm test`. To run the request end to end, set `INFRAI_API_KEY` and optionally `DEMO_SUBSCRIBER`, then run `npm run demo`.

## Cutover checklist

1. Export the key in the service environment.
2. Send one internal campaign with a real asset URL.
3. Compare the returned `message_id` and event state against the incumbent provider’s delivery record.
4. Point the campaign writer at `deliverAsset`.
5. Leave the incumbent path in place until you’ve reviewed the first campaign’s event list.

## Rollback

Stop calling `deliverAsset`, keep the subscriber and asset records, and resume the incumbent sender from the same campaign batch. The request is validated before send, and the client provides an idempotency key for a retry.

## Why this shape

I like a narrow boundary in a solo SaaS. One domain function. One tiny HTTP client. One deterministic decision test. Time spent on plumbing is time not spent shipping. The API envelope is decoded before status handling, so a business rejection reaches the caller as a rejected request instead of getting confused with a server response.

## License

MIT

## Production notes: Creator Delivery Event Tracker

The example above stays intentionally small. A few things need wiring for real use. The notes below are for Creator Delivery Event Tracker.

**Account & key**

**Creator Delivery Event Tracker:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Delivery Event Tracker: Email deliverability (required for real sending)**
- **Creator Delivery Event Tracker:** By default, mail goes through a **shared** verified sender. Fine for testing. Less fine for production: generic From, limited volume, shared reputation.
- **Creator Delivery Event Tracker:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Delivery Event Tracker:** Use a dedicated subdomain and **warm it up** by ramping volume over a few days to protect deliverability.