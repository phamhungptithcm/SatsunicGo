export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 40;
export function taxonomyKey(value: string) {
  return value.trim().normalize("NFC").toLowerCase();
}
export function addTag(
  tags: string[],
  input: string,
): { tags: string[]; error?: never } | { tags?: never; error: string } {
  const tag = input.trim();
  if (!tag || tags.some((value) => taxonomyKey(value) === taxonomyKey(tag)))
    return { tags };
  if (tags.length >= MAX_TAGS)
    return { error: `Bạn chỉ có thể thêm tối đa ${MAX_TAGS} tag.` };
  if (tag.length > MAX_TAG_LENGTH)
    return { error: `Mỗi tag tối đa ${MAX_TAG_LENGTH} ký tự.` };
  return { tags: [...tags, tag] };
}
