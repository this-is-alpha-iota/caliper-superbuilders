/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "caliper-superbuilders",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // DynamoDB tables
    const sensorsTable = new sst.aws.Dynamo("CaliperSensors", {
      fields: {
        apiKey: "string",
      },
      primaryIndex: { hashKey: "apiKey" },
    });

    const eventsTable = new sst.aws.Dynamo("CaliperEvents", {
      fields: {
        pk: "string", // Format: EVENT#{date}#{randomId}
        sk: "string", // Format: SENSOR#{sensorId}
        eventTime: "number", // Unix timestamp for TTL
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        // Query by sensor
        BySensor: {
          hashKey: "sk",
          rangeKey: "eventTime",
          projection: "all",
        },
      },
      stream: "new-and-old-images",
      ttl: "ttl", // Optional TTL field
    });

    // Create the Lambda function for our API
    const api = new sst.aws.Function("CaliperApi", {
      handler: "src/index.handler",
      runtime: "nodejs20.x",
      architecture: "arm64",
      url: true, // Enable function URL
      environment: {
        NODE_ENV: $dev ? "development" : "production",
        SENSORS_TABLE: sensorsTable.name,
        EVENTS_TABLE: eventsTable.name,
      },
      link: [sensorsTable, eventsTable],
    });

    // Output the API URL
    return {
      api: api.url,
      sensorsTable: sensorsTable.name,
      eventsTable: eventsTable.name,
    };
  },
});
