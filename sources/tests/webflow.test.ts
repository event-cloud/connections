require("dotenv").config();

import WebflowIntegration from "../catalog/webflow/webflow";
import { AnyObject } from "../types/classDefinition";

const webflow = new WebflowIntegration({
  WEBFLOW_BASE_URL: process.env.WEBFLOW_BASE_URL as string,
  WEBFLOW_API_TOKEN: process.env.WEBFLOW_API_TOKEN as string,
  WEBFLOW_SITE_ID: process.env.WEBFLOW_SITE_ID as string,
});

async function createTestWebhook(testWebhookUrl: string, events: string[]): Promise<string> {
  const webhooks = await webflow.init({ webhookUrl: testWebhookUrl, events });
  return webhooks.webhookData[0]._id;
}

async function deleteTestWebhook(webhookId: string) {
  await webflow.deleteWebhookEndpoint({ webhookId });
}

async function deleteTestWebhooks(webhookIds: string[]) {
  const webhooksDeleteRequest = webhookIds.map((webhookId) =>
    webflow.deleteWebhookEndpoint({ webhookId }),
  );
  await Promise.all(webhooksDeleteRequest);
}

describe("Webflow Integration", () => {
  describe("init", () => {
    let webhookId: string | undefined;

    afterEach(async () => {
      if (webhookId) {
        await deleteTestWebhook(webhookId);
      }
    });

    it("should create a webhook", async () => {
      const { webhookData, events } = await webflow.init({
        webhookUrl: "https://webhook.site/30bf4e85-64b8-48ec-a1d2-1bb357a8a017",
        events: ["form_submission"],
      });

      expect(webhookData).toBeDefined();
      expect(webhookData).toHaveLength(1);
      expect(events).toEqual(["form_submission"]);

      webhookId = (webhookData as AnyObject[])[0]._id;
    });

    it("should throw an exception when passing in unknown event", async () => {
      await expect(
        webflow.init({
          webhookUrl: "https://example.com/webhook",
          events: ["form_submission1"],
        }),
      ).rejects.toThrow();
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should return true if the signature is valid", async () => {
      expect(
        webflow.verifyWebhookSignature({
          request: { headers: {}, body: "" },
          signature: "",
          secret: null,
        }),
      ).toBeTruthy();
    });
  });

  describe("subscribe", () => {
    let webhookIds = new Array<string>();

    beforeEach(async () => {
      const testWebhookUrl = "https://example.com/webhook";
      const testEvents = ["form_submission"];

      const webhookId = await createTestWebhook(testWebhookUrl, testEvents);
      webhookIds.push(webhookId);
    });

    afterEach(async () => {
      if (webhookIds.length) {
        await deleteTestWebhooks(webhookIds);

        webhookIds = [];
      }
    });

    it("should subscribe to the new event by creating a new webhook", async () => {
      const { webhooks, events } = await webflow.subscribe({
        events: ["site_publish"],
        webhookIds: [webhookIds[0]],
        webhookUrl: "https://example.com/webhook",
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(2);
      expect(events).toEqual(["form_submission", "site_publish"]);

      webhookIds = (webhooks as AnyObject[]).map((wb) => wb._id);
    });

    it("should handle subscription of an existing event", async () => {
      const { webhooks, events } = await webflow.subscribe({
        events: ["form_submission"],
        webhookIds: [webhookIds[0]],
        webhookUrl: "https://example.com/webhook",
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(1);
      expect(events).toEqual(["form_submission"]);
    });
  });

  describe("unsubscribe", () => {
    let webhookId: string | undefined;

    beforeEach(async () => {
      const testWebhookUrl = "https://example.com/webhook";
      const testEvents = ["form_submission"];

      webhookId = await createTestWebhook(testWebhookUrl, testEvents);
    });

    afterEach(async () => {
      if (webhookId) {
        await deleteTestWebhook(webhookId);
      }
    });

    it("should unsubscribe from the event(s)", async () => {
      const { webhooks, events } = await webflow.unsubscribe({
        events: ["form_submission"],
        webhookIds: [webhookId as string],
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(0);
      expect(events).toBeDefined();
      expect(events).toHaveLength(0);
    });

    it("should delete webhook if no events remain", async () => {
      const { webhooks, events } = await webflow.unsubscribe({
        events: ["form_submission", "site_publish"],
        webhookIds: [webhookId as string],
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(0);
      expect(events).toBeDefined();
      expect(events).toHaveLength(0);

      webhookId = undefined;
    });
  });

  describe("getWebhooks", () => {
    let webhookId: string | undefined;

    beforeEach(async () => {
      const testWebhookUrl = "https://example.com/webhook";
      const testEvents = ["form_submission"];

      webhookId = await createTestWebhook(testWebhookUrl, testEvents);
    });

    afterEach(async () => {
      if (webhookId) {
        await deleteTestWebhook(webhookId);
      }
    });

    it("should return webhooks", async () => {
      const webhooks = await webflow.getWebhooks({
        webhookIds: [webhookId as string],
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(1);
    });

    it("should return all webhooks if webhookIds not provided", async () => {
      const webhooks = await webflow.getWebhooks({
        webhookIds: undefined,
      });

      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(1);
    });

    it("should return an empty data if the webhook does not exist", async () => {
      const webhooks = await webflow.getWebhooks({
        webhookIds: ["123456789"],
      });
      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(0);
    });
  });

  describe("getSubscribedEvents", () => {
    let webhookId: string | undefined;

    beforeEach(async () => {
      const testWebhookUrl = "https://example.com/webhook";
      const testEvents = ["form_submission"];

      webhookId = await createTestWebhook(testWebhookUrl, testEvents);
    });

    afterEach(async () => {
      if (webhookId) {
        await deleteTestWebhook(webhookId);
      }
    });

    it("should return the subscribed events", async () => {
      const events = await webflow.getSubscribedEvents({
        webhookIds: [webhookId as string],
      });

      expect(events).toEqual(["form_submission"]);
    });
  });

  describe("deleteWebhookEndpoint", () => {
    let webhookId: string | undefined;

    beforeEach(async () => {
      const testWebhookUrl = "https://example.com/webhook";
      const testEvents = ["form_submission"];

      webhookId = await createTestWebhook(testWebhookUrl, testEvents);
    });

    afterEach(async () => {
      if (webhookId) {
        await deleteTestWebhook(webhookId);
      }
    });

    it("should delete the webhook", async () => {
      const result = await webflow.deleteWebhookEndpoint({
        webhookId: webhookId as string,
      });

      expect(result).toBeTruthy();

      webhookId = undefined;
    });

    it("should not throw an error if the webhook does not exist", async () => {
      const result = await webflow.deleteWebhookEndpoint({
        webhookId: webhookId as string,
      });

      expect(result).toBeTruthy();
    });
  });

  describe("testConnection", () => {
    it("should return true if the connection is valid", async () => {
      const result = await webflow.testConnection();
      expect((result as any).success).toBe(true);
    });

    it("should throw an error if connection fails", async () => {
      const badWebflowIntegration = new WebflowIntegration({
        WEBFLOW_BASE_URL: "",
        WEBFLOW_API_TOKEN: "",
        WEBFLOW_SITE_ID: "",
      });
      await expect(badWebflowIntegration.testConnection()).rejects.toThrow();
    });
  });
});
