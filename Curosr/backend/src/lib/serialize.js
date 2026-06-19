export function stripPoliceFields(item) {
  const { returnedTo, ...publicFields } = item;
  return publicFields;
}

export function stripPoliceFieldsFromList(items) {
  return items.map(stripPoliceFields);
}
