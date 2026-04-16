export function determineAgeGroup(age) {
  if (age === null || age === undefined) return null;
  if (age <= 12) return "child";
  if (age <= 19) return "teenager";
  if (age <= 59) return "adult";
  return "senior";
}

export function formatProfile(r) {
  return {
    id: r.id,
    name: r.name,
    gender: r.gender,
    gender_probability: parseFloat(r.gender_probability),
    sample_size: r.sample_size,
    age: r.age,
    age_group: r.age_group,
    country_id: r.country_id,
    country_probability: parseFloat(r.country_probability),
    created_at: r.created_at,
  };
}

export function handleUpstreamError(res, error) {
  const isUpstream =
    error.code === "ECONNABORTED" ||
    (error.response && error.response.status >= 500);
  return res.status(isUpstream ? 502 : 500).json({
    status: "error",
    message: isUpstream
      ? "Failed to reach an external prediction service"
      : "Internal server error",
  });
}
