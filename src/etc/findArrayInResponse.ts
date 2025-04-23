import { first, keys, values } from "lodash";

function findArrayInResponse<T>(json: string): T[] {
  const data = JSON.parse(json);
  if (Array.isArray(data)) return data;
  if (!isNaN(parseInt(first(keys(data))!))) return values(data);
  return values(data)[0] as T[];
}

export default findArrayInResponse;
