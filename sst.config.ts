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
    // Create the Lambda function for our API
    const api = new sst.aws.Function("CaliperApi", {
      handler: "src/index.handler",
      runtime: "nodejs20.x",
      architecture: "arm64",
      url: true, // Enable function URL
      environment: {
        NODE_ENV: $dev ? "development" : "production",
      },
    });

    // Output the API URL
    return {
      api: api.url,
    };
  },
});
