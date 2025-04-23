export const prettyPrint = (json: unknown) => {
  console.log(JSON.stringify(json, null, 2));
};
