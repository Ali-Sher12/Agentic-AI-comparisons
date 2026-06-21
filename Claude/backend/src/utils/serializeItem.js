// Shapes an Item record for civilian/public consumption.
// Critically: never includes returnedToName / returnedToContact / returnedByUserId,
// since the public must never see who an item was returned to.
export function toPublicItem(item) {
  return {
    id: item.id,
    category: item.category,
    size: item.size,
    weight: item.weight,
    color: item.color,
    description: item.description,
    numberPlate: item.numberPlate,
    condition: item.condition,
    recoveredFrom: item.recoveredFrom,
    recoveryTime: item.recoveryTime,
    recoveryPlace: item.recoveryPlace,
    holdingHq: item.holdingHq
      ? { id: item.holdingHq.id, name: item.holdingHq.name, city: item.holdingHq.city }
      : null,
    uploadDate: item.uploadDate,
    isReturned: item.isReturned,
    returnedAt: item.returnedAt,
    // Intentionally omitted from public view: returnedToName, returnedToContact,
    // returnedByUserId, loggedByHq, claims.
  };
}

// Shapes an Item record for police consumption — full detail, including
// who it was returned to and which HQ logged it.
export function toPoliceItem(item) {
  return {
    id: item.id,
    category: item.category,
    size: item.size,
    weight: item.weight,
    color: item.color,
    description: item.description,
    numberPlate: item.numberPlate,
    condition: item.condition,
    recoveredFrom: item.recoveredFrom,
    recoveryTime: item.recoveryTime,
    recoveryPlace: item.recoveryPlace,
    holdingHq: item.holdingHq
      ? { id: item.holdingHq.id, name: item.holdingHq.name, city: item.holdingHq.city }
      : null,
    loggedByHq: item.loggedByHq
      ? { id: item.loggedByHq.id, name: item.loggedByHq.name, city: item.loggedByHq.city }
      : null,
    uploadDate: item.uploadDate,
    isReturned: item.isReturned,
    returnedAt: item.returnedAt,
    returnedToName: item.returnedToName,
    returnedToContact: item.returnedToContact,
    returnedByUser: item.returnedByUser
      ? { id: item.returnedByUser.id, username: item.returnedByUser.username }
      : null,
    claimCount: item.claims ? item.claims.length : undefined,
    pendingClaimCount: item.claims
      ? item.claims.filter((c) => c.status === "PENDING").length
      : undefined,
  };
}
