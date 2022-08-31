const nodeInput = ({ $body, $headers, $env, $data }) => {
  return {
    BUILDABLE_PAGERDUTY_API_KEY: $env.BUILDABLE_PAGERDUTY_API_KEY, // Required
    contentType: "application/json", // Required
    accept: "application/vnd.pagerduty+json;version=2", // Required
    id: "string", // Required
    contact_method_id: "string", // Required
    contact_method: {
      type: "phone_contact_method",
      label: "work",
      address: "1234567",
      country_code: 123,
    }, // Required
  };
};
