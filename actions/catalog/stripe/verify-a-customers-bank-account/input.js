const nodeInput = ({ $body, $headers, $env, $data }) => {
  return {
    BUILDABLE_STRIPE_SECRET_KEY: $env.BUILDABLE_STRIPE_SECRET_KEY, // Required
    customer: "string", // Required
    id: "string", // Required

    // amounts: [0],
    // expand: ["string"],
    // amounts0: "<integer>",
    // amounts1: "<integer>",
    // expand0: "<string>",
    // expand1: "<string>",
  };
};
