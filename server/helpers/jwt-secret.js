function getJwtSecret() {
  const key = process.env.SECRET_KEY;
  if (!key && process.env.NODE_ENV === "production") {
    throw new Error("SECRET_KEY must be set in production");
  }
  return key || "andedhiatyalove";
}

module.exports = { getJwtSecret };
