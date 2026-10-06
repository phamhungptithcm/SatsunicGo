const release = process.env.SATSUNICGO_SANITY_RELEASE ?? "release021";
if (
  release !== "release021" &&
  release !== "release023" &&
  release !== "release024" &&
  release !== "release025" &&
  release !== "release026" &&
  release !== "release027"
)
  throw Error("Unknown local sanity artifact namespace");
export const artifactDirectory = `output/playwright/${release}`;
